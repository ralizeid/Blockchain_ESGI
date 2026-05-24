import React, { useState } from 'react';
import '../App.css';

const VerifierPortal = () => {
  const [query, setQuery]                     = useState('');
  const [results, setResults]                 = useState([]);
  const [selectedDiploma, setSelectedDiploma] = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [blockchainData, setBlockchainData]   = useState(null);
  const [bcLoading, setBcLoading]             = useState(false);
  const [copied, setCopied]                   = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setSelectedDiploma(null);
    setBlockchainData(null);
    try {
      const res  = await fetch(`/api/search/?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error("Erreur connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSelect = async (diploma) => {
    setSelectedDiploma(diploma);
    setBlockchainData(null);
    if (diploma.diploma_hash && diploma.blockchain_status === 'ANCHORED') {
      setBcLoading(true);
      try {
        const res  = await fetch(`/api/verify-blockchain/?hash=${diploma.diploma_hash}`);
        const data = await res.json();
        setBlockchainData(data);
      } catch (_) {
        setBlockchainData({ error: true });
      } finally {
        setBcLoading(false);
      }
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = (diploma) => {
    if (diploma.blockchain_status === 'REVOKED')
      return <span className="status-badge status-badge--revoked">Révoqué 🚫</span>;
    if (diploma.status === 'REVOKED')
      return <span className="status-badge status-badge--expired">Expiré 🕒</span>;
    if (diploma.blockchain_status === 'ANCHORED')
      return <span className="status-badge status-badge--anchored">Ancré blockchain</span>;
    if (diploma.blockchain_status === 'FAILED')
      return <span className="status-badge status-badge--failed">Échec ancrage</span>;
    return <span className="status-badge status-badge--unanchored">Non ancré</span>;
  };

  return (
    <div className="dashboard-container">
      <h1 style={{ textAlign: 'center' }}>Vérification Publique</h1>
      <p className="page-subtitle" style={{ textAlign: 'center' }}>
        Recherchez un diplôme par nom de famille ou identifiant, puis vérifiez son authenticité sur la blockchain.
      </p>

      {/* Barre de recherche */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
        <input
          className="input-field"
          placeholder="Nom de famille ou ID du diplôme..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ maxWidth: '400px' }}
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading} style={{ width: 'auto' }}>
          {loading ? '…' : 'Rechercher'}
        </button>
      </div>

      {/* LISTE DES RÉSULTATS */}
      {!selectedDiploma && results.length > 0 && (
        <div className="form-card animate-fade-in">
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>{results.length} Résultat(s)</h3>
          {results.map(d => (
            <div key={d.id} className="diploma-row" onClick={() => handleSelect(d)}>
              <div className="diploma-row__info">
                <span className="diploma-row__name">{d.last_name.toUpperCase()} {d.first_name}</span>
                <span className="diploma-row__meta">{d.course_name} • {d.graduation_date}</span>
              </div>
              <div className="diploma-row__actions">
                {statusBadge(d)}
                <button className="btn btn-secondary" style={{ width: 'auto', padding: '5px 15px', fontSize: '0.8rem' }}>
                  Voir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DÉTAIL DU DIPLÔME SÉLECTIONNÉ */}
      {selectedDiploma && (
        <div className="form-card animate-fade-in">

          {/* Bannière de statut */}
          {selectedDiploma.blockchain_status === 'REVOKED' ? (
            <div className="status-banner status-banner--revoked">
              <div className="status-banner__icon">🚫</div>
              <div className="status-banner__title">DIPLÔME RÉVOQUÉ</div>
              <div className="status-banner__desc">Ce diplôme a été révoqué par l'établissement émetteur.</div>
            </div>
          ) : selectedDiploma.status === 'REVOKED' ? (
            <div className="status-banner status-banner--expired">
              <div className="status-banner__icon">🕒</div>
              <div className="status-banner__title">DIPLÔME EXPIRÉ</div>
              <div className="status-banner__desc">La date de validité de ce diplôme est dépassée.</div>
            </div>
          ) : (
            <div className="status-banner status-banner--authentic">
              <div className="status-banner__icon">✅</div>
              <div className="status-banner__title">DIPLÔME AUTHENTIQUE</div>
              <div className="status-banner__desc">Ce diplôme a été émis et validé via CertiChain.</div>
            </div>
          )}

          {/* Informations principales */}
          <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>
            {selectedDiploma.first_name} {selectedDiploma.last_name}
          </h2>
          <p className="page-subtitle" style={{ textAlign: 'center' }}>
            {selectedDiploma.course_name} &bull; {selectedDiploma.graduation_date}
          </p>

          {/* Rows détail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '24px' }}>
            <div className="diploma-row" style={{ cursor: 'default' }}>
              <span className="diploma-row__meta">ID Unique</span>
              <strong>#{selectedDiploma.id}</strong>
            </div>
            <div className="diploma-row" style={{ cursor: 'default' }}>
              <span className="diploma-row__meta">Statut blockchain</span>
              {statusBadge(selectedDiploma)}
            </div>
          </div>

          {/* Preuve blockchain */}
          {selectedDiploma.diploma_hash && (
            <div className="blockchain-block">
              <div className="blockchain-block__title">🔗 Empreinte cryptographique (SHA-256)</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                <code className="blockchain-block__hash" style={{ flex: 1 }}>
                  {selectedDiploma.diploma_hash}
                </code>
                <button
                  className="btn btn-secondary"
                  style={{ width: 'auto', padding: '4px 12px', fontSize: '0.78rem', flexShrink: 0 }}
                  onClick={() => copyHash(selectedDiploma.diploma_hash)}
                >
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <p style={{ color: 'var(--text-3)', fontSize: '0.78rem', marginTop: '8px', marginBottom: 0 }}>
                Ce hash est une empreinte pseudonymisée. Aucune donnée personnelle n'est stockée sur la blockchain.
              </p>
            </div>
          )}

          {/* Vérification en temps réel */}
          {selectedDiploma.blockchain_status === 'ANCHORED' && (
            <div className="blockchain-live">
              <div className="blockchain-live__title">Vérification blockchain en temps réel</div>
              {bcLoading && <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', margin: 0 }}>Consultation du contrat…</p>}
              {!bcLoading && blockchainData && !blockchainData.error && (
                <div className="blockchain-live__rows">
                  <div>
                    Certifié : <strong className={blockchainData.certified ? 'v-ok' : 'v-err'}>
                      {blockchainData.certified ? 'Oui' : 'Non'}
                    </strong>
                  </div>
                  <div>
                    Statut : <strong className={blockchainData.revoked ? 'v-err' : 'v-ok'}>
                      {blockchainData.revoked ? 'Révoqué' : 'Valide'}
                    </strong>
                  </div>
                  {blockchainData.school_addr && blockchainData.school_addr !== '0x0000000000000000000000000000000000000000' && (
                    <div className="blockchain-addresses">
                      <div>Signature école : <code>{blockchainData.school_addr}</code></div>
                      <div>Signature rectorat : <code>{blockchainData.rectorate_addr}</code></div>
                    </div>
                  )}
                  {blockchainData.issued_at > 0 && (
                    <div>
                      Date d'ancrage : <strong>{new Date(blockchainData.issued_at * 1000).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                    </div>
                  )}
                </div>
              )}
              {!bcLoading && blockchainData?.error && (
                <p style={{ color: '#d97706', fontSize: '0.85rem', margin: 0 }}>
                  Impossible de contacter la blockchain (nœud hors ligne ?). La preuve hors-chaîne reste valide.
                </p>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setSelectedDiploma(null); setBlockchainData(null); }}
              style={{ width: 'auto' }}
            >
              ← Retour à la recherche
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifierPortal;
