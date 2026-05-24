import React, { useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { QRCodeSVG } from 'qrcode.react';
import '../App.css';
import OTPModal from '../components/OTPModal';

const PLAN_COLORS = { ESSENTIEL: '#3b82f6', CAMPUS: '#8b5cf6', UNIVERSITE: '#f59e0b', ACADEMIE: '#10b981' };
const today = new Date().toISOString().split('T')[0];

const resolveMediaUrl = (rawUrl) => {
  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith('/media/')) {
    if (window.location.port === '3000') {
      return `http://localhost:8000${rawUrl}`;
    }
    return `${window.location.origin}${rawUrl}`;
  }
  return rawUrl;
};

const IssuerDashboard = () => {
  const userId = sessionStorage.getItem('user_id');

  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('issuer_active_tab') || 'create';
  });

  const [myDiplomas, setMyDiplomas] = useState([]);
  
  const [selectedDiploma, setSelectedDiploma] = useState(() => {
    const saved = sessionStorage.getItem('issuer_selected_diploma');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    sessionStorage.setItem('issuer_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (selectedDiploma) {
      sessionStorage.setItem('issuer_selected_diploma', JSON.stringify(selectedDiploma));
    } else {
      sessionStorage.removeItem('issuer_selected_diploma');
    }
  }, [selectedDiploma]);

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [qrPresets, setQrPresets] = useState([]);
  const [newPresetName, setNewPresetName] = useState('');
  
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem('issuer_form_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      nom: '', prenom: '', dateObtention: '', dateNaissance: '', studentEmail: '',
      diplomeFile: null, photoFile: null, course_name: '', expiry_date: '', never_expires: true,
      embed_qr: true, qr_x_pct: 72, qr_y_pct: 72, qr_size_pct: 18,
    };
  });

  // Sauvegarder formData dans sessionStorage, sauf les fichiers bruts qui bloquent JSON.stringify
  useEffect(() => {
    const dataToSave = { ...formData, diplomeFile: null, photoFile: null };
    sessionStorage.setItem('issuer_form_data', JSON.stringify(dataToSave));
  }, [formData]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [revokeMsg, setRevokeMsg] = useState({ type: '', text: '' });
  const [schoolErasureMsg, setSchoolErasureMsg] = useState({ type: '', text: '' });
  const [copiedLink, setCopiedLink] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);
  const [otpModal, setOtpModal] = useState({ open: false });
  const closeOTPModal = () => setOtpModal({ open: false });

  const [quota, setQuota] = useState({ used: 0, limit: 0, remaining: 0, unlimited: false, has_plan: false, plan_name: '…', plan_level: 0 });

  // Upgrade modal state
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [upgradePlans, setUpgradePlans] = useState([]);
  const [upgradeMsg, setUpgradeMsg]     = useState({ type: '', text: '' });

  const fetchQrPresets = useCallback(async () => {
    try {
      const res = await fetch(`/api/qr-presets/?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setQrPresets(data);
      }
    } catch(e) {
      console.error("Erreur récupération presets", e);
    }
  }, [userId]);

  const saveQrPreset = async () => {
    if (!newPresetName.trim()) return;
    try {
      const res = await fetch(`/api/qr-presets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: newPresetName.trim(),
          embed_qr: formData.embed_qr,
          qr_x_pct: Number(formData.qr_x_pct),
          qr_y_pct: Number(formData.qr_y_pct),
          qr_size_pct: Number(formData.qr_size_pct)
        })
      });
      if (res.ok) {
        setNewPresetName('');
        fetchQrPresets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteQrPreset = async (id) => {
    try {
      const res = await fetch(`/api/qr-presets/${id}/?user_id=${userId}`, { method: 'DELETE' });
      if (res.ok) fetchQrPresets();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQrPresets();
  }, [fetchQrPresets]);

  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch(`/api/quota/?user_id=${userId}`);
      const data = await res.json();
      if (res.ok) setQuota(data);
    } catch (e) {
      console.error("Erreur récupération quota");
    }
  }, [userId]);

  const openUpgradeModal = async () => {
    setUpgradeMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/plans/');
      const data = await res.json();
      setUpgradePlans(data.filter(p => p.level > quota.plan_level));
    } catch (e) {
      setUpgradePlans([]);
    }
    setShowUpgrade(true);
  };

  const handleUpgrade = async (planName) => {
    setUpgradeMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/upgrade/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, plan: planName }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpgradeMsg({ type: 'success', text: data.message });
        fetchQuota();
        setTimeout(() => setShowUpgrade(false), 1500);
      } else {
        setUpgradeMsg({ type: 'error', text: data.error || "Erreur lors du changement de plan." });
      }
    } catch (e) {
      setUpgradeMsg({ type: 'error', text: "Erreur serveur." });
    }
  };

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    const fetchMyDiplomas = async () => {
      try {
        const res = await fetch(`/api/my-diplomas/?user_id=${userId}`);
        const data = await res.json();
        setMyDiplomas(data);
      } catch (err) {
        console.error("Erreur chargement diplomes", err);
      }
    };
    fetchMyDiplomas();
  }, [activeTab, userId]);

  useEffect(() => {
    if (!formData.diplomeFile) {
      setPreviewUrl('');
      return;
    }

    if (formData.diplomeFile.type === 'application/pdf') {
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedarray = new Uint8Array(this.result);
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          if (pdf.numPages > 1) {
            setFileError('Le diplôme PDF doit contenir exactement 1 page pour être prévisualisé et validé.');
            setPreviewUrl('');
            setFormData(prev => ({ ...prev, diplomeFile: null }));
            setFileInputKey(Date.now());
            return;
          }
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          setPreviewUrl(canvas.toDataURL('image/png'));
        } catch (err) {
          console.error('Erreur de lecture PDF :', err);
          setFileError('Impossible de lire ou prévisualiser ce fichier PDF.');
          setPreviewUrl('');
          setFormData(prev => ({ ...prev, diplomeFile: null }));
          setFileInputKey(Date.now());
        }
      };
      fileReader.readAsArrayBuffer(formData.diplomeFile);
      return;
    }

    if (!formData.diplomeFile.type.startsWith('image/')) {
      setPreviewUrl('');
      setFileError('Format de fichier non supporté. Veuillez fournir une image ou un PDF (1 page).');
      setFormData(prev => ({ ...prev, diplomeFile: null }));
      setFileInputKey(Date.now());
      return;
    }
    const objectUrl = URL.createObjectURL(formData.diplomeFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [formData.diplomeFile]);

  useEffect(() => {
    if (!formData.photoFile || !formData.photoFile.type.startsWith('image/')) {
      setPhotoPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(formData.photoFile);
    setPhotoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [formData.photoFile]);

  const handlePreviewClick = (e) => {
    if (!previewUrl || !formData.embed_qr) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const qrSize = Math.max(5, Math.min(45, Number(formData.qr_size_pct) || 18));
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const maxPos = 100 - qrSize;
    setFormData(prev => ({
      ...prev,
      qr_x_pct: Math.max(0, Math.min(maxPos, Number(xPct.toFixed(2)))),
      qr_y_pct: Math.max(0, Math.min(maxPos, Number(yPct.toFixed(2)))),
    }));
  };

  const parseDecimalInput = (value) => {
    if (value === null || value === undefined) return NaN;
    return Number(String(value).trim().replace(',', '.'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setLastCreated(null);

    if (!formData.nom || !formData.prenom || !formData.course_name || !formData.dateObtention || !formData.dateNaissance || !formData.studentEmail) {
      setMsg({ type: 'error', text: "Veuillez remplir tous les champs obligatoires." });
      return;
    }

    if (!formData.never_expires && !formData.expiry_date) {
      setMsg({ type: 'error', text: "Veuillez renseigner une date d'expiration." });
      return;
    }

    if (!formData.diplomeFile) {
      setMsg({ type: 'error', text: "Veuillez joindre le fichier du diplôme." });
      return;
    }

    if (!formData.photoFile) {
      setMsg({ type: 'error', text: "Veuillez joindre la photo d'identité de l'étudiant." });
      return;
    }
    if (formData.embed_qr) {
      const x = parseDecimalInput(formData.qr_x_pct);
      const y = parseDecimalInput(formData.qr_y_pct);
      const s = parseDecimalInput(formData.qr_size_pct);
      if ([x, y, s].some(Number.isNaN)) {
        setMsg({ type: 'error', text: 'Coordonnées QR invalides.' });
        return;
      }
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        setMsg({ type: 'error', text: 'Les coordonnées QR doivent être entre 0 et 100.' });
        return;
      }
      if (s < 5 || s > 45) {
        setMsg({ type: 'error', text: 'La taille QR doit être entre 5% et 45%.' });
        return;
      }
    }
    if (formData.dateObtention > today) {
      setMsg({ type: 'error', text: "La date d'obtention ne peut pas être dans le futur." });
      return;
    }
    if (!formData.never_expires && formData.expiry_date) {
      if (formData.expiry_date <= today) {
        setMsg({ type: 'error', text: "La date d'expiration doit être strictement dans le futur." });
        return;
      }
      if (formData.expiry_date <= formData.dateObtention) {
        setMsg({ type: 'error', text: "La date d'expiration doit être postérieure à la date d'obtention." });
        return;
      }
    }

    const snapshot = { ...formData };
    setOtpModal({
      open: true,
      userId,
      actionType: 'CREATE_DIPLOMA',
      title: '🎓 Émettre un diplôme',
      message: "Confirmez l'émission du diplôme suivant. Un code de validation vous sera envoyé par email.",
      details: (
        <div style={{ lineHeight: '1.8' }}>
          <div><strong>Nom :</strong> {snapshot.nom}</div>
          <div><strong>Prénom :</strong> {snapshot.prenom}</div>
          <div><strong>Cursus :</strong> {snapshot.course_name}</div>
          <div><strong>Date d'obtention :</strong> {snapshot.dateObtention}</div>
          {snapshot.studentEmail && <div><strong>Email :</strong> {snapshot.studentEmail}</div>}
        </div>
      ),
      onConfirm: (otpCode) => submitCertify(snapshot, otpCode),
    });
  };

  const submitCertify = async (snapshot, otpCode) => {
    setMsg({ type: '', text: '' });
    const data = new FormData();
    data.append('user_id', userId);
    data.append('first_name', snapshot.prenom);
    data.append('last_name', snapshot.nom);
    data.append('course_name', snapshot.course_name);
    data.append('graduation_date', snapshot.dateObtention);
    if (snapshot.dateNaissance) data.append('date_of_birth', snapshot.dateNaissance);
    if (snapshot.studentEmail)  data.append('student_email', snapshot.studentEmail);
    data.append('image', snapshot.diplomeFile);
    if (snapshot.photoFile) data.append('photo', snapshot.photoFile);
    if (!snapshot.never_expires && snapshot.expiry_date) {
      data.append('expiry_date', snapshot.expiry_date);
    }
    data.append('embed_qr', snapshot.embed_qr ? 'true' : 'false');
    data.append('qr_x_pct', String(parseDecimalInput(snapshot.qr_x_pct)));
    data.append('qr_y_pct', String(parseDecimalInput(snapshot.qr_y_pct)));
    data.append('qr_size_pct', String(parseDecimalInput(snapshot.qr_size_pct)));
    data.append('otp_code', otpCode);
    try {
      const res = await fetch('/api/certify/', { method: 'POST', body: data });
      const responseData = await res.json();
      if (res.ok) {
        closeOTPModal();
        setMsg({ type: 'success', text: "Demande créée ! En attente de validation (Voir emails)." });
        setLastCreated({
          diplomaId: responseData.diploma_id,
          diplomaFileUrl: responseData.diploma_file_url,
          verifyUrl: responseData.verify_url,
        });
        fetchQuota();
        setTimeout(() => setActiveTab('list'), 2000);
        return { ok: true };
      } else {
        return { ok: false, error: responseData.error || "Erreur lors de l'enregistrement." };
      }
    } catch (e) {
      return { ok: false, error: "Erreur serveur." };
    }
  };

  const doErasure = async (diploma) => {
    setSchoolErasureMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/school-diploma-erasure/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, diploma_id: diploma.id, confirm: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setSchoolErasureMsg({ type: 'success', text: '✅ ' + data.message });
        const erased = { ...diploma, first_name: '[Supprimé]', last_name: '[Supprimé]', image: null, photo: null };
        setSelectedDiploma(erased);
        setMyDiplomas(prev => prev.map(d => d.id === diploma.id ? erased : d));
        return { ok: true };
      } else {
        return { ok: false, error: data.error || "Erreur lors de l'effacement." };
      }
    } catch {
      return { ok: false, error: 'Erreur serveur.' };
    }
  };

  const doRevoke = async (diploma, otpCode) => {
    setRevokeMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/revoke-diploma/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, diploma_id: diploma.id, otp_code: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        closeOTPModal();
        setRevokeMsg({ type: 'success', text: '✅ Diplôme révoqué sur la blockchain.' });
        setSelectedDiploma(prev => ({ ...prev, blockchain_status: 'REVOKED', status: 'REVOKED' }));
        setMyDiplomas(prev => prev.map(d => d.id === diploma.id ? { ...d, blockchain_status: 'REVOKED', status: 'REVOKED' } : d));
        return { ok: true };
      } else {
        return { ok: false, error: data.error || 'Erreur lors de la révocation.' };
      }
    } catch {
      return { ok: false, error: 'Erreur serveur.' };
    }
  };

  const getStatusBadge = (status, blockchainStatus) => {
    if (blockchainStatus === 'REVOKED') return <span className="status-badge status-badge--revoked">Révoqué 🚫</span>;
    if (status === 'REVOKED')           return <span className="status-badge status-badge--expired">Expiré 🕒</span>;
    if (status === 'VALIDATED')         return <span className="status-badge status-badge--validated">Validé ✅</span>;
    if (status === 'PENDING')           return <span className="status-badge status-badge--pending">En attente ⏳</span>;
    if (status === 'REJECTED')          return <span className="status-badge status-badge--rejected">Refusé ❌</span>;
    return status;
  };

  const isLimitReached     = quota.has_plan && !quota.unlimited && quota.used >= quota.limit;
  const progressPercentage = (!quota.has_plan || quota.unlimited) ? 0 : Math.min((quota.used / (quota.limit || 1)) * 100, 100);
  const planColor          = PLAN_COLORS[Object.keys(PLAN_COLORS).find(k => quota.plan_name?.toUpperCase().includes(k))] || '#3b82f6';
  const qrSizePreview = Math.max(5, Math.min(45, Number(formData.qr_size_pct) || 18));
  const qrXPreview = Math.max(0, Math.min(100 - qrSizePreview, Number(formData.qr_x_pct) || 0));
  const qrYPreview = Math.max(0, Math.min(100 - qrSizePreview, Number(formData.qr_y_pct) || 0));

  return (
    <div className="dashboard-container">

      {/* ── Plan & quota banner ── */}
      <div className={`plan-banner${isLimitReached ? ' plan-banner--limit' : ''}`} style={{ borderColor: isLimitReached ? '#ef4444' : `${planColor}40` }}>
        <div className="plan-banner__top">
          <h3 className="plan-banner__title">
            Plan actuel :&nbsp;<strong style={{ color: planColor }}>{quota.plan_name}</strong>
          </h3>
          <div className="plan-banner__right">
            <span className={`plan-banner__count${isLimitReached ? ' plan-banner__count--limit' : ''}`}>
              {!quota.has_plan ? 'Aucun abonnement' : quota.unlimited ? `${quota.used} / ∞` : `${quota.used} / ${quota.limit}`}
              {quota.has_plan ? ' Certifications' : ''}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.8rem', width: 'auto' }}
              onClick={openUpgradeModal}
            >
              ⬆ Changer de plan
            </button>
          </div>
        </div>

        {quota.has_plan && !quota.unlimited && (
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progressPercentage}%`,
                background: isLimitReached ? '#ef4444' : planColor,
              }}
            />
          </div>
        )}

        {isLimitReached ? (
          <p className="plan-banner__note plan-banner__note--error">
            ⚠️ Limite atteinte. Upgradez votre abonnement pour continuer.
          </p>
        ) : !quota.has_plan ? (
          <p className="plan-banner__note plan-banner__note--warn">
            ⚠️ Aucun abonnement actif. Veuillez choisir un plan pour émettre des diplômes.
          </p>
        ) : quota.unlimited ? (
          <p className="plan-banner__note">
            Certifications illimitées avec votre plan {quota.plan_name}.
          </p>
        ) : (
          <p className="plan-banner__note">
            Il vous reste {quota.remaining} certification(s) pour cette année.
          </p>
        )}
      </div>

      {/* ── Upgrade modal ── */}
      {showUpgrade && (
        <div className="modal-overlay" onClick={() => setShowUpgrade(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">
              {quota.has_plan ? "Changer d'abonnement" : "Choisir un abonnement"}
            </h3>
            <p className="modal-subtitle">
              {quota.has_plan
                ? <>Plan actuel : <strong>{quota.plan_name}</strong>. Vous pouvez uniquement upgrader vers un plan supérieur.</>
                : "Aucun abonnement actif. Choisissez un plan pour commencer à émettre des diplômes."
              }
            </p>

            {upgradeMsg.text && (
              <div className={`msg-box msg-${upgradeMsg.type}`}>{upgradeMsg.text}</div>
            )}

            {upgradePlans.length === 0 ? (
              <p style={{ color: 'var(--text-3)', textAlign: 'center', marginBottom: '20px' }}>
                Vous êtes déjà sur le plan le plus élevé !
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                {upgradePlans.map(plan => {
                  const color = PLAN_COLORS[plan.name] || '#3b82f6';
                  return (
                    <div
                      key={plan.name}
                      className="upgrade-plan-item"
                      style={{ borderColor: color, background: `${color}0d` }}
                    >
                      <div className="upgrade-plan-item__left">
                        <span className="upgrade-plan-item__name" style={{ color }}>{plan.display_name}</span>
                        <span className="upgrade-plan-item__limit">
                          {plan.max_diplomas === -1 ? 'Illimité' : `${plan.max_diplomas} diplômes/an`}
                        </span>
                      </div>
                      <div className="upgrade-plan-item__right">
                        <span className="upgrade-plan-item__price">{plan.annual_price} €/an</span>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 16px', fontSize: '0.85rem', width: 'auto', background: color, border: 'none' }}
                          onClick={() => handleUpgrade(plan.name)}
                        >
                          Choisir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowUpgrade(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
        <button
          className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('create'); setSelectedDiploma(null); }}
        >
          Nouveau Diplôme
        </button>
        <button
          className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('list')}
          disabled={myDiplomas.length === 0}
          style={myDiplomas.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          title={myDiplomas.length === 0 ? "Vous n'avez pas encore émis de diplôme." : ""}
        >
          Mes émissions
        </button>
      </div>

      {msg.text && <div className={`msg-box msg-${msg.type}`}>{msg.text}</div>}

      {/* Bloc succès création */}
      {lastCreated?.diplomaFileUrl && activeTab === 'create' && (
        <div className="created-block">
          <div className="created-block__title">✅ Diplôme généré (en attente de validations)</div>
          <p className="created-block__hint">
            Le QR code et les liens associés seront disponibles une fois le diplôme validé par vous et le rectorat.
          </p>
          <div className="created-block__actions">
            <span
              className="btn btn-primary"
              style={{ width: 'auto', opacity: 0.5, cursor: 'not-allowed', filter: 'grayscale(100%)' }}
            >
              📥 Télécharger le diplôme avec QR
            </span>
            {lastCreated.verifyUrl && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: 'auto', opacity: 0.5, cursor: 'not-allowed', filter: 'grayscale(100%)' }}
                disabled
              >
                📋 Copier le lien de vérification
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB : CRÉER ══ */}
      {activeTab === 'create' ? (
        <div className="form-card">
          <h2>🎓 Émettre un Diplôme</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Nom de l'étudiant <span style={{ color: '#ef4444' }}>*</span></label>
              <input className="input-field" onChange={e => setFormData({ ...formData, nom: e.target.value })} required disabled={isLimitReached} />
            </div>
            <div className="input-group">
              <label className="input-label">Prénom <span style={{ color: '#ef4444' }}>*</span></label>
              <input className="input-field" onChange={e => setFormData({ ...formData, prenom: e.target.value })} required disabled={isLimitReached} />
            </div>
            <div className="input-group">
              <label className="input-label">Cursus / Formation <span style={{ color: '#ef4444' }}>*</span></label>
              <input className="input-field" onChange={e => setFormData({ ...formData, course_name: e.target.value })} required disabled={isLimitReached} />
            </div>
            <div className="input-group">
              <label className="input-label">Date d'obtention <span style={{ color: '#ef4444' }}>*</span></label>
              <input className="input-field" type="date" max={today} onChange={e => setFormData({ ...formData, dateObtention: e.target.value })} required disabled={isLimitReached} />
            </div>
            <div className="input-group">
              <label className="input-label">
                Date de naissance de l'étudiant <span style={{ color: '#ef4444' }}>*</span>{' '}
                <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(identification anti-usurpation)</span>
              </label>
              <input className="input-field" type="date" max={today} value={formData.dateNaissance} onChange={e => setFormData({ ...formData, dateNaissance: e.target.value })} required disabled={isLimitReached} />
            </div>
            <div className="input-group">
              <label className="input-label">
                Email de l'étudiant <span style={{ color: '#ef4444' }}>*</span>{' '}
                <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(nécessaire pour le droit à l'oubli RGPD)</span>
              </label>
              <input
                className="input-field"
                type="email"
                placeholder="etudiant@exemple.fr"
                value={formData.studentEmail}
                onChange={e => setFormData({ ...formData, studentEmail: e.target.value })}
                required
                disabled={isLimitReached}
              />
              <small style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                Utilisé uniquement pour envoyer un code de confirmation lors d'une demande de suppression. Non exposé publiquement.
              </small>
            </div>
            <div className="input-group">
              <label className="input-label">Date d'expiration</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  className="input-field"
                  type="date"
                  style={{ flex: 1, minWidth: '160px' }}
                  value={formData.expiry_date}
                  min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()}
                  onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                  disabled={isLimitReached || formData.never_expires}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.never_expires}
                    onChange={e => setFormData({ ...formData, never_expires: e.target.checked, expiry_date: '' })}
                    disabled={isLimitReached}
                  />
                  N'expire jamais
                </label>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Fichier du diplôme (PDF, image…) <span style={{ color: '#ef4444' }}>*</span></label>
              {fileError && (
                <div style={{ color: '#991b1b', fontSize: '0.85rem', marginBottom: '8px', padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '6px' }}>
                  {fileError}
                </div>
              )}
              <div className="file-upload-wrapper">
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={e => { setFileError(''); setFormData({ ...formData, diplomeFile: e.target.files[0] }); }}
                  required
                  disabled={isLimitReached}
                />
              </div>
            </div>

            {/* ── Section QR ── */}
            <div className="qr-section">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.embed_qr}
                  onChange={e => setFormData({ ...formData, embed_qr: e.target.checked })}
                  disabled={isLimitReached}
                />
                Intégrer automatiquement le QR de vérification dans le diplôme
              </label>

              {formData.embed_qr && (
                <>
                  <p style={{ margin: '10px 0 14px', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                    Placez le QR via coordonnées (%) ou cliquez directement dans l'aperçu.
                    Le QR encode uniquement le lien public de vérification, jamais le lien privé RGPD.
                  </p>

                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 12 }}>
                    <div>
                      <label className="input-label">X (%)</label>
                      <input className="input-field" type="number" min="0" max="100" step="0.01" value={formData.qr_x_pct} onChange={e => setFormData({ ...formData, qr_x_pct: e.target.value })} disabled={isLimitReached} />
                    </div>
                    <div>
                      <label className="input-label">Y (%)</label>
                      <input className="input-field" type="number" min="0" max="100" step="0.01" value={formData.qr_y_pct} onChange={e => setFormData({ ...formData, qr_y_pct: e.target.value })} disabled={isLimitReached} />
                    </div>
                    <div>
                      <label className="input-label">Taille QR (%)</label>
                      <input className="input-field" type="number" min="5" max="45" step="0.01" value={formData.qr_size_pct} onChange={e => setFormData({ ...formData, qr_size_pct: e.target.value })} disabled={isLimitReached} />
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="qr-preset-bar">
                    <div className="qr-preset-bar__title">Sauvegarder et réutiliser ces paramètres (Presets)</div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Nom du preset (ex: Modèle Licence)"
                        className="input-field"
                        style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }}
                        value={newPresetName}
                        onChange={e => setNewPresetName(e.target.value)}
                      />
                      <button type="button" onClick={saveQrPreset} className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}>
                        Enregistrer
                      </button>
                    </div>
                    {qrPresets.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {qrPresets.map(preset => (
                          <div key={preset.id} className="qr-preset-chip">
                            <button
                              type="button"
                              title="Appliquer ce preset"
                              onClick={(e) => {
                                e.preventDefault();
                                setFormData(f => ({ ...f, embed_qr: preset.embed_qr, qr_x_pct: preset.qr_x_pct, qr_y_pct: preset.qr_y_pct, qr_size_pct: preset.qr_size_pct }));
                              }}
                            >
                              {preset.name}
                            </button>
                            <button
                              type="button"
                              className="qr-preset-chip__del"
                              title="Supprimer ce preset"
                              onClick={(e) => { e.preventDefault(); deleteQrPreset(preset.id); }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {previewUrl ? (
                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: 8 }}>
                        Aperçu de placement (clic = repositionnement)
                      </div>
                      <div
                        onClick={handlePreviewClick}
                        style={{
                          position: 'relative', width: '100%', maxWidth: 620,
                          border: '1px solid var(--border)', borderRadius: 8,
                          overflow: 'hidden', cursor: 'crosshair', background: 'white',
                        }}
                      >
                        <img src={previewUrl} alt="Aperçu diplôme" style={{ display: 'block', width: '100%' }} />
                        <div
                          style={{
                            position: 'absolute',
                            left: `${qrXPreview}%`, top: `${qrYPreview}%`,
                            width: `${qrSizePreview}%`, maxWidth: '45%',
                            border: '2px solid #22c55e',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                            background: 'white',
                          }}
                        >
                          <QRCodeSVG value={`${window.location.origin}/verify/apercu`} size={220} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.82rem' }}>
                      Aperçu visuel disponible pour les fichiers image (PNG/JPG/WEBP). Pour les PDF, les coordonnées seront appliquées à la page 1.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Photo d'identité de l'étudiant (JPEG, PNG) <span style={{ color: '#ef4444' }}>*</span></label>
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={e => setFormData({ ...formData, photoFile: e.target.files[0] })}
                  disabled={isLimitReached}
                  required
                />
                {photoPreviewUrl && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img src={photoPreviewUrl} alt="Aperçu identité" className="identity-photo" style={{ width: '80px', height: '80px' }} />
                  </div>
                )}
              </div>
              <small style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                Utilisée pour détecter les usurpations d'identité lors de la vérification.
              </small>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={isLimitReached}
              style={{ opacity: isLimitReached ? 0.5 : 1, cursor: isLimitReached ? 'not-allowed' : 'pointer' }}
            >
              {isLimitReached ? "Limite atteinte" : "Lancer la procédure"}
            </button>
          </form>
        </div>

      ) : (
        /* ══ TAB : LISTE ══ */
        <div className="form-card">
          {selectedDiploma ? (
            <div className="certificate-result animate-fade-in">
              <div className="certificate-header">DÉTAIL DU DIPLÔME</div>
              <div className="certificate-body">

                <h2 style={{ textAlign: 'center', marginBottom: '12px' }}>
                  {selectedDiploma.first_name} {selectedDiploma.last_name}
                </h2>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  {getStatusBadge(selectedDiploma.status, selectedDiploma.blockchain_status)}
                </div>

                <div className="certificate-row">
                  <span className="certificate-label">Formation :</span>
                  <b>{selectedDiploma.course_name}</b>
                </div>
                <div className="certificate-row">
                  <span className="certificate-label">Date d'obtention :</span>
                  <b>{selectedDiploma.graduation_date}</b>
                </div>
                <div className="certificate-row">
                  <span className="certificate-label">Expiration :</span>
                  <b>{selectedDiploma.expiry_date || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>N'expire jamais</span>}</b>
                </div>

                {/* QR Code de vérification étudiant */}
                {selectedDiploma.verification_uuid && (() => {
                  const verifyUrl  = `${window.location.origin}/verify/${selectedDiploma.verification_uuid}`;
                  const erasureUrl = `${verifyUrl}?erase=${selectedDiploma.student_deletion_token}`;
                  const isValidated = selectedDiploma.status === 'VALIDATED';

                  return (
                    <div className="qr-verify-block">
                      <div className="qr-verify-block__title">📱 Lien de vérification étudiant (public)</div>

                      {!isValidated && (
                        <div className="qr-verify-block__pending-warn">
                          ⚠️ Disponible uniquement après validation complète (École + Rectorat)
                        </div>
                      )}

                      <div style={{ filter: isValidated ? 'none' : 'blur(5px)', opacity: isValidated ? 1 : 0.6, pointerEvents: isValidated ? 'auto' : 'none', transition: 'all 0.3s' }}>
                        <QRCodeSVG value={isValidated ? verifyUrl : 'masqué'} size={140} level="M" style={{ display: 'block', margin: '0 auto 12px' }} />
                        <div className="qr-verify-block__url">
                          {isValidated ? verifyUrl : 'Lien masqué (en attente de validation)'}
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary"
                        style={{ width: 'auto', padding: '5px 14px', fontSize: '0.8rem', opacity: isValidated ? 1 : 0.5, cursor: isValidated ? 'pointer' : 'not-allowed' }}
                        onClick={() => {
                          if (!isValidated) return;
                          navigator.clipboard.writeText(verifyUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        disabled={!isValidated}
                      >
                        {copiedLink ? '✅ Copié !' : '📋 Copier le lien'}
                      </button>

                      {/* Lien privé RGPD */}
                      {selectedDiploma.student_deletion_token && (
                        <div className="private-link-block">
                          <div className="private-link-block__title">
                            🔐 Lien privé RGPD (droit à l'oubli) — à transmettre uniquement à l'étudiant
                          </div>
                          <div
                            className="private-link-block__url"
                            style={{ filter: isValidated ? 'none' : 'blur(4px)', opacity: isValidated ? 1 : 0.6 }}
                          >
                            {isValidated ? erasureUrl : 'Lien masqué (en attente de validation)'}
                          </div>
                          <button
                            className="btn btn-secondary"
                            style={{ width: 'auto', padding: '4px 12px', fontSize: '0.78rem', opacity: isValidated ? 1 : 0.5, cursor: isValidated ? 'pointer' : 'not-allowed' }}
                            onClick={() => { if (!isValidated) return; navigator.clipboard.writeText(erasureUrl); }}
                            disabled={!isValidated}
                          >
                            📋 Copier le lien privé
                          </button>
                          <div className="private-link-block__warn">
                            ⚠️ Ne pas inclure dans le QR code public — ce lien permet la suppression définitive des données.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Info diplôme avec QR */}
                {selectedDiploma.image && (
                  <div className="qr-info-notice">
                    <strong>Fichier avec QR intégré</strong>
                    Ce fichier contient la version du diplôme avec QR code intégré.
                  </div>
                )}

                {/* Suivi des validations */}
                <div className="tracking-block">
                  <h4 className="tracking-block__title">Suivi des validations</h4>
                  <div className="tracking-row">
                    <span className="tracking-row__label">École (Vous) :</span>
                    <strong>{selectedDiploma.school_validated ? '✅ Validé' : '⏳ En attente'}</strong>
                  </div>
                  <div className="tracking-row">
                    <span className="tracking-row__label">Rectorat :</span>
                    <strong>{selectedDiploma.rectorate_validated ? '✅ Validé' : '⏳ En attente'}</strong>
                  </div>
                  {selectedDiploma.blockchain_status === 'REVOKED' && (
                    <div className="tracking-banner tracking-banner--revoked">
                      🚫 Ce diplôme a été révoqué par l'établissement.
                    </div>
                  )}
                  {selectedDiploma.status === 'REVOKED' && selectedDiploma.blockchain_status !== 'REVOKED' && (
                    <div className="tracking-banner tracking-banner--expired">
                      🕒 Ce diplôme a expiré automatiquement.
                    </div>
                  )}
                  {selectedDiploma.status === 'REJECTED' && (
                    <div style={{ marginTop: '14px', color: '#dc2626', textAlign: 'center', fontWeight: 'bold' }}>
                      Ce diplôme a été refusé.
                    </div>
                  )}
                </div>

                {revokeMsg.text       && <div className={`msg-box msg-${revokeMsg.type}`}       style={{ marginTop: '15px' }}>{revokeMsg.text}</div>}
                {schoolErasureMsg.text && <div className={`msg-box msg-${schoolErasureMsg.type}`} style={{ marginTop: '15px' }}>{schoolErasureMsg.text}</div>}

                {/* Actions */}
                <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {(selectedDiploma.image_url || selectedDiploma.image) && (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <a
                      href={selectedDiploma.status === 'VALIDATED' ? resolveMediaUrl(selectedDiploma.image_url || selectedDiploma.image) : '#'}
                      onClick={(e) => { if (selectedDiploma.status !== 'VALIDATED') e.preventDefault(); }}
                      target={selectedDiploma.status === 'VALIDATED' ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="btn-download"
                      download={selectedDiploma.status === 'VALIDATED'}
                      style={selectedDiploma.status !== 'VALIDATED' ? { opacity: 0.5, cursor: 'not-allowed', filter: 'grayscale(100%)' } : {}}
                    >
                      📥 Télécharger le diplôme avec QR
                    </a>
                  )}
                  {selectedDiploma.first_name !== '[Supprimé]' && (
                    <button
                      className="btn"
                      style={{ width: 'auto', background: '#b45309', color: 'white', border: 'none' }}
                      onClick={() => {
                        const d = selectedDiploma;
                        setOtpModal({
                          open: true, userId,
                          actionType: 'ERASE_DIPLOMA',
                          title: '🗑️ Effacer les données RGPD',
                          message: `Effacer les données personnelles de ${d.first_name} ${d.last_name} ?`,
                          details: 'Irréversible : nom, prénom, fichiers et email supprimés. La preuve blockchain est conservée (RGPD Art. 17.3.b).',
                          onConfirm: (otpCode) => doErasure(d, otpCode),
                        });
                      }}
                    >
                      🗑️ Effacer les données RGPD
                    </button>
                  )}
                  {selectedDiploma.blockchain_status === 'ANCHORED' && (
                    <button
                      className="btn"
                      style={{ width: 'auto', background: '#ef4444', color: 'white', border: 'none' }}
                      onClick={() => {
                        const d = selectedDiploma;
                        setOtpModal({
                          open: true, userId,
                          actionType: 'REVOKE_DIPLOMA',
                          title: '🚫 Révoquer le diplôme',
                          message: `Révoquer le diplôme de ${d.first_name} ${d.last_name} ?`,
                          details: 'Cette action est irréversible sur la blockchain.',
                          onConfirm: (otpCode) => doRevoke(d, otpCode),
                        });
                      }}
                    >
                      🚫 Révoquer
                    </button>
                  )}
                  <button
                    className="btn btn-secondary"
                    style={{ width: 'auto' }}
                    onClick={() => { setSelectedDiploma(null); setRevokeMsg({ type: '', text: '' }); setSchoolErasureMsg({ type: '', text: '' }); }}
                  >
                    Retour
                  </button>
                </div>
              </div>
            </div>

          ) : (
            <>
              <h2>📜 Historique et Statuts</h2>
              {myDiplomas.length === 0 ? (
                <p style={{ color: 'var(--text-4)', textAlign: 'center', marginTop: '20px' }}>Aucun diplôme émis.</p>
              ) : (
                <div style={{ marginTop: '16px' }}>
                  {myDiplomas.map(d => (
                    <div
                      key={d.id}
                      className="diploma-row"
                      onClick={() => setSelectedDiploma(d)}
                    >
                      <div className="diploma-row__info">
                        <span
                          className="diploma-row__name"
                          style={{
                            textDecoration: ['REJECTED', 'REVOKED'].includes(d.status) || d.blockchain_status === 'REVOKED' ? 'line-through' : 'none',
                            color: d.blockchain_status === 'REVOKED' ? '#7c3aed' : d.status === 'REVOKED' ? '#c2410c' : 'inherit',
                          }}
                        >
                          {d.last_name.toUpperCase()} {d.first_name}
                        </span>
                        <span className="diploma-row__meta">{d.course_name}</span>
                      </div>
                      <div className="diploma-row__actions">
                        {getStatusBadge(d.status, d.blockchain_status)}
                        <span className="diploma-row__arrow">›</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <OTPModal
        open={!!otpModal.open}
        userId={otpModal.userId}
        actionType={otpModal.actionType}
        title={otpModal.title || ''}
        message={otpModal.message || ''}
        details={otpModal.details || null}
        onConfirm={otpModal.onConfirm}
        onCancel={closeOTPModal}
      />
    </div>
  );
};

export default IssuerDashboard;
