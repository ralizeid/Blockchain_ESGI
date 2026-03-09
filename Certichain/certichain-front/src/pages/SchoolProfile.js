import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const PLAN_COLORS = {
  STARTER:  '#3b82f6',
  STANDARD: '#8b5cf6',
  PREMIUM:  '#f59e0b',
};

const SchoolProfile = () => {
  const navigate = useNavigate();
  const userId   = localStorage.getItem('user_id');
  const username = localStorage.getItem('username') || '—';

  const [activeTab, setActiveTab]     = useState('profile');
  const [quota, setQuota]             = useState(null);
  const [plans, setPlans]             = useState([]);
  const [loading, setLoading]         = useState(true);

  // Upgrade modal
  const [showModal, setShowModal]       = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeMsg, setUpgradeMsg]     = useState({ type: '', text: '' });

  // RGPD — delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep]           = useState(1);
  const [deleteMsg, setDeleteMsg]             = useState({ type: '', text: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, pRes] = await Promise.all([
        fetch(`/api/quota/?user_id=${userId}`),
        fetch('/api/plans/'),
      ]);
      const qData = await qRes.json();
      const pData = await pRes.json();
      if (qRes.ok) setQuota(qData);
      if (pRes.ok) setPlans(pData);
    } catch (e) {
      console.error('Erreur chargement profil', e);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    setUpgradeMsg({ type: '', text: '' });
    try {
      const res  = await fetch('/api/upgrade/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, plan: selectedPlan.name }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpgradeMsg({ type: 'success', text: data.message });
        await fetchData();
        setTimeout(() => { setShowModal(false); setUpgradeMsg({ type: '', text: '' }); }, 1500);
      } else {
        setUpgradeMsg({ type: 'error', text: data.error || 'Erreur.' });
      }
    } catch (e) {
      setUpgradeMsg({ type: 'error', text: 'Erreur serveur.' });
    }
  };

  const handleExportData = async () => {
    try {
      const res  = await fetch(`/api/export-data/?user_id=${userId}`);
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Erreur export.'); return; }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `certichain_mes_donnees_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Impossible de télécharger les données.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteMsg({ type: '', text: '' });
    try {
      const res  = await fetch('/api/delete-account/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, confirm: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteStep(2);
        setDeleteMsg({ type: 'success', text: data.message });
        setTimeout(() => { localStorage.clear(); navigate('/'); window.location.reload(); }, 3000);
      } else {
        setDeleteMsg({ type: 'error', text: data.error || 'Erreur.' });
      }
    } catch {
      setDeleteMsg({ type: 'error', text: 'Erreur serveur.' });
    }
  };

  if (loading) return (
    <div className="dashboard-container" style={{ textAlign: 'center', color: 'var(--gray)', paddingTop: 80 }}>
      Chargement...
    </div>
  );

  const currentPlanName = quota?.plan_name || 'Aucun';
  const planKey         = plans.find(p => p.display_name === currentPlanName)?.name || '';
  const planColor       = PLAN_COLORS[planKey] || 'var(--primary)';
  const progressPct     = (!quota?.has_plan || quota?.unlimited)
    ? 0
    : Math.min((quota.used / quota.limit) * 100, 100);

  const TABS = [
    { id: 'profile', label: 'Informations' },
    { id: 'quota',   label: 'Quota & Usage' },
    { id: 'plans',   label: 'Abonnement' },
    { id: 'rgpd',    label: 'Mes droits RGPD' },
  ];

  return (
    <div className="dashboard-container" style={{ maxWidth: 860 }}>

      {/* En-tete */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark)' }}>
          Profil &amp; Abonnement
        </h1>
        <p style={{ color: 'var(--gray)', marginTop: 6, marginBottom: 0 }}>
          Compte : <strong>{username}</strong>
          &nbsp;&mdash;&nbsp;
          Plan actuel : <strong style={{ color: planColor }}>{currentPlanName}</strong>
        </p>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', marginBottom: 32 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === t.id ? 'var(--primary)' : 'var(--gray)',
              borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* INFORMATIONS */}
      {activeTab === 'profile' && (
        <>
          <div className="form-card" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 700 }}>Informations du compte</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginTop: 24 }}>
              {[
                { label: 'Identifiant',                value: username },
                { label: 'Plan actuel',                value: currentPlanName, color: planColor },
                { label: 'Certifications cette année', value: quota?.used ?? 0 },
                { label: 'Quota annuel',               value: quota?.unlimited ? 'Illimité' : (quota?.limit ?? 0) },
                { label: 'Prix annuel',                value: quota?.has_plan ? `${quota.annual_price} € HT` : '—' },
              ].map(item => (
                <div key={item.label}>
                  <div className="input-label" style={{ marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 600, color: item.color || 'var(--dark)' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plans d'abonnement – toujours visibles depuis l'onglet Informations */}
          <div style={{ marginBottom: 8 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>
              Offres d'abonnement
            </h2>
            <p style={{ color: 'var(--gray)', margin: '0 0 16px', fontSize: '0.875rem' }}>
              Facturation annuelle. Le changement de plan s'effectue uniquement vers un niveau supérieur.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {plans.map(plan => {
              const isCurrent    = plan.display_name === currentPlanName;
              const color        = PLAN_COLORS[plan.name] || 'var(--primary)';
              const isUpgradable = plan.level > (quota?.plan_level ?? 0);

              return (
                <div
                  key={plan.name}
                  className="form-card"
                  style={{
                    padding: 24,
                    marginBottom: 0,
                    border: `2px solid ${isCurrent ? color : '#e2e8f0'}`,
                    position: 'relative',
                    opacity: (!isCurrent && !isUpgradable) ? 0.55 : 1,
                  }}
                >
                  {isCurrent && (
                    <span style={{
                      position: 'absolute', top: 14, right: 14,
                      background: color, color: 'white',
                      fontSize: '0.7rem', fontWeight: 700,
                      padding: '2px 10px', borderRadius: 99,
                    }}>
                      Actuel
                    </span>
                  )}

                  <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{plan.display_name}</div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color }}>{plan.annual_price} &euro;</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 16 }}>/ an HT</div>

                  <ul style={{ padding: 0, margin: '0 0 20px', listStyle: 'none', fontSize: '0.875rem', color: '#334155' }}>
                    <li style={{ padding: '3px 0' }}>
                      {plan.max_diplomas === -1 ? 'Certifications illimitées' : `${plan.max_diplomas} certifications / an`}
                    </li>
                    <li style={{ padding: '3px 0' }}>Validation double signature</li>
                    <li style={{ padding: '3px 0' }}>Ancrage blockchain</li>
                  </ul>

                  <button
                    className={isCurrent ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{
                      width: '100%',
                      background: isCurrent ? color : undefined,
                      borderColor: !isCurrent ? color : undefined,
                      color: !isCurrent && isUpgradable ? color : undefined,
                      cursor: (isCurrent || !isUpgradable) ? 'default' : 'pointer',
                    }}
                    disabled={isCurrent || !isUpgradable}
                    onClick={() => {
                      if (isUpgradable && !isCurrent) {
                        setSelectedPlan(plan);
                        setShowModal(true);
                        setUpgradeMsg({ type: '', text: '' });
                      }
                    }}
                  >
                    {isCurrent ? 'Plan actuel' : !isUpgradable ? 'Non disponible' : 'Choisir ce plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* QUOTA */}
      {activeTab === 'quota' && (
        <>
          <div className="form-card" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 700 }}>Utilisation annuelle</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <span style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
                Plan <strong style={{ color: planColor }}>{currentPlanName}</strong>
              </span>
              <span style={{ fontWeight: 700, color: progressPct >= 90 ? '#ef4444' : 'var(--dark)' }}>
                {quota?.used ?? 0} / {quota?.unlimited ? 'Illimite' : (quota?.limit ?? 0)}
              </span>
            </div>

            {quota?.has_plan && !quota?.unlimited && (
              <div style={{ background: '#e2e8f0', borderRadius: 8, height: 8, overflow: 'hidden', marginTop: 12 }}>
                <div style={{
                  width: progressPct + '%',
                  height: '100%',
                  background: progressPct >= 90 ? '#ef4444' : progressPct >= 70 ? '#f59e0b' : planColor,
                  borderRadius: 8,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            )}

            <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: 12, marginBottom: 0 }}>
              {!quota?.has_plan
                ? 'Aucun abonnement actif.'
                : quota?.unlimited
                  ? `Certifications illimitees avec le plan ${currentPlanName}.`
                  : `Il vous reste ${quota.remaining} certification(s) disponibles cette annee.`}
            </p>
          </div>

          <div className="form-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--dark)' }}>Besoin de plus de certifications ?</div>
              <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: 4, marginBottom: 0 }}>
                Passez a un plan superieur depuis l'onglet Abonnement.
              </p>
            </div>
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setActiveTab('plans')}>
              Voir les plans
            </button>
          </div>
        </>
      )}

      {/* ABONNEMENT */}
      {activeTab === 'plans' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>Choisir un plan</h2>
            <p style={{ color: 'var(--gray)', marginTop: 4, fontSize: '0.875rem' }}>
              Facturation annuelle. Le changement de plan s'effectue uniquement vers un niveau superieur.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {plans.map(plan => {
              const isCurrent    = plan.display_name === currentPlanName;
              const color        = PLAN_COLORS[plan.name] || 'var(--primary)';
              const isUpgradable = plan.level > (quota?.plan_level ?? 0);

              return (
                <div
                  key={plan.name}
                  className="form-card"
                  style={{
                    padding: 24,
                    marginBottom: 0,
                    border: `2px solid ${isCurrent ? color : '#e2e8f0'}`,
                    position: 'relative',
                    opacity: (!isCurrent && !isUpgradable) ? 0.55 : 1,
                  }}
                >
                  {isCurrent && (
                    <span style={{
                      position: 'absolute', top: 14, right: 14,
                      background: color, color: 'white',
                      fontSize: '0.7rem', fontWeight: 700,
                      padding: '2px 10px', borderRadius: 99,
                    }}>
                      Actuel
                    </span>
                  )}

                  <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{plan.display_name}</div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: color }}>{plan.annual_price} &euro;</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 16 }}>/ an HT</div>

                  <ul style={{ padding: 0, margin: '0 0 20px', listStyle: 'none', fontSize: '0.875rem', color: '#334155' }}>
                    <li style={{ padding: '3px 0' }}>
                      {plan.max_diplomas === -1 ? 'Certifications illimitees' : `${plan.max_diplomas} certifications / an`}
                    </li>
                    <li style={{ padding: '3px 0' }}>Validation double signature</li>
                    <li style={{ padding: '3px 0' }}>Ancrage blockchain</li>
                  </ul>

                  <button
                    className={isCurrent ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{
                      width: '100%',
                      background: isCurrent ? color : undefined,
                      borderColor: !isCurrent ? color : undefined,
                      color: !isCurrent && isUpgradable ? color : undefined,
                      cursor: (isCurrent || !isUpgradable) ? 'default' : 'pointer',
                    }}
                    disabled={isCurrent || !isUpgradable}
                    onClick={() => {
                      if (isUpgradable && !isCurrent) {
                        setSelectedPlan(plan);
                        setShowModal(true);
                        setUpgradeMsg({ type: '', text: '' });
                      }
                    }}
                  >
                    {isCurrent ? 'Plan actuel' : !isUpgradable ? 'Non disponible' : 'Choisir ce plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* RGPD */}
      {activeTab === 'rgpd' && (
        <>
          <div className="form-card" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 700 }}>Vos droits sur vos donnees</h2>
            <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: 8 }}>
              Conformement au Reglement (UE) 2016/679 (RGPD). Consultez notre{' '}
              <Link to="/privacy" style={{ color: 'var(--primary)', fontWeight: 600 }}>politique de confidentialite</Link>.
            </p>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, marginTop: 24 }}>
              <div style={{ fontWeight: 600, color: 'var(--dark)', marginBottom: 6 }}>
                Droit d'acces &amp; portabilite{' '}
                <span style={{ color: 'var(--gray)', fontWeight: 400, fontSize: '0.85rem' }}>Art. 15 &amp; 20</span>
              </div>
              <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: 14 }}>
                Telechargez l'integralite de vos donnees personnelles au format JSON (compte, profil, diplomes emis).
              </p>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleExportData}>
                Telecharger mes donnees (JSON)
              </button>
            </div>
          </div>

          <div className="form-card" style={{ border: '1px solid #fecaca', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: 6 }}>
              Droit a l'effacement{' '}
              <span style={{ color: 'var(--gray)', fontWeight: 400, fontSize: '0.85rem' }}>Art. 17</span>
            </div>
            <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: 14 }}>
              La suppression efface definitivement votre compte et vos donnees personnelles. Les diplomes
              deja valides sont anonymises afin de conserver la preuve blockchain (Art. 17.3.b).
              Cette action est irreversible.
            </p>
            <button
              className="btn"
              style={{ width: 'auto', background: '#dc2626', color: 'white', border: 'none' }}
              onClick={() => { setShowDeleteModal(true); setDeleteStep(1); setDeleteMsg({ type: '', text: '' }); }}
            >
              Supprimer mon compte
            </button>
          </div>

          <p style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>
            Pour toute demande de rectification ou d'opposition :{' '}
            <a href="mailto:dpo@certichain.fr" style={{ color: 'var(--primary)' }}>dpo@certichain.fr</a>
            {' '}&mdash; Autorite de controle :{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>CNIL</a>.
          </p>
        </>
      )}

      {/* MODAL UPGRADE */}
      {showModal && selectedPlan && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowModal(false)}
        >
          <div className="form-card" style={{ maxWidth: 440, width: '100%', padding: 36 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Passer au plan {selectedPlan.display_name}</h3>
            <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
              De <strong>{currentPlanName}</strong> vers{' '}
              <strong style={{ color: PLAN_COLORS[selectedPlan.name] }}>{selectedPlan.display_name}</strong>.
              Nouveau tarif : <strong>{selectedPlan.annual_price} &euro; / an HT</strong>.
            </p>

            {upgradeMsg.text && (
              <div className={`msg-box msg-${upgradeMsg.type}`}>{upgradeMsg.text}</div>
            )}

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: '0.875rem', color: '#334155' }}>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>Ce plan inclut :</div>
              <div>{selectedPlan.max_diplomas === -1 ? 'Certifications illimitees' : `${selectedPlan.max_diplomas} certifications / an`}</div>
              <div>Validation double signature</div>
              <div>Ancrage blockchain</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, background: PLAN_COLORS[selectedPlan.name] || undefined }}
                onClick={handleUpgrade}
              >
                Confirmer
              </button>
              <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowModal(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPPRESSION COMPTE */}
      {showDeleteModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="form-card" style={{ maxWidth: 440, width: '100%', padding: 36 }} onClick={e => e.stopPropagation()}>
            {deleteStep === 1 ? (
              <>
                <h3 style={{ marginTop: 0, color: '#991b1b' }}>Supprimer mon compte</h3>
                <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
                  Cette action est <strong>irreversible</strong>. Toutes vos donnees personnelles seront
                  effacees. Les diplomes valides seront anonymises.
                </p>
                {deleteMsg.text && (
                  <div className={`msg-box msg-${deleteMsg.type}`}>{deleteMsg.text}</div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <button
                    className="btn"
                    style={{ flex: 1, background: '#dc2626', color: 'white', border: 'none' }}
                    onClick={handleDeleteAccount}
                  >
                    Confirmer la suppression
                  </button>
                  <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowDeleteModal(false)}>
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <div className="msg-box msg-success">Compte supprime. Redirection en cours...</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolProfile;
