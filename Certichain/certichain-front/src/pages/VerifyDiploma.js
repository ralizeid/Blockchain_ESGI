import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../App.css';

const VerifyDiploma = () => {
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`/api/verify/${uuid}/`);
        if (res.status === 404) {
          setError("Ce lien de vérification est invalide ou n'existe pas.");
        } else {
          const data = await res.json();
          setResult(data);
        }
      } catch {
        setError("Impossible de contacter le serveur de vérification.");
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [uuid]);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Vérification en cours…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <div style={{ fontSize: '3rem' }}>❌</div>
        <h2 style={{ color: '#dc2626' }}>Lien invalide</h2>
        <p style={{ color: '#64748b' }}>{error}</p>
      </div>
    );
  }

  const { diploma, blockchain, data_deleted } = result;

  // ── Détermination du statut global ──────────────────────────────────────────
  const isRevoked   = diploma.blockchain_status === 'REVOKED' || (blockchain && blockchain.revoked);
  const isExpired   = !isRevoked && diploma.status === 'REVOKED';
  const isDeleted   = data_deleted;
  // ANCHORED en DB mais nœud blockchain indisponible ou redémarré (Hardhat dev)
  const isNodeDown  = !isRevoked && !isExpired && !isDeleted
                      && diploma.blockchain_status === 'ANCHORED'
                      && blockchain !== null && blockchain !== undefined
                      && blockchain.exists === false;
  const isAuthentic = !isRevoked && !isExpired && !isDeleted && !isNodeDown
                      && diploma.blockchain_status === 'ANCHORED'
                      && blockchain && blockchain.exists && !blockchain.revoked;

  const headerStyle = (bg, color) => ({
    padding: '20px',
    borderRadius: '8px',
    background: bg,
    color,
    textAlign: 'center',
    marginBottom: '20px',
  });

  const renderHeader = () => {
    if (isDeleted)   return (
      <div style={headerStyle('#f1f5f9', '#475569')}>
        <div style={{ fontSize: '2rem' }}>🗑️</div>
        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>DONNÉES SUPPRIMÉES</div>
        <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
          L'établissement a exercé le droit à l'oubli (RGPD Art. 17). Le hash
          sur la blockchain est une empreinte morte — aucune information
          personnelle ne peut plus être recalculée.
        </div>
      </div>
    );
    if (isRevoked)   return (
      <div style={headerStyle('#fdf4ff', '#7c3aed')}>
        <div style={{ fontSize: '2rem' }}>🚫</div>
        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>DIPLÔME RÉVOQUÉ</div>
        <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
          Ce diplôme a été révoqué par l'établissement émetteur. La révocation
          est permanente et enregistrée sur la blockchain.
        </div>
      </div>
    );
    if (isExpired)   return (
      <div style={headerStyle('#fff7ed', '#c2410c')}>
        <div style={{ fontSize: '2rem' }}>🕒</div>
        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>DIPLÔME EXPIRÉ</div>
        <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
          La date de validité de ce diplôme est dépassée.
        </div>
      </div>
    );
    if (isNodeDown)  return (
      <div style={headerStyle('#fefce8', '#854d0e')}>
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>NŒUD BLOCKCHAIN INDISPONIBLE</div>
        <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
          Ce diplôme est enregistré comme ancré dans la base de données, mais le nœud
          blockchain ne répond pas ou a été redémarré. Relancez Hardhat et
          redéployez le contrat pour rétablir la vérification en temps réel.
        </div>
      </div>
    );
    if (isAuthentic) return (
      <div style={headerStyle('#f0fdf4', '#166534')}>
        <div style={{ fontSize: '2rem' }}>✅</div>
        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>DIPLÔME AUTHENTIQUE</div>
        <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
          Ce diplôme est valide et son authenticité est confirmée sur la blockchain.
        </div>
      </div>
    );
    // Pending / not anchored
    return (
      <div style={headerStyle('#fffbeb', '#92400e')}>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>EN COURS DE VALIDATION</div>
        <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
          Ce diplôme n'est pas encore ancré sur la blockchain.
        </div>
      </div>
    );
  };

  const row = (label, value) => (
    <div className="certificate-row" key={label}>
      <span className="certificate-label">{label}</span>
      <b>{value}</b>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="certificate-result animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="certificate-header">VÉRIFICATION DE DIPLÔME — CertiChain</div>

        <div className="certificate-body">
          {renderHeader()}

          {!isDeleted && (
            <>
              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
                {diploma.first_name} {diploma.last_name}
              </h2>

              {row('Formation :', diploma.course_name)}
              {row("Date d'obtention :", diploma.graduation_date)}
              {row('Expiration :', diploma.expiry_date || 'N\'expire jamais')}
              {row('Émis le :', new Date(diploma.created_at).toLocaleDateString('fr-FR'))}
            </>
          )}

          {/* Bloc blockchain */}
          {diploma.diploma_hash && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px', color: '#334155', fontSize: '0.9rem' }}>
                🔗 Preuve Blockchain
              </h4>
              <div style={{ fontSize: '0.78rem', wordBreak: 'break-all', color: '#64748b', fontFamily: 'monospace' }}>
                <div><strong>Hash :</strong> {diploma.diploma_hash}</div>
                {diploma.blockchain_tx_hash && (
                  <div style={{ marginTop: '6px' }}><strong>Tx :</strong> {diploma.blockchain_tx_hash}</div>
                )}
                {blockchain && !blockchain.error && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', background: blockchain.exists ? '#dcfce7' : '#fee2e2', color: blockchain.exists ? '#166534' : '#991b1b', fontSize: '0.75rem' }}>
                      {blockchain.exists ? '✅ Trouvé on-chain' : '❌ Absent on-chain'}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', background: blockchain.revoked ? '#fdf4ff' : '#f0fdf4', color: blockchain.revoked ? '#7c3aed' : '#166534', fontSize: '0.75rem' }}>
                      {blockchain.revoked ? '🚫 Révoqué' : '✅ Non révoqué'}
                    </span>
                  </div>
                )}
                {blockchain && !blockchain.error && blockchain.school_addr && blockchain.school_addr !== '0x0000000000000000000000000000000000000000' && (
                  <div style={{ marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><strong>✍️ École :</strong> {blockchain.school_addr}</div>
                    <div><strong>✍️ Rectorat :</strong> {blockchain.rectorate_addr}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isDeleted && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#475569', fontSize: '0.85rem' }}>
              <strong>Droit à l'oubli (RGPD Art. 17)</strong><br />
              Les données personnelles liées à ce diplôme ont été supprimées à la
              demande de l'établissement ou de l'étudiant. Le hash cryptographique
              reste sur la blockchain à titre de preuve historique, mais sans les
              données d'entrée aucune vérification d'identité n'est plus possible.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyDiploma;
