import React, { useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { QRCodeSVG } from 'qrcode.react';
import '../App.css';
import OTPModal from '../components/OTPModal';

const PLAN_COLORS = { STARTER: '#3b82f6', STANDARD: '#8b5cf6', PREMIUM: '#f59e0b' };
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
  const userId = localStorage.getItem('user_id');
  const [activeTab, setActiveTab] = useState('create');
  const [myDiplomas, setMyDiplomas] = useState([]);
  const [selectedDiploma, setSelectedDiploma] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    nom: '', prenom: '', dateObtention: '', dateNaissance: '', studentEmail: '',
    diplomeFile: null, photoFile: null, course_name: '', expiry_date: '', never_expires: true,
    embed_qr: true, qr_x_pct: 72, qr_y_pct: 72, qr_size_pct: 18,
  });
  const [previewUrl, setPreviewUrl] = useState('');
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
      // Only show plans with a higher level
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
    if (activeTab === 'list') {
      const fetchMyDiplomas = async () => {
        const res = await fetch(`/api/my-diplomas/?user_id=${userId}`);
        const data = await res.json();
        setMyDiplomas(data);
      };
      fetchMyDiplomas();
    }
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
            
            // On vide le fichier invalide pour bloquer la soumission et remettre l'input à zéro
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

    if (!formData.diplomeFile) {
      setMsg({ type: 'error', text: "Veuillez joindre le fichier du diplôme." });
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
      title: '\uD83C\uDF93 Émettre un diplôme',
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
        setRevokeMsg({ type: 'success', text: '\u2705 Diplôme révoqué sur la blockchain.' });
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
    if (blockchainStatus === 'REVOKED') return <span style={{padding: '4px 8px', borderRadius: '12px', background: '#fdf4ff', color: '#7c3aed', fontSize: '0.8rem', fontWeight: 'bold'}}>Révoqué 🚫</span>;
    if (status === 'REVOKED')          return <span style={{padding: '4px 8px', borderRadius: '12px', background: '#fff7ed', color: '#c2410c', fontSize: '0.8rem', fontWeight: 'bold'}}>Expiré 🕒</span>;
    if (status === 'VALIDATED')        return <span style={{padding: '4px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontSize: '0.8rem'}}>Validé ✅</span>;
    if (status === 'PENDING')          return <span style={{padding: '4px 8px', borderRadius: '12px', background: '#ffedd5', color: '#9a3412', fontSize: '0.8rem'}}>En attente ⏳</span>;
    if (status === 'REJECTED')         return <span style={{padding: '4px 8px', borderRadius: '12px', background: '#fee2e2', color: '#991b1b', fontSize: '0.8rem'}}>Refusé ❌</span>;
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
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', border: isLimitReached ? '2px solid #ef4444' : `1px solid ${planColor}40` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>
            Plan actuel :&nbsp;
            <strong style={{ color: planColor }}>{quota.plan_name}</strong>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 'bold', color: isLimitReached ? '#ef4444' : '#1e293b' }}>
              {!quota.has_plan ? 'Aucun abonnement' : quota.unlimited ? `${quota.used} / ∞` : `${quota.used} / ${quota.limit}`} {quota.has_plan ? 'Certifications' : ''}
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
          <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercentage}%`,
              background: isLimitReached ? '#ef4444' : planColor,
              height: '100%',
              transition: 'width 0.5s ease',
            }} />
          </div>
        )}

        {isLimitReached ? (
          <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '10px', margin: 0 }}>
            ⚠️ Limite atteinte. Upgradez votre abonnement pour continuer.
          </p>
        ) : !quota.has_plan ? (
          <p style={{ color: '#f59e0b', fontSize: '0.85rem', marginTop: '10px', margin: 0 }}>
            ⚠️ Aucun abonnement actif. Veuillez choisir un plan pour émettre des diplômes.
          </p>
        ) : quota.unlimited ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px', margin: 0 }}>
            Certifications illimitées avec votre plan {quota.plan_name}.
          </p>
        ) : (
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px', margin: 0 }}>
            Il vous reste {quota.remaining} certification(s) pour cette année.
          </p>
        )}
      </div>

      {/* ── Upgrade modal ── */}
      {showUpgrade && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '30px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0 }}>{quota.has_plan ? "Changer d'abonnement" : "Choisir un abonnement"}</h3>
            <p style={{ color: '#64748b', fontSize: '0.9em' }}>
              {quota.has_plan
                ? <>Plan actuel : <strong>{quota.plan_name}</strong>. Vous pouvez uniquement upgrader vers un plan supérieur.</>
                : "Aucun abonnement actif. Choisissez un plan pour commencer à émettre des diplômes."
              }
            </p>

            {upgradeMsg.text && (
              <div className={`msg-box msg-${upgradeMsg.type}`}>{upgradeMsg.text}</div>
            )}

            {upgradePlans.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center' }}>Vous êtes déjà sur le plan le plus élevé !</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {upgradePlans.map(plan => {
                  const color = PLAN_COLORS[plan.name] || '#3b82f6';
                  return (
                    <div key={plan.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '8px', border: `2px solid ${color}`, background: `${color}0d` }}>
                      <div>
                        <span style={{ fontWeight: 'bold', color }}>{plan.display_name}</span>
                        <span style={{ color: '#64748b', fontSize: '0.85em', marginLeft: '10px' }}>
                          {plan.max_diplomas === -1 ? 'Illimité' : `${plan.max_diplomas} diplômes/an`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold' }}>{plan.annual_price} €/an</span>
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

      <div style={{display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center'}}>
        <button className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => {setActiveTab('create'); setSelectedDiploma(null);}}>Nouveau Diplôme</button>
        <button className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('list')}>Mes émissions</button>
      </div>

      {msg.text && <div className={`msg-box msg-${msg.type}`}>{msg.text}</div>}

      {lastCreated?.diplomaFileUrl && activeTab === 'create' && (
        <div style={{ marginBottom: 20, background: '#ecfeff', border: '1px solid #67e8f9', borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 700, color: '#0f766e', marginBottom: 8 }}>
            ✅ Diplôme généré (en attente de validations)
          </div>
          <p style={{ fontSize: '0.86rem', color: '#155e75', margin: '0 0 12px 0' }}>
            Le QR code et les liens associés seront disponibles une fois le diplôme validé par vous et le rectorat.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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

      {activeTab === 'create' ? (
        <div className="form-card">
          <h2>🎓 Émettre un Diplôme</h2>
          <form onSubmit={handleSubmit}>
             <div className="input-group">
                <label className="input-label">Nom de l'étudiant</label>
                <input className="input-field" onChange={e => setFormData({...formData, nom: e.target.value})} required disabled={isLimitReached}/>
             </div>
             <div className="input-group">
                <label className="input-label">Prénom</label>
                <input className="input-field" onChange={e => setFormData({...formData, prenom: e.target.value})} required disabled={isLimitReached}/>
             </div>
             <div className="input-group">
                <label className="input-label">Cursus / Formation</label>
                <input className="input-field" onChange={e => setFormData({...formData, course_name: e.target.value})} required disabled={isLimitReached}/>
             </div>
             <div className="input-group">
                <label className="input-label">Date d'obtention</label>
                <input className="input-field" type="date" max={today} onChange={e => setFormData({...formData, dateObtention: e.target.value})} required disabled={isLimitReached}/>
             </div>
             <div className="input-group">
                <label className="input-label">Date de naissance de l'étudiant <span style={{color:'#94a3b8',fontWeight:'normal'}}>(optionnel – identification anti-usurpation)</span></label>
                <input className="input-field" type="date" max={today} value={formData.dateNaissance} onChange={e => setFormData({...formData, dateNaissance: e.target.value})} disabled={isLimitReached}/>
             </div>
             <div className="input-group">
                <label className="input-label">Email de l'étudiant <span style={{color:'#94a3b8',fontWeight:'normal'}}>(optionnel – nécessaire pour le droit à l'oubli RGPD)</span></label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="etudiant@exemple.fr"
                  value={formData.studentEmail}
                  onChange={e => setFormData({...formData, studentEmail: e.target.value})}
                  disabled={isLimitReached}
                />
                <small style={{color:'#94a3b8',fontSize:'0.78rem',marginTop:'4px',display:'block'}}>
                  Utilisé uniquement pour envoyer un code de confirmation lors d’une demande de suppression. Non exposé publiquement.
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
                    min={(() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; })()}
                    onChange={e => setFormData({...formData, expiry_date: e.target.value})}
                    disabled={isLimitReached || formData.never_expires}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.never_expires}
                      onChange={e => setFormData({...formData, never_expires: e.target.checked, expiry_date: ''})}
                      disabled={isLimitReached}
                    />
                    N'expire jamais
                  </label>
                </div>
             </div>
             <div className="input-group">
                <label className="input-label">Fichier du diplôme (PDF, image…)</label>
                {fileError && <div style={{ color: '#991b1b', fontSize: '0.85rem', marginBottom: '8px', padding: '8px', backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '6px' }}>{fileError}</div>}
                <div className="file-upload-wrapper">
                  <input
                    key={fileInputKey}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={e => {
                        setFileError('');
                        setFormData({...formData, diplomeFile: e.target.files[0]});
                    }}
                    required
                    disabled={isLimitReached}
                  />
                </div>
             </div>

             <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 16, background: '#f8fafc' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
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
                   <p style={{ margin: '8px 0 12px', color: '#64748b', fontSize: '0.85rem' }}>
                     Placez le QR via coordonnées (%) ou cliquez directement dans l’aperçu.
                     Le QR encode uniquement le lien public de vérification, jamais le lien privé RGPD.
                   </p>

                   <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 12 }}>
                     <div>
                       <label className="input-label">X (%)</label>
                       <input
                         className="input-field"
                         type="number"
                         min="0"
                         max="100"
                           step="0.01"
                         value={formData.qr_x_pct}
                         onChange={e => setFormData({ ...formData, qr_x_pct: e.target.value })}
                         disabled={isLimitReached}
                       />
                     </div>
                     <div>
                       <label className="input-label">Y (%)</label>
                       <input
                         className="input-field"
                         type="number"
                         min="0"
                         max="100"
                           step="0.01"
                         value={formData.qr_y_pct}
                         onChange={e => setFormData({ ...formData, qr_y_pct: e.target.value })}
                         disabled={isLimitReached}
                       />
                     </div>
                     <div>
                       <label className="input-label">Taille QR (%)</label>
                       <input
                         className="input-field"
                         type="number"
                         min="5"
                         max="45"
                           step="0.01"
                         value={formData.qr_size_pct}
                         onChange={e => setFormData({ ...formData, qr_size_pct: e.target.value })}
                         disabled={isLimitReached}
                       />
                     </div>
                   </div>

                   {previewUrl ? (
                     <div>
                       <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 6 }}>
                         Aperçu de placement (clic = repositionnement)
                       </div>
                       <div
                         onClick={handlePreviewClick}
                         style={{
                           position: 'relative',
                           width: '100%',
                           maxWidth: 620,
                           border: '1px solid #cbd5e1',
                           borderRadius: 8,
                           overflow: 'hidden',
                           cursor: 'crosshair',
                           background: 'white',
                         }}
                       >
                         <img src={previewUrl} alt="Aperçu diplôme" style={{ display: 'block', width: '100%' }} />
                         <div
                           style={{
                             position: 'absolute',
                             left: `${qrXPreview}%`,
                             top: `${qrYPreview}%`,
                             width: `${qrSizePreview}%`,
                             maxWidth: '45%',
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
                     <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>
                       Aperçu visuel disponible pour les fichiers image (PNG/JPG/WEBP). Pour les PDF, les coordonnées seront appliquées à la page 1.
                     </p>
                   )}
                 </>
               )}
             </div>

             <div className="input-group">
                <label className="input-label">Photo d’identité de l’étudiant <span style={{color:'#94a3b8',fontWeight:'normal'}}>(optionnel – JPEG, PNG)</span></label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={e => setFormData({...formData, photoFile: e.target.files[0]})}
                    disabled={isLimitReached}
                  />
                </div>
                <small style={{color:'#94a3b8',fontSize:'0.78rem',marginTop:'4px',display:'block'}}>
                  Utilisée pour détecter les usurpations d’identité lors de la vérification.
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
        <div className="form-card">
          {selectedDiploma ? (
            <div className="certificate-result animate-fade-in">
                <div className="certificate-header">DÉTAIL DU DIPLÔME</div>
                <div className="certificate-body">
                    <h2 style={{textAlign: 'center'}}>{selectedDiploma.first_name} {selectedDiploma.last_name}</h2>
                    <div style={{textAlign: 'center', margin: '15px 0'}}>
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
                      <b>{selectedDiploma.expiry_date || <span style={{color:'#64748b',fontStyle:'italic'}}>N'expire jamais</span>}</b>
                    </div>

                    {/* QR Code de vérification étudiant */}
                    {selectedDiploma.verification_uuid && (() => {
                      const verifyUrl  = `${window.location.origin}/verify/${selectedDiploma.verification_uuid}`;
                      const erasureUrl = `${verifyUrl}?erase=${selectedDiploma.student_deletion_token}`;
                      
                      const isValidated = selectedDiploma.status === 'VALIDATED';

                      return (
                        <div style={{ margin: '20px 0', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <h4 style={{ margin: '0 0 12px', color: '#334155', fontSize: '0.9rem' }}>📱 Lien de vérification étudiant (public)</h4>
                          
                          {!isValidated && (
                            <div style={{ marginBottom: 10, fontSize: '0.82rem', color: '#b45309', fontWeight: 'bold' }}>
                               ⚠️ Disponible uniquement après validation complète (École + Rectorat)
                            </div>
                          )}

                          <div style={{ filter: isValidated ? 'none' : 'blur(5px)', opacity: isValidated ? 1 : 0.6, pointerEvents: isValidated ? 'auto' : 'none', transition: 'all 0.3s' }}>
                            <QRCodeSVG value={isValidated ? verifyUrl : 'masqué'} size={140} level="M" style={{ display: 'block', margin: '0 auto 12px' }} />
                            <div style={{ fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-all', marginBottom: '10px', fontFamily: 'monospace' }}>
                              {isValidated ? verifyUrl : 'Lien masqué (en attente de validation)'}
                            </div>
                          </div>

                          <button
                            className="btn btn-secondary"
                            style={{ width: 'auto', padding: '5px 14px', fontSize: '0.8rem', opacity: isValidated ? 1 : 0.5, cursor: isValidated ? 'pointer' : 'not-allowed' }}
                            onClick={() => { 
                              if(!isValidated) return;
                              navigator.clipboard.writeText(verifyUrl); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); 
                            }}
                            disabled={!isValidated}
                          >
                            {copiedLink ? '✅ Copié !' : '📋 Copier le lien'}
                          </button>

                          {/* Lien privé RGPD – à transmettre uniquement à l'étudiant, jamais dans le QR code */}
                          {selectedDiploma.student_deletion_token && (
                            <div style={{ marginTop: 16, padding: '12px', background: '#fff7ed', borderRadius: '6px', border: '1px solid #fed7aa', textAlign: 'left' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#9a3412', marginBottom: 6 }}>
                                🔐 Lien privé RGPD (droit à l'oubli) — à transmettre uniquement à l'étudiant
                              </div>
                              <div style={{ filter: isValidated ? 'none' : 'blur(4px)', opacity: isValidated ? 1 : 0.6, fontSize: '0.72rem', color: '#64748b', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 8 }}>
                                {isValidated ? erasureUrl : 'Lien masqué (en attente de validation)'}
                              </div>
                              <button
                                className="btn btn-secondary"
                                style={{ width: 'auto', padding: '4px 12px', fontSize: '0.78rem', opacity: isValidated ? 1 : 0.5, cursor: isValidated ? 'pointer' : 'not-allowed' }}
                                onClick={() => {
                                  if (!isValidated) return;
                                  navigator.clipboard.writeText(erasureUrl);
                                }}
                                disabled={!isValidated}
                              >
                                📋 Copier le lien privé
                              </button>
                              <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#b45309', fontStyle: 'italic' }}>
                                ⚠️ Ne pas inclure dans le QR code public — ce lien permet la suppression définitive des données.
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* --- NOUVEAU BLOC : SUIVI DES VALIDATIONS --- */}
                    <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center', color: '#334155' }}>Suivi des validations</h4>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #cbd5e1' }}>
                            <span style={{ color: '#64748b' }}>École (Vous) :</span>
                            <strong>{selectedDiploma.school_validated ? '✅ Validé' : '⏳ En attente'}</strong>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Rectorat :</span>
                            <strong>{selectedDiploma.rectorate_validated ? '✅ Validé' : '⏳ En attente'}</strong>
                        </div>
                        
                        {selectedDiploma.blockchain_status === 'REVOKED' && (
                            <div style={{ marginTop: '15px', padding: '10px', background: '#fdf4ff', borderRadius: '6px', border: '1px solid #d8b4fe', color: '#7c3aed', textAlign: 'center', fontWeight: 'bold' }}>
                                🚫 Ce diplôme a été révoqué par l'établissement.
                            </div>
                        )}
                        {selectedDiploma.status === 'REVOKED' && selectedDiploma.blockchain_status !== 'REVOKED' && (
                            <div style={{ marginTop: '15px', padding: '10px', background: '#fff7ed', borderRadius: '6px', border: '1px solid #fed7aa', color: '#c2410c', textAlign: 'center', fontWeight: 'bold' }}>
                                🕒 Ce diplôme a expiré automatiquement.
                            </div>
                        )}
                        {selectedDiploma.status === 'REJECTED' && (
                            <div style={{ marginTop: '15px', color: '#dc2626', textAlign: 'center', fontWeight: 'bold' }}>
                                Ce diplôme a été refusé.
                            </div>
                        )}
                    </div>

                    {revokeMsg.text && <div className={`msg-box msg-${revokeMsg.type}`} style={{marginTop:'15px'}}>{revokeMsg.text}</div>}
                    {schoolErasureMsg.text && <div className={`msg-box msg-${schoolErasureMsg.type}`} style={{marginTop:'15px'}}>{schoolErasureMsg.text}</div>}

                    {selectedDiploma.image && (
                      <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: '#ecfeff', border: '1px solid #67e8f9', color: '#155e75', fontSize: '0.86rem' }}>
                        Ce fichier contient la version du diplôme avec QR code intégré.
                      </div>
                    )}

                    <div style={{marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap'}}>
                         {(selectedDiploma.image_url || selectedDiploma.image) && (
                          // eslint-disable-next-line jsx-a11y/anchor-is-valid
                          <a 
                            href={selectedDiploma.status === 'VALIDATED' ? resolveMediaUrl(selectedDiploma.image_url || selectedDiploma.image) : '#'} 
                            onClick={(e) => { if(selectedDiploma.status !== 'VALIDATED') e.preventDefault(); }}
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
                            style={{width:'auto', background:'#b45309', color:'white', border:'none'}}
                            onClick={() => {
                              const d = selectedDiploma;
                              setOtpModal({
                                open: true,
                                userId,
                                actionType: 'ERASE_DIPLOMA',
                                title: '\uD83D\uDDD1\uFE0F Effacer les données RGPD',
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
                            style={{width:'auto', background:'#ef4444', color:'white', border:'none'}}
                            onClick={() => {
                              const d = selectedDiploma;
                              setOtpModal({
                                open: true,
                                userId,
                                actionType: 'REVOKE_DIPLOMA',
                                title: '\uD83D\uDEAB Révoquer le diplôme',
                                message: `Révoquer le diplôme de ${d.first_name} ${d.last_name} ?`,
                                details: 'Cette action est irréversible sur la blockchain.',
                                onConfirm: (otpCode) => doRevoke(d, otpCode),
                              });
                            }}
                          >
                            🚫 Révoquer
                          </button>
                        )}
                        <button className="btn btn-secondary" style={{width: 'auto'}} onClick={() => { setSelectedDiploma(null); setRevokeMsg({ type: '', text: '' }); setSchoolErasureMsg({ type: '', text: '' }); }}>Retour</button>
                    </div>
                </div>
            </div>
          ) : (
            <>
                <h2>📜 Historique et Statuts</h2>
                {myDiplomas.length === 0 ? (
                    <p style={{color: '#94a3b8', textAlign: 'center', marginTop: '20px'}}>Aucun diplôme émis.</p>
                ) : (
                    <div style={{marginTop: '20px'}}>
                        {myDiplomas.map(d => (
                            <div key={d.id} 
                                onClick={() => setSelectedDiploma(d)}
                                style={{
                                    padding: '15px', 
                                    borderBottom: '1px solid #f1f5f9', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <strong style={{ textDecoration: ['REJECTED','REVOKED'].includes(d.status) || d.blockchain_status === 'REVOKED' ? 'line-through' : 'none', color: d.blockchain_status === 'REVOKED' ? '#7c3aed' : d.status === 'REVOKED' ? '#c2410c' : 'inherit' }}>
                                        {d.last_name.toUpperCase()} {d.first_name}
                                    </strong>
                                    <div style={{fontSize: '0.85rem', color: '#64748b'}}>{d.course_name}</div>
                                </div>
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    {getStatusBadge(d.status, d.blockchain_status)}
                                    <span style={{fontSize: '1.2rem', color: '#cbd5e1'}}>›</span>
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