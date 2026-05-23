import React from 'react';
import '../App.css';

const TYPE_STYLES = {
  danger:  { btn: 'modal-btn--danger',  badge: '#fef2f2', border: '#fecaca' },
  warning: { btn: 'modal-btn--warning', badge: '#fffbeb', border: '#fde68a' },
  info:    { btn: 'modal-btn--primary', badge: '#eff6ff', border: '#bfdbfe' },
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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card modal-card--sm" onClick={e => e.stopPropagation()}>

        <h3 className="modal-title">{title}</h3>
        <p className="modal-subtitle">{message}</p>

        {details && (
          <div
            className="modal-details-box"
            style={{ background: c.badge, borderColor: c.border }}
          >
            {typeof details === 'string' ? <p>{details}</p> : details}
          </div>
        )}

        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="modal-btn modal-btn--cancel" onClick={onCancel}>
            Annuler
          </button>
          <button className={`modal-btn ${c.btn}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
