import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import '../App.css';

const VerifyDiploma = () => {
  const { uuid }           = useParams();
  const [searchParams]     = useSearchParams();
  // Ce token n'est présent que dans le lien privé transmis à l'étudiant.
  // Le QR code public ne le contient jamais → les recruteurs ne voient pas le bouton.
  const erasureToken       = searchParams.get('erase');

  const [loading, setLoading] = useState(true);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  // Droit à l'oubli – état local
  // étapes : 'idle' | 'confirm' | 'sending' | 'otp_sent' | 'verifying' | 'done' | 'error'
  const [erasureStep, setErasureStep] = useState('idle');
  const [erasureMsg, setErasureMsg]   = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [otpInput, setOtpInput]       = useState('');

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

  // Étape 1 : demander l'envoi du code OTP
  const handleRequestOtp = async () => {
    setErasureStep('sending');
    try {
      const res  = await fetch('/api/student-erasure/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ uuid, deletion_token: erasureToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailMasked(data.email_masked);
        setErasureStep('otp_sent');
      } else {
        setErasureMsg(data.error || 'Une erreur est survenue.');
        setErasureStep('error');
      }
    } catch {
      setErasureMsg('Impossible de contacter le serveur.');
      setErasureStep('error');
    }
  };

  // Étape 2 : confirmer avec le code OTP reçu par email
  const handleConfirmOtp = async () => {
    setErasureStep('verifying');
    try {
      const res  = await fetch('/api/student-erasure/confirm/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ uuid, deletion_token: erasureToken, otp: otpInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setErasureStep('done');
        setErasureMsg(data.message);
        await doVerify();
      } else {
        setErasureMsg(data.error || 'Code invalide.');
        setErasureStep('otp_sent'); // on reste sur la saisie pour réessayer
      }
    } catch {
      setErasureMsg('Impossible de contacter le serveur.');
      setErasureStep('otp_sent');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="state-center">
          <div className="state-center__icon">⏳</div>
          <p className="state-center__msg">Vérification en cours…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="state-center state-center--error">
          <div className="state-center__icon">❌</div>
          <h2 className="state-center__title">Lien invalide</h2>
          <p className="state-center__msg">{error}</p>
        </div>
      </div>
    );
  }

  const { diploma, blockchain, data_deleted } = result;

  // ── Détermination du statut global ──────────────────────────────────────────
  const isRevoked   = diploma.blockchain_status === 'REVOKED' || (blockchain && blockchain.revoked);
  const isExpired   = !isRevoked && diploma.status === 'REVOKED';
  const isDeleted   = data_deleted;
  const isNodeDown  = !isRevoked && !isExpired && !isDeleted
                      && diploma.blockchain_status === 'ANCHORED'
                      && blockchain !== null && blockchain !== undefined
                      && blockchain.exists === false;
  const isAuthentic = !isRevoked && !isExpired && !isDeleted && !isNodeDown
                      && diploma.blockchain_status === 'ANCHORED'
                      && blockchain && blockchain.exists && !blockchain.revoked;

  const renderHeader = () => {
    if (isDeleted)   return (
      <div className="status-banner status-banner--deleted">
        <div className="status-banner__icon">🗑️</div>
        <div className="status-banner__title">DONNÉES SUPPRIMÉES</div>
        <div className="status-banner__desc">
          L'établissement a exercé le droit à l'oubli (RGPD Art. 17). Le hash
          sur la blockchain est une empreinte morte — aucune information
          personnelle ne peut plus être recalculée.
        </div>
      </div>
    );
    if (isRevoked)   return (
      <div className="status-banner status-banner--revoked">
        <div className="status-banner__icon">🚫</div>
        <div className="status-banner__title">DIPLÔME RÉVOQUÉ</div>
        <div className="status-banner__desc">
          Ce diplôme a été révoqué par l'établissement émetteur. La révocation
          est permanente et enregistrée sur la blockchain.
        </div>
      </div>
    );
    if (isExpired)   return (
      <div className="status-banner status-banner--expired">
        <div className="status-banner__icon">🕒</div>
        <div className="status-banner__title">DIPLÔME EXPIRÉ</div>
        <div className="status-banner__desc">La date de validité de ce diplôme est dépassée.</div>
      </div>
    );
    if (isNodeDown)  return (
      <div className="status-banner status-banner--nodedown">
        <div className="status-banner__icon">⚠️</div>
        <div className="status-banner__title">NŒUD BLOCKCHAIN INDISPONIBLE</div>
        <div className="status-banner__desc">
          Ce diplôme est enregistré comme ancré dans la base de données, mais le nœud
          blockchain ne répond pas ou a été redémarré. Relancez Hardhat et
          redéployez le contrat pour rétablir la vérification en temps réel.
        </div>
      </div>
    );
    if (isAuthentic) return (
      <div className="status-banner status-banner--authentic">
        <div className="status-banner__icon">✅</div>
        <div className="status-banner__title">DIPLÔME AUTHENTIQUE</div>
        <div className="status-banner__desc">
          Émis par <strong>{diploma.school_name}</strong> et validé par le Rectorat
          pour <strong>{diploma.first_name} {diploma.last_name}</strong>.
        </div>
      </div>
    );
    // Pending / not anchored
    return (
      <div className="status-banner status-banner--pending">
        <div className="status-banner__icon">⏳</div>
        <div className="status-banner__title">EN COURS DE VALIDATION</div>
        <div className="status-banner__desc">Ce diplôme n'est pas encore ancré sur la blockchain.</div>
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
              {/* Photo d'identité – portrait rond (Scénario C : usurpation) */}
              {diploma.photo_url && (
                <div className="identity-photo-wrap">
                  <img
                    src={diploma.photo_url}
                    alt="Identité visuelle"
                    className="identity-photo"
                  />
                  <div className="identity-photo-caption">
                    Photo d'identité officielle – vérifiez que la personne en face correspond
                  </div>
                </div>
              )}

              <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
                {diploma.first_name} {diploma.last_name}
              </h2>

              {row('Formation :', diploma.course_name)}
              {diploma.date_of_birth && row('Date de naissance :', new Date(diploma.date_of_birth).toLocaleDateString('fr-FR'))}
              {row("Date d'obtention :", diploma.graduation_date)}
              {row('Expiration :', diploma.expiry_date || "N'expire jamais")}
              {diploma.school_name && row('Établissement :', diploma.school_name)}
              {row('Émis le :', new Date(diploma.created_at).toLocaleDateString('fr-FR'))}

              {/* Lien vers le document diplôme */}
              {diploma.image_url && (
                <div style={{ marginTop: 14, textAlign: 'center' }}>
                  <a
                    href={diploma.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="diploma-doc-link"
                  >
                    📄 Consulter le document officiel du diplôme
                  </a>
                </div>
              )}
            </>
          )}

          {/* Bloc blockchain */}
          {diploma.diploma_hash && (
            <div className="blockchain-block">
              <div className="blockchain-block__title">🔗 Preuve Blockchain</div>
              <div className="blockchain-block__hash">
                <div><strong>Hash :</strong> {diploma.diploma_hash}</div>
                {diploma.blockchain_tx_hash && (
                  <div style={{ marginTop: '6px' }}><strong>Tx :</strong> {diploma.blockchain_tx_hash}</div>
                )}
              </div>
              {blockchain && !blockchain.error && (
                <div className="blockchain-block__chips">
                  <span className={`blockchain-chip ${blockchain.exists ? 'blockchain-chip--ok' : 'blockchain-chip--error'}`}>
                    {blockchain.exists ? '✅ Trouvé on-chain' : '❌ Absent on-chain'}
                  </span>
                  <span className={`blockchain-chip ${blockchain.revoked ? 'blockchain-chip--revoked' : 'blockchain-chip--valid'}`}>
                    {blockchain.revoked ? '🚫 Révoqué' : '✅ Non révoqué'}
                  </span>
                </div>
              )}
              {blockchain && !blockchain.error && blockchain.school_addr && blockchain.school_addr !== '0x0000000000000000000000000000000000000000' && (
                <div className="blockchain-addresses">
                  <div><strong>✍️ École :</strong> {blockchain.school_addr}</div>
                  <div><strong>✍️ Rectorat :</strong> {blockchain.rectorate_addr}</div>
                </div>
              )}
            </div>
          )}

          {isDeleted && (
            <div className="blockchain-block" style={{ background: '#f1f5f9', borderColor: '#cbd5e1' }}>
              <strong>Droit à l'oubli (RGPD Art. 17)</strong><br />
              <span style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                Les données personnelles liées à ce diplôme ont été supprimées à la
                demande de l'établissement ou de l'étudiant. Le hash cryptographique
                reste sur la blockchain à titre de preuve historique, mais sans les
                données d'entrée aucune vérification d'identité n'est plus possible.
              </span>
            </div>
          )}

          {/* ── Droit à l'oubli étudiant (RGPD Art. 17) ── visible uniquement avec le lien privé */}
          {!isDeleted && erasureStep !== 'done' && erasureToken && (
            <details className="erasure-section">
              <summary>🛡️ Exercer mon droit à l'oubli (RGPD Art. 17)</summary>
              <div className="erasure-body">
                <p>
                  En tant que titulaire de ce diplôme, vous pouvez demander la suppression
                  de vos données personnelles (prénom, nom, photo). Le hash cryptographique
                  sera conservé sur la blockchain (Art. 17.3.b du RGPD) mais sans les
                  données sources il devient intraçable.
                </p>
                <p className="erasure-warn-text">
                  ⚠️ Cette action est irréversible. Un code de confirmation vous sera envoyé par email.
                </p>

                {/* Étape 1 : bouton initial */}
                {erasureStep === 'idle' && (
                  <button className="erasure-idle-btn" onClick={() => setErasureStep('confirm')}>
                    Demander la suppression de mes données
                  </button>
                )}

                {/* Étape 1b : confirmation avant envoi email */}
                {erasureStep === 'confirm' && (
                  <div className="erasure-confirm-box">
                    <p>
                      Un code de confirmation va être envoyé à votre adresse email enregistrée.
                      Confirmez-vous cette demande ?
                    </p>
                    <div className="erasure-box-btns">
                      <button className="erasure-btn-danger" onClick={handleRequestOtp}>
                        Oui, envoyer le code
                      </button>
                      <button className="erasure-btn-ghost" onClick={() => setErasureStep('idle')}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Envoi en cours */}
                {erasureStep === 'sending' && (
                  <p style={{ color: 'var(--text-3)' }}>⏳ Envoi du code en cours…</p>
                )}

                {/* Étape 2 : saisie du code OTP */}
                {erasureStep === 'otp_sent' && (
                  <div className="erasure-otp-box">
                    <div className="erasure-otp-box__header">
                      📧 Code envoyé à <strong>{emailMasked}</strong>
                    </div>
                    <div className="erasure-otp-box__hint">
                      Saisissez le code à 6 chiffres reçu par email (valable 30 minutes).
                      Si vous n'avez plus accès à cet email, contactez directement votre établissement.
                    </div>
                    {erasureMsg && (
                      <div className="erasure-otp-box__err">⚠️ {erasureMsg}</div>
                    )}
                    <div className="erasure-otp-row">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        className="erasure-otp-input"
                      />
                      <button
                        className="erasure-btn-danger"
                        onClick={handleConfirmOtp}
                        disabled={otpInput.length !== 6}
                        style={{ opacity: otpInput.length === 6 ? 1 : 0.5, cursor: otpInput.length === 6 ? 'pointer' : 'not-allowed' }}
                      >
                        Confirmer la suppression
                      </button>
                      <button
                        className="erasure-btn-ghost"
                        onClick={() => { setErasureStep('idle'); setOtpInput(''); setErasureMsg(''); }}
                      >
                        Annuler
                      </button>
                    </div>
                    <div className="erasure-resend-row">
                      Vous n'avez pas reçu le code ?{' '}
                      <button
                        className="erasure-resend-btn"
                        onClick={() => { setOtpInput(''); setErasureMsg(''); handleRequestOtp(); }}
                      >
                        Renvoyer
                      </button>
                    </div>
                  </div>
                )}

                {/* Vérification en cours */}
                {erasureStep === 'verifying' && (
                  <p style={{ color: 'var(--text-3)' }}>⏳ Vérification du code…</p>
                )}

                {/* Erreur générale */}
                {erasureStep === 'error' && (
                  <div className="erasure-error-box">
                    <p>⚠️ {erasureMsg}</p>
                    <button
                      className="erasure-btn-ghost"
                      onClick={() => { setErasureStep('idle'); setErasureMsg(''); }}
                    >
                      Retour
                    </button>
                  </div>
                )}
              </div>
            </details>
          )}

          {erasureStep === 'done' && (
            <div className="erasure-done-box">✅ {erasureMsg}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyDiploma;
