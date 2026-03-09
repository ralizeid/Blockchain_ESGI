import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';

const PLAN_COLORS = {
  STARTER:  { main: '#3b82f6', accent: '#eff6ff' },
  STANDARD: { main: '#8b5cf6', accent: '#f5f3ff' },
  PREMIUM:  { main: '#f59e0b', accent: '#fffbeb' },
};

const SchoolProfile = () => {
  const userId   = localStorage.getItem('user_id');
  const username = localStorage.getItem('username') || '—';

  const [activeTab, setActiveTab] = useState('profile');

  // Real data from backend
  const [quota, setQuota]   = useState(null);   // /api/quota/
  const [plans, setPlans]   = useState([]);      // /api/plans/
  const [loading, setLoading] = useState(true);

  // Upgrade modal
  const [showModal, setShowModal]     = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeMsg, setUpgradeMsg]   = useState({ type: '', text: '' });

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
      const res = await fetch('/api/upgrade/', {
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

  /* â”€â”€ helpers â”€â”€ */
  const currentPlanName = quota?.plan_name || 'Aucun';
  const planKey = plans.find(p => p.display_name === currentPlanName)?.name || '';
  const planColors = PLAN_COLORS[planKey] || { main: '#64748b', accent: '#f1f5f9' };
  const progressPct = (!quota?.has_plan || quota?.unlimited)
    ? 0
    : Math.min((quota.used / quota.limit) * 100, 100);

  const upgradablePlans = plans.filter(p => p.level > (quota?.plan_level ?? 0));

  const styles = {
    page: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f0f4ff', minHeight: '100vh' },
    header: { background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)', padding: '40px 5%', color: 'white', position: 'relative', overflow: 'hidden' },
    headerInner: { maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' },
    avatar: { width: 72, height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 },
    tabBar: { display: 'flex', gap: 4, background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 5%', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    contentArea: { maxWidth: 900, margin: '0 auto', padding: '40px 20px 80px' },
    card: { background: 'white', borderRadius: 16, padding: 32, marginBottom: 24, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    sectionTitle: { fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' },
    label: { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 },
    value: { fontSize: '0.95rem', fontWeight: 500, color: '#1e293b' },
    btnPrimary: { background: planColors.main, color: 'white', border: 'none', padding: '12px 24px', borderRadius: 10, fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' },
    btnGhost: { background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', padding: '10px 20px', borderRadius: 10, fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalBox: { background: 'white', borderRadius: 20, padding: 40, maxWidth: 480, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' },
    progressBg: { background: '#e2e8f0', borderRadius: 999, height: 10, overflow: 'hidden', margin: '12px 0' },
  };

  const getTabStyle = (id) => ({
    padding: '16px 24px', border: 'none', background: 'transparent', fontFamily: 'inherit',
    fontSize: '0.9rem', fontWeight: 600,
    color: activeTab === id ? '#2563eb' : '#64748b', cursor: 'pointer',
    borderBottom: activeTab === id ? '3px solid #2563eb' : '3px solid transparent',
  });

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Chargement…</div>;

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.avatar}>🎓</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>{username}</h1>
              <span style={{ background: '#10b981', color: 'white', padding: '3px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>
                Vérifié ✅
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Plan actuel', value: currentPlanName, icon: 'â­' },
                { label: 'Certifications émises', value: quota?.used ?? 0, icon: '📜' },
                { label: 'Quota annuel', value: quota?.unlimited ? '∞' : (quota?.limit ?? 0), icon: '📊' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase' }}>{s.icon} {s.label}</div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={styles.tabBar}>
        {[
          { id: 'profile', label: '📋 Informations' },
          { id: 'quota',   label: '📊 Quota & Usage' },
          { id: 'plans',   label: '🚀 Abonnement' },
        ].map(t => (
          <button key={t.id} style={getTabStyle(t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={styles.contentArea}>

        {/* ===== ONGLET INFORMATIONS ===== */}
        {activeTab === 'profile' && (
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Informations du compte</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              <div><label style={styles.label}>Identifiant</label><div style={styles.value}>{username}</div></div>
              <div><label style={styles.label}>Plan actuel</label><div style={{ ...styles.value, color: planColors.main, fontWeight: 700 }}>{currentPlanName}</div></div>
              <div><label style={styles.label}>Certifications cette année</label><div style={styles.value}>{quota?.used ?? 0}</div></div>
              <div><label style={styles.label}>Quota annuel</label><div style={styles.value}>{quota?.unlimited ? 'Illimité' : (quota?.limit ?? 0)}</div></div>
              <div><label style={styles.label}>Prix annuel</label><div style={styles.value}>{quota?.has_plan ? `${quota.annual_price} €` : '—'}</div></div>
              <div><label style={styles.label}>Abonnement actif depuis</label><div style={styles.value}>{quota?.has_plan ? 'Oui' : 'Non'}</div></div>
            </div>
          </div>
        )}

        {/* ===== ONGLET QUOTA ===== */}
        {activeTab === 'quota' && (
          <>
            <div style={styles.card}>
              <div style={styles.sectionTitle}>Utilisation du quota annuel</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>
                  Plan <span style={{ color: planColors.main }}>{currentPlanName}</span>
                </span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: progressPct >= 90 ? '#ef4444' : '#0f172a' }}>
                  {quota?.used ?? 0} / {quota?.unlimited ? '∞' : (quota?.limit ?? 0)}
                </span>
              </div>
              {quota?.has_plan && !quota?.unlimited && (
                <div style={styles.progressBg}>
                  <div style={{ width: progressPct + '%', background: progressPct >= 90 ? '#ef4444' : progressPct >= 70 ? '#f59e0b' : planColors.main, height: '100%', borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
              )}
              <p style={{ color: '#64748b', fontSize: '0.87rem', marginTop: 8 }}>
                {!quota?.has_plan
                  ? "âš ï¸ Aucun abonnement actif."
                  : quota?.unlimited
                    ? "Certifications illimitées."
                    : `Il vous reste ${quota.remaining} certification(s) disponibles cette année.`}
              </p>
            </div>

            <div style={{ ...styles.card, borderLeft: '4px solid ' + planColors.main }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Besoin de plus de certifications ?</div>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: 4, marginBottom: 0 }}>Passez à un plan supérieur dès maintenant.</p>
                </div>
                <button style={styles.btnPrimary} onClick={() => setActiveTab('plans')}>Voir les plans â†’</button>
              </div>
            </div>
          </>
        )}

        {/* ===== ONGLET ABONNEMENT ===== */}
        {activeTab === 'plans' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Choisissez votre plan</h2>
              <p style={{ color: '#64748b', marginTop: 8 }}>Facturation annuelle — changement uniquement vers un plan supérieur.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              {plans.map(plan => {
                const isCurrent = plan.display_name === currentPlanName;
                const colors = PLAN_COLORS[plan.name] || { main: '#64748b', accent: '#f1f5f9' };
                const isUpgradable = plan.level > (quota?.plan_level ?? 0);
                return (
                  <div key={plan.name} style={{
                    border: '2px solid ' + (isCurrent ? colors.main : '#e2e8f0'),
                    borderRadius: 16, padding: '28px 24px',
                    background: isCurrent ? colors.accent : 'white',
                    position: 'relative', transition: 'all 0.25s',
                  }}>
                    {isCurrent && (
                      <div style={{ position: 'absolute', top: 14, right: 14, background: colors.main, color: 'white', padding: '2px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800 }}>
                        Actuel
                      </div>
                    )}
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{plan.display_name}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: colors.main, margin: '12px 0 4px' }}>
                      {plan.annual_price} €
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 16 }}>/ an HT</div>
                    <div style={{ fontSize: '0.88rem', color: '#334155', padding: '5px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: colors.main, fontWeight: 700 }}>✓</span>
                      {plan.max_diplomas === -1 ? 'Certifications illimitées' : `${plan.max_diplomas} certifications / an`}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#334155', padding: '5px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: colors.main, fontWeight: 700 }}>✓</span>
                      Validation double signature
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#334155', padding: '5px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: colors.main, fontWeight: 700 }}>✓</span>
                      Ancrage blockchain
                    </div>
                    <button
                      onClick={() => { if (isUpgradable && !isCurrent) { setSelectedPlan(plan); setShowModal(true); setUpgradeMsg({ type: '', text: '' }); } }}
                      disabled={isCurrent || !isUpgradable}
                      style={{
                        width: '100%', padding: 11, borderRadius: 8,
                        fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700,
                        cursor: (isCurrent || !isUpgradable) ? 'default' : 'pointer',
                        marginTop: 20,
                        border: '2px solid ' + colors.main,
                        background: isCurrent ? colors.main : 'transparent',
                        color: isCurrent ? 'white' : colors.main,
                        opacity: (!isCurrent && !isUpgradable) ? 0.4 : 1,
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
      </div>

      {/* MODAL CONFIRMATION UPGRADE */}
      {showModal && selectedPlan && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚀</div>
              <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0f172a', marginBottom: 8 }}>
                Passer au plan {selectedPlan.display_name}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                De <strong>{currentPlanName}</strong> â†’ <strong style={{ color: (PLAN_COLORS[selectedPlan.name] || {}).main }}>{selectedPlan.display_name}</strong>.
                Nouveau tarif : <strong>{selectedPlan.annual_price} € / an HT</strong>.
              </p>
            </div>

            {upgradeMsg.text && (
              <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 600,
                background: upgradeMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                color:      upgradeMsg.type === 'success' ? '#15803d'  : '#991b1b' }}>
                {upgradeMsg.text}
              </div>
            )}

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, color: '#334155', marginBottom: 10, fontSize: '0.9rem' }}>Ce plan inclut :</div>
              <div style={{ fontSize: '0.88rem', color: '#475569', padding: '4px 0' }}>
                ✓ {selectedPlan.max_diplomas === -1 ? 'Certifications illimitées' : `${selectedPlan.max_diplomas} certifications / an`}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#475569', padding: '4px 0' }}>✓ Validation double signature</div>
              <div style={{ fontSize: '0.88rem', color: '#475569', padding: '4px 0' }}>✓ Ancrage blockchain</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{ ...styles.btnPrimary, flex: 1, background: (PLAN_COLORS[selectedPlan.name] || {}).main || '#3b82f6' }} onClick={handleUpgrade}>
                Confirmer l'upgrade
              </button>
              <button style={styles.btnGhost} onClick={() => setShowModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolProfile;

