import React from 'react';

const TYPE_STYLES = {
  danger:  { btn: '#dc2626', badge: '#fef2f2', border: '#fecaca' },
  warning: { btn: '#d97706', badge: '#fffbeb', border: '#fde68a' },
  info:    { btn: '#2563eb', badge: '#eff6ff', border: '#bfdbfe' },
};

/**
 * Reusable confirmation modal.
 *
 * Props:
 *   open          – boolean, whether the modal is visible
 *   title         – modal heading
 *   message       – short description (string)
 *   details       – optional extra info (string OR JSX) shown in a coloured box
 *   confirmLabel  – label for the confirm button (default: "Confirmer")
 *   type          – "info" | "warning" | "danger"  (controls colours)
 *   onConfirm     – called when the user clicks the confirm button
 *   onCancel      – called when the user clicks Annuler or the backdrop
 */
const ConfirmModal = ({
  open,
  title,
  message,
  details,
  confirmLabel = 'Confirmer',
  type = 'info',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const c = TYPE_STYLES[type] || TYPE_STYLES.info;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.5)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '28px 32px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: '1.1rem' }}>
          {title}
        </h3>
        <p style={{ color: '#475569', margin: '0 0 16px', lineHeight: '1.6', fontSize: '0.95rem' }}>
          {message}
        </p>

        {details && (
          <div
            style={{
              background: c.badge,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '0.875rem',
              color: '#334155',
            }}
          >
            {typeof details === 'string' ? <p style={{ margin: 0 }}>{details}</p> : details}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: c.btn,
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
