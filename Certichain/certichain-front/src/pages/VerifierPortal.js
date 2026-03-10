import React, { useState } from 'react';
import '../App.css';

const VerifierPortal = () => {
  const [query, setQuery]                   = useState('');
  const [results, setResults]               = useState([]);
  const [selectedDiploma, setSelectedDiploma] = useState(null);
  const [loading, setLoading]               = useState(false);
  const [blockchainData, setBlockchainData] = useState(null);
  const [bcLoading, setBcLoading]           = useState(false);
  const [copied, setCopied]                 = useState(false);

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
      return <span style={badge('#7c3aed', '#fdf4ff')}>Révoqué 🚫</span>;
    if (diploma.status === 'REVOKED')
      return <span style={badge('#c2410c', '#fff7ed')}>Expiré 🕒</span>;
    if (diploma.blockchain_status === 'ANCHORED')
      return <span style={badge('#16a34a', '#f0fdf4')}>Ancré blockchain</span>;
    if (diploma.blockchain_status === 'FAILED')
      return <span style={badge('#d97706', '#fffbeb')}>Échec ancrage</span>;
    return <span style={badge('#64748b', '#f8fafc')}>Non ancré</span>;
  };

  const badge = (color, bg) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color,
    background: bg,
    border: `1px solid ${color}33`,
  });

  return (
    <div className="dashboard-container">
      <h1 style={{ textAlign: 'center' }}>Vérification Publique</h1>
      <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: '28px', fontSize: '0.9rem' }}>
        Recherchez un diplôme par nom de famille ou identifiant, puis vérifiez son authenticité sur la blockchain.
      </p>

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
          {loading ? '...' : 'Rechercher'}
        </button>
      </div>

      {/* LISTE DES RÉSULTATS */}
      {!selectedDiploma && results.length > 0 && (
        <div className="form-card animate-fade-in">
          <h3 style={{ marginTop: 0 }}>{results.length} Résultat(s)</h3>
          {results.map(d => (
            <div
              key={d.id}
              onClick={() => handleSelect(d)}
              style={{
                padding: '14px', borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseOver={e  => e.currentTarget.style.background = '#f8fafc'}
              onMouseOut={e   => e.currentTarget.style.background = 'white'}
            >
              <div>
                <strong>{d.last_name.toUpperCase()} {d.first_name}</strong>
                <div style={{ color: '#64748b', fontSize: '0.9em' }}>{d.course_name} • {d.graduation_date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

          {/* En-tête : valide, expiré ou révoqué */}
          {selectedDiploma.blockchain_status === 'REVOKED' ? (
            <div style={{ background: '#fdf4ff', border: '1px solid #d8b4fe', borderRadius: '8px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontWeight: '700', color: '#7c3aed', fontSize: '1rem' }}>DIPLÔME RÉVOQUÉ</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                Ce diplôme a été révoqué par l'établissement émetteur.
              </div>
            </div>
          ) : selectedDiploma.status === 'REVOKED' ? (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontWeight: '700', color: '#c2410c', fontSize: '1rem' }}>DIPLÔME EXPIRÉ</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                La date de validité de ce diplôme est dépassée.
              </div>
            </div>
          ) : (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontWeight: '700', color: '#16a34a', fontSize: '1rem' }}>DIPLÔME AUTHENTIQUE</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                Ce diplôme a été émis et validé via CertiChain.
              </div>
            </div>
          )}

          {/* Informations principales */}
          <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>
            {selectedDiploma.first_name} {selectedDiploma.last_name}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: '24px' }}>
            {selectedDiploma.course_name} &bull; {selectedDiploma.graduation_date}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>ID Unique</span>
              <strong>#{selectedDiploma.id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>Statut blockchain</span>
              {statusBadge(selectedDiploma)}
            </div>
          </div>

          {/* Preuve blockchain */}
          {selectedDiploma.diploma_hash && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>
                Empreinte cryptographique (SHA-256)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <code style={{ fontSize: '0.78rem', color: '#475569', wordBreak: 'break-all', flex: 1 }}>
                  {selectedDiploma.diploma_hash}
                </code>
                <button
                  className="btn btn-secondary"
                  style={{ width: 'auto', padding: '4px 12px', fontSize: '0.78rem' }}
                  onClick={() => copyHash(selectedDiploma.diploma_hash)}
                >
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <p style={{ color: 'var(--gray)', fontSize: '0.78rem', marginTop: '8px', marginBottom: 0 }}>
                Ce hash est une empreinte pseudonymisée. Aucune donnée personnelle n'est stockée sur la blockchain.
              </p>
            </div>
          )}

          {/* Résultat de la vérification blockchain en temps réel */}
          {selectedDiploma.blockchain_status === 'ANCHORED' && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '0.9rem', color: '#16a34a' }}>
                Vérification blockchain en temps réel
              </div>
              {bcLoading && <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>Consultation du contrat…</p>}
              {!bcLoading && blockchainData && !blockchainData.error && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div>Certifié : <strong style={{ color: blockchainData.certified ? '#16a34a' : '#dc2626' }}>
                    {blockchainData.certified ? 'Oui' : 'Non'}
                  </strong></div>
                  <div>Statut : <strong style={{ color: blockchainData.revoked ? '#dc2626' : '#16a34a' }}>
                    {blockchainData.revoked ? 'Révoqué' : 'Valide'}
                  </strong></div>
                  {blockchainData.school_addr && blockchainData.school_addr !== '0x0000000000000000000000000000000000000000' && (
                    <>
                      <div style={{ wordBreak: 'break-all' }}>
                        Signature école : <code style={{ fontSize: '0.78rem', color: '#475569' }}>{blockchainData.school_addr}</code>
                      </div>
                      <div style={{ wordBreak: 'break-all' }}>
                        Signature rectorat : <code style={{ fontSize: '0.78rem', color: '#475569' }}>{blockchainData.rectorate_addr}</code>
                      </div>
                    </>
                  )}
                  {blockchainData.issued_at > 0 && (
                    <div>
                      Date d'ancrage : <strong>{new Date(blockchainData.issued_at * 1000).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                    </div>
                  )}
                </div>
              )}
              {!bcLoading && blockchainData?.error && (
                <p style={{ color: '#d97706', fontSize: '0.85rem' }}>
                  Impossible de contacter la blockchain (nœud hors ligne ?). La preuve hors-chaîne reste valide.
                </p>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
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
