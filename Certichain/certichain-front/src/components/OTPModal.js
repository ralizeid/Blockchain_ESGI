import React, { useState, useEffect } from 'react';

/**
 * Modal de validation par code OTP envoyé par email.
 *
 * Flux :
 *   1. L'utilisateur voit le résumé de l'action + bouton "Recevoir le code".
 *   2. L'appui envoie POST /api/send-action-otp/ → affiche champ de saisie.
 *   3. L'utilisateur entre le code → "Valider l'action" → onConfirm(otpCode).
 *   4. onConfirm doit retourner { ok: true } (succès) ou { ok: false, error: '...' } (échec).
 *      Sur succès le parent ferme la modale (open = false).
 *      Sur échec la modale reste ouverte et affiche l'erreur.
 *
 * Props :
 *   open         – boolean
 *   userId       – user_id sessionStorage
 *   actionType   – 'CREATE_DIPLOMA' | 'REVOKE_DIPLOMA' | 'ERASE_DIPLOMA'
 *                  | 'UPDATE_PROFILE' | 'CHANGE_PASSWORD' | 'DELETE_ACCOUNT'
 *   title        – titre affiché
 *   message      – phrase de description
 *   details      – string ou JSX (boîte grise) — optionnel
 *   onConfirm    – async (otpCode) => { ok, error }
 *   onCancel     – () => void
 */
const OTPModal = ({
  open,
  userId,
  actionType,
  title,
  message,
  details,
  onConfirm,
  onCancel,
}) => {
  const [step, setStep]             = useState('ready');   // ready | sending | sent | submitting
  const [emailMasked, setEmailMasked] = useState('');
  const [otpCode, setOtpCode]       = useState('');
  const [error, setError]           = useState('');
  const [countdown, setCountdown]   = useState(600);        // 10 min en secondes

  // Réinitialiser à chaque ouverture
  useEffect(() => {
    if (open) {
      setStep('ready');
      setOtpCode('');
      setError('');
      setCountdown(600);
    }
  }, [open]);

  // Décompte une fois le code envoyé
  useEffect(() => {
    if (step !== 'sent') return;
    setCountdown(600);
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const formatTime = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const sendCode = async () => {
    setStep('sending');
    setError('');
    try {
      const res  = await fetch('/api/send-action-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action_type: actionType }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailMasked(data.email_masked);
        setStep('sent');
      } else {
        setError(data.error || "Erreur lors de l'envoi du code.");
        setStep('ready');
      }
    } catch {
      setError('Erreur serveur.');
      setStep('ready');
    }
  };

  const handleSubmit = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      setError('Entrez un code à 6 chiffres.');
      return;
    }
    if (countdown === 0) {
      setError('Code expiré. Renvoyez un nouveau code.');
      return;
    }
    setStep('submitting');
    setError('');
    const result = await onConfirm(otpCode);
    if (result && !result.ok) {
      setError(result.error || 'Code incorrect ou expiré.');
      setStep('sent');
    }
    // Si result.ok === true, le parent a déjà fermé la modale (open = false)
  };

  if (!open) return null;

  const isSubmitting = step === 'submitting';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.55)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={!isSubmitting ? onCancel : undefined}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 14,
          padding: '32px',
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '1.1rem' }}>{title}</h3>
        <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '0.95rem', lineHeight: 1.6 }}>
          {message}
        </p>

        {/* Détails optionnels */}
        {details && (
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '12px 16px', marginBottom: 18,
            fontSize: '0.875rem', color: '#334155',
          }}>
            {typeof details === 'string' ? <p style={{ margin: 0 }}>{details}</p> : details}
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            color: '#dc2626', fontSize: '0.875rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ÉTAPE : ready | sending */}
        {(step === 'ready' || step === 'sending') && (
          <>
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 8, padding: '11px 14px', marginBottom: 20,
              color: '#1e40af', fontSize: '0.875rem',
            }}>
              🔐 Pour confirmer cette action, un code de validation à 6 chiffres sera envoyé
              à l'adresse email associée à votre compte.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onCancel}
                style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: 500 }}
              >
                Annuler
              </button>
              <button
                onClick={sendCode}
                disabled={step === 'sending'}
                style={{
                  flex: 1, padding: '9px 20px', borderRadius: 7, border: 'none',
                  background: '#2563eb', color: 'white',
                  cursor: step === 'sending' ? 'not-allowed' : 'pointer',
                  fontWeight: 600, opacity: step === 'sending' ? 0.7 : 1,
                }}
              >
                {step === 'sending' ? '⏳ Envoi en cours…' : '📧 Recevoir le code par email'}
              </button>
            </div>
          </>
        )}

        {/* ÉTAPE : sent | submitting */}
        {(step === 'sent' || step === 'submitting') && (
          <>
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: '0.875rem', color: '#166534',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>✉️ Code envoyé à <strong>{emailMasked}</strong></span>
              {countdown > 0
                ? <span style={{ color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>⏱ {formatTime(countdown)}</span>
                : <span style={{ color: '#dc2626', fontWeight: 600 }}>Expiré</span>
              }
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>
                Code de validation (6 chiffres)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                disabled={isSubmitting}
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 16px', borderRadius: 8,
                  border: '2px solid #e2e8f0', outline: 'none',
                  letterSpacing: '0.35em', textAlign: 'center',
                  fontSize: '1.5rem', fontWeight: 700,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: isSubmitting ? 0.6 : 1 }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || countdown === 0 || otpCode.length !== 6}
                style={{
                  flex: 1, padding: '9px 20px', borderRadius: 7, border: 'none',
                  background: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 600,
                  opacity: (isSubmitting || countdown === 0 || otpCode.length !== 6) ? 0.6 : 1,
                }}
              >
                {isSubmitting ? '⏳ Validation…' : "✅ Valider l'action"}
              </button>
            </div>

            {countdown > 0 ? (
              <p style={{ margin: 0, textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                Pas reçu ?{' '}
                <button
                  onClick={sendCode}
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem', padding: 0 }}
                >
                  Renvoyer le code
                </button>
              </p>
            ) : (
              <button
                onClick={sendCode}
                style={{ width: '100%', padding: '9px', borderRadius: 7, border: 'none', background: '#f59e0b', color: 'white', cursor: 'pointer', fontWeight: 600, marginTop: 4 }}
              >
                🔄 Code expiré – Renvoyer un nouveau code
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OTPModal;
