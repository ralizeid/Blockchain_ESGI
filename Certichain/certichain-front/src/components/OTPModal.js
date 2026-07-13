import React, { useState, useEffect } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import '../App.css';

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
  const [step, setStep]               = useState('ready');   // ready | sending | sent | submitting
  const [emailMasked, setEmailMasked] = useState('');
  const [otpCode, setOtpCode]         = useState('');
  const [error, setError]             = useState('');
  const [countdown, setCountdown]     = useState(600);       // 10 min en secondes

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
      const res  = await fetchWithTimeout('/api/send-action-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action_type: actionType }),
      }, 20000);
      const data = await res.json();
      if (res.ok) {
        setEmailMasked(data.email_masked);
        setStep('sent');
      } else {
        setError(data.error || "Erreur lors de l'envoi du code.");
        setStep('ready');
      }
    } catch (e) {
      setError(e.message || 'Erreur serveur.');
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
    let result;
    try {
      result = await onConfirm(otpCode);
    } catch (e) {
      result = { ok: false, error: e.message || 'Erreur serveur.' };
    }
    if (result && !result.ok) {
      setError(result.error || 'Code incorrect ou expiré.');
      if (result.otpResent) {
        // Trop de tentatives : l'ancien code a été invalidé et un nouveau vient d'être envoyé.
        setOtpCode('');
      }
      setStep('sent');
    }
    // Si result.ok === true, le parent a déjà fermé la modale (open = false)
  };

  if (!open) return null;

  const isSubmitting = step === 'submitting';

  return (
    <div
      className="modal-overlay"
      onClick={!isSubmitting ? onCancel : undefined}
    >
      <div className="modal-card" onClick={e => e.stopPropagation()}>

        {/* En-tête */}
        <h3 className="modal-title">{title}</h3>
        <p className="modal-subtitle">{message}</p>

        {/* Détails optionnels */}
        {details && (
          <div className="modal-details-box">
            {typeof details === 'string' ? <p>{details}</p> : details}
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="modal-error-box">⚠️ {error}</div>
        )}

        {/* ÉTAPE : ready | sending */}
        {(step === 'ready' || step === 'sending') && (
          <>
            <div className="modal-info-box">
              🔐 Pour confirmer cette action, un code de validation à 6 chiffres sera envoyé
              à l'adresse email associée à votre compte.
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn--cancel" onClick={onCancel}>
                Annuler
              </button>
              <button
                className="modal-btn modal-btn--primary"
                onClick={sendCode}
                disabled={step === 'sending'}
              >
                {step === 'sending' ? '⏳ Envoi en cours…' : '📧 Recevoir le code par email'}
              </button>
            </div>
          </>
        )}

        {/* ÉTAPE : sent | submitting */}
        {(step === 'sent' || step === 'submitting') && (
          <>
            <div className="modal-success-box">
              <span>✉️ Code envoyé à <strong>{emailMasked}</strong></span>
              {countdown > 0
                ? <span style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem' }}>⏱ {formatTime(countdown)}</span>
                : <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>Expiré</span>
              }
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="modal-otp-label">Code de validation (6 chiffres)</label>
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
                className="modal-otp-input"
              />
            </div>

            <div className="modal-footer" style={{ marginBottom: 10 }}>
              <button
                className="modal-btn modal-btn--cancel"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                className="modal-btn modal-btn--primary"
                onClick={handleSubmit}
                disabled={isSubmitting || countdown === 0 || otpCode.length !== 6}
              >
                {isSubmitting ? '⏳ Validation…' : "✅ Valider l'action"}
              </button>
            </div>

            {countdown > 0 ? (
              <p className="modal-resend">
                Pas reçu ?{' '}
                <button onClick={sendCode}>Renvoyer le code</button>
              </p>
            ) : (
              <button
                className="modal-btn"
                onClick={sendCode}
                style={{ marginTop: 4, width: '100%', background: '#f59e0b', color: 'white' }}
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
