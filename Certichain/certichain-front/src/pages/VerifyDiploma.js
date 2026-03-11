import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import '../App.css';

const VerifyDiploma = () => {
  const { uuid }                   = useParams();
  const [searchParams]             = useSearchParams();
  // Ce token n'est présent que dans le lien privé transmis à l'étudiant.
  // Le QR code public ne le contient jamais → les recruteurs ne voient pas le bouton.
  const erasureToken               = searchParams.get('erase');

  const [loading, setLoading] = useState(true);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  // Droit à l'oubli – état local
  const [erasureStep, setErasureStep]   = useState('idle'); // 'idle'|'confirm'|'pending'|'done'|'error'
  const [erasureMsg, setErasureMsg]     = useState('');

  const doVerify = useCallback(async () => {
    setLoading(true);
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
  }, [uuid]);

  useEffect(() => { doVerify(); }, [doVerify]);

  const handleErasure = async () => {
    setErasureStep('pending');
    try {
      const res  = await fetch('/api/student-erasure/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ uuid, deletion_token: erasureToken, confirm: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setErasureStep('done');
        setErasureMsg(data.message);
        // Recharger la page de vérification pour refléter l'état "données supprimées"
        await doVerify();
      } else {
        setErasureStep('error');
        setErasureMsg(data.error || 'Une erreur est survenue.');
      }
    } catch {
      setErasureStep('error');
      setErasureMsg('Impossible de contacter le serveur.');
    }
  };

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
        <div style={{ fontSize: '0.85rem', marginTop: '6px', lineHeight: 1.5 }}>
          Émis par <strong>{diploma.school_name}</strong> et validé par le Rectorat
          pour <strong>{diploma.first_name} {diploma.last_name}</strong>.
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
  // ── Détection de type de fichier pour affichage conditionnel ────────────────
  const isImageUrl = (url) => url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);
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
              {/* Photo d'identité – portrait rond (Scénario C : usurpation) */}
              {diploma.photo_url && (
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <img
                    src={diploma.photo_url}
                    alt="Photo d'identité"
                    style={{
                      width: 110, height: 110, objectFit: 'cover',
                      borderRadius: '50%', border: '3px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 5, fontStyle: 'italic' }}>
                    Photo d’identité officielle – vérifiez que la personne en face correspond
                  </div>
                </div>
              )}

              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
                {diploma.first_name} {diploma.last_name}
              </h2>

              {row('Formation :', diploma.course_name)}
              {diploma.date_of_birth && row('Date de naissance :', new Date(diploma.date_of_birth).toLocaleDateString('fr-FR'))}
              {row("Date d'obtention :", diploma.graduation_date)}
              {row('Expiration :', diploma.expiry_date || "N'expire jamais")}
              {diploma.school_name && row('Établissement :', diploma.school_name)}
              {row('Émis le :', new Date(diploma.created_at).toLocaleDateString('fr-FR'))}

              {/* Lien vers le document diplôme */}
              {diploma.image_url && (
                <div style={{ marginTop: 14, textAlign: 'center' }}>
                  <a
                    href={diploma.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'underline', fontSize: '0.85rem' }}
                  >
                    📄 Consulter le document officiel du diplôme
                  </a>
                </div>
              )}
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

          {/* ── Droit à l'oubli étudiant (RGPD Art. 17) ── visible uniquement avec le lien privé */}
          {!isDeleted && erasureStep !== 'done' && erasureToken && (
            <div style={{ marginTop: 28, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
              <details>
                <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#64748b', userSelect: 'none' }}>
                  🛡️ Exercer mon droit à l'oubli (RGPD Art. 17)
                </summary>
                <div style={{ marginTop: 14, fontSize: '0.85rem', color: '#475569' }}>
                  <p style={{ margin: '0 0 12px' }}>
                    En tant que titulaire de ce diplôme, vous pouvez demander la suppression
                    de vos données personnelles (prénom, nom, date d'obtention, photo).
                    Le hash cryptographique sera conservé sur la blockchain à titre
                    de preuve historique, conformément à l'Art. 17.3.b du RGPD, mais
                    sans les données sources il devient intraçable.
                  </p>
                  <p style={{ margin: '0 0 16px', color: '#dc2626', fontWeight: 600 }}>
                    ⚠️ Cette action est irréversible. Le lien de ce diplôme sera aussi invalidé.
                  </p>

                  {erasureStep === 'idle' && (
                    <button
                      onClick={() => setErasureStep('confirm')}
                      style={{ background: 'none', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      Demander la suppression de mes données
                    </button>
                  )}

                  {erasureStep === 'confirm' && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16 }}>
                      <p style={{ margin: '0 0 14px', fontWeight: 600, color: '#991b1b' }}>
                        Confirmez-vous la suppression définitive de vos données personnelles ?
                      </p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={handleErasure}
                          style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          Oui, supprimer définitivement
                        </button>
                        <button
                          onClick={() => setErasureStep('idle')}
                          style={{ background: 'none', border: '1px solid #94a3b8', color: '#475569', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {erasureStep === 'pending' && (
                    <p style={{ color: '#64748b' }}>⏳ Suppression en cours…</p>
                  )}

                  {erasureStep === 'error' && (
                    <p style={{ color: '#dc2626' }}>⚠️ {erasureMsg}</p>
                  )}
                </div>
              </details>
            </div>
          )}

          {erasureStep === 'done' && (
            <div style={{ marginTop: 20, padding: 16, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, color: '#166534', fontSize: '0.85rem' }}>
              ✅ {erasureMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyDiploma;
