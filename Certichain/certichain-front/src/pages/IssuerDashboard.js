import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import '../App.css';

const PLAN_COLORS = { STARTER: '#3b82f6', STANDARD: '#8b5cf6', PREMIUM: '#f59e0b' };
const today = new Date().toISOString().split('T')[0];

const IssuerDashboard = () => {
  const userId = localStorage.getItem('user_id');
  const [activeTab, setActiveTab] = useState('create');
  const [myDiplomas, setMyDiplomas] = useState([]);
  const [selectedDiploma, setSelectedDiploma] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({ nom: '', prenom: '', dateObtention: '', dateNaissance: '', diplomeFile: null, photoFile: null, course_name: '', expiry_date: '', never_expires: true });
  const [revokeMsg, setRevokeMsg] = useState({ type: '', text: '' });
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!formData.diplomeFile) {
      setMsg({ type: 'error', text: "Veuillez joindre le fichier du diplôme." });
      return;
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

    const data = new FormData();
    data.append('user_id', userId);
    data.append('first_name', formData.prenom);
    data.append('last_name', formData.nom);
    data.append('course_name', formData.course_name);
    data.append('graduation_date', formData.dateObtention);
    if (formData.dateNaissance) data.append('date_of_birth', formData.dateNaissance);
    data.append('image', formData.diplomeFile);
    if (formData.photoFile) data.append('photo', formData.photoFile);
    if (!formData.never_expires && formData.expiry_date) {
      data.append('expiry_date', formData.expiry_date);
    }

    try {
      const res = await fetch('/api/certify/', { method: 'POST', body: data });
      const responseData = await res.json();

      if (res.ok) {
        setMsg({ type: 'success', text: "Demande créée ! En attente de validation (Voir emails)." });
        fetchQuota(); 
        setTimeout(() => setActiveTab('list'), 2000);
      } else {
        setMsg({ type: 'error', text: responseData.error || "Erreur lors de l'enregistrement." });
      }
    } catch (e) {
      setMsg({ type: 'error', text: "Erreur serveur." });
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
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={e => setFormData({...formData, diplomeFile: e.target.files[0]})}
                    required
                    disabled={isLimitReached}
                  />
                </div>
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
                      const verifyUrl = `${window.location.origin}/verify/${selectedDiploma.verification_uuid}`;
                      return (
                        <div style={{ margin: '20px 0', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <h4 style={{ margin: '0 0 12px', color: '#334155', fontSize: '0.9rem' }}>📱 Lien de vérification étudiant</h4>
                          <QRCodeSVG value={verifyUrl} size={140} level="M" style={{ display: 'block', margin: '0 auto 12px' }} />
                          <div style={{ fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-all', marginBottom: '10px', fontFamily: 'monospace' }}>{verifyUrl}</div>
                          <button
                            className="btn btn-secondary"
                            style={{ width: 'auto', padding: '5px 14px', fontSize: '0.8rem' }}
                            onClick={() => { navigator.clipboard.writeText(verifyUrl); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }}
                          >
                            {copiedLink ? '✅ Copié !' : '📋 Copier le lien'}
                          </button>
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

                    <div style={{marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap'}}>
                         {selectedDiploma.image && (
                          <a href={selectedDiploma.image} target="_blank" rel="noopener noreferrer" className="btn-download" download>
                            📥 Document Original
                          </a>
                        )}
                        {selectedDiploma.blockchain_status === 'ANCHORED' && (
                          <button
                            className="btn"
                            style={{width:'auto', background:'#ef4444', color:'white', border:'none'}}
                            onClick={async () => {
                              setRevokeMsg({ type: '', text: '' });
                              if (!window.confirm(`Révoquer le diplôme de ${selectedDiploma.first_name} ${selectedDiploma.last_name} ?\nCette action est irréversible sur la blockchain.`)) return;
                              try {
                                const res = await fetch('/api/revoke-diploma/', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ user_id: userId, diploma_id: selectedDiploma.id }),
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  setRevokeMsg({ type: 'success', text: '✅ Diplôme révoqué sur la blockchain.' });
                                  setSelectedDiploma(prev => ({ ...prev, blockchain_status: 'REVOKED', status: 'REVOKED' }));
                                  setMyDiplomas(prev => prev.map(d => d.id === selectedDiploma.id ? { ...d, blockchain_status: 'REVOKED', status: 'REVOKED' } : d));
                                } else {
                                  setRevokeMsg({ type: 'error', text: data.error || 'Erreur lors de la révocation.' });
                                }
                              } catch {
                                setRevokeMsg({ type: 'error', text: 'Erreur serveur.' });
                              }
                            }}
                          >
                            🚫 Révoquer
                          </button>
                        )}
                        <button className="btn btn-secondary" style={{width: 'auto'}} onClick={() => { setSelectedDiploma(null); setRevokeMsg({ type: '', text: '' }); }}>Retour</button>
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
    </div>
  );
};

export default IssuerDashboard;