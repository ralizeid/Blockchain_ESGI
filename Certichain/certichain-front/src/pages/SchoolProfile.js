import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import OTPModal from '../components/OTPModal';

const PLAN_COLORS = {
  ESSENTIEL: '#3b82f6',
  CAMPUS: '#8b5cf6',
  UNIVERSITE: '#f59e0b',
  ACADEMIE: '#10b981',
};

const SchoolProfile = () => {
  const navigate = useNavigate();
  const userId   = sessionStorage.getItem('user_id');
  const username = sessionStorage.getItem('username') || '—';

  // State initialisé avec le localStorage pour garder l'onglet et les champs si refresh
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('schoolProfile_activeTab') || 'profile';
  });
  const [quota, setQuota]             = useState(null);
  const [plans, setPlans]             = useState([]);
  const [packs, setPacks]             = useState([]);
  const [loading, setLoading]         = useState(true);

  // Upgrade modal
  const [showModal, setShowModal]       = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeMsg, setUpgradeMsg]     = useState({ type: '', text: '' });

  // RGPD — delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep]           = useState(1);
  const [deleteMsg, setDeleteMsg]             = useState({ type: '', text: '' });

  // Wallet & Profil — édition
  const [profileForm, setProfileForm] = useState(() => {
    const saved = sessionStorage.getItem('schoolProfile_form');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      email: '', rectorate_email: '', school_eth_address: '', rectorate_eth_address: '',
      school_name: '', school_type: '', school_address: '', school_zip: '', school_city: '',
      school_phone: '', school_website: '', director_name: '', uai_code: '', siret: '',
    };
  });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg]     = useState({ type: '', text: '' });
  const [otpModal, setOtpModal]           = useState({ open: false });
  const closeOTPModal = () => setOtpModal({ open: false });

  useEffect(() => {
    sessionStorage.setItem('schoolProfile_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('schoolProfile_form', JSON.stringify(profileForm));
  }, [profileForm]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, pRes, prRes] = await Promise.all([
        fetch(`/api/quota/?user_id=${userId}`),
        fetch('/api/plans/'),
        fetch(`/api/update-profile/?user_id=${userId}`),
      ]);
      const qData  = await qRes.json();
      const pData  = await pRes.json();
      const prData = await prRes.json();
      if (qRes.ok)  setQuota(qData);
      if (pRes.ok)  setPlans(pData);
      if (prRes.ok) {
        // Au lieu d'écraser bêtement, on vérifie d'abord si on n'a pas rafraichi 
        // sinon on charge les données du serveur s'il n'y avait rien avant.
        setProfileForm(prev => {
          const hasLocalData = !!sessionStorage.getItem('schoolProfile_form');
          if (hasLocalData) {
            // Si on a des champs localement sauvegardés à cause d'un refresh
            // On ne les écrase pas pour ne pas perdre la saisie
            return prev;
          }
          return {
            email:                 prData.email                 || '',
            rectorate_email:       prData.rectorate_email       || '',
            school_eth_address:    prData.school_eth_address    || '',
            rectorate_eth_address: prData.rectorate_eth_address || '',
            school_name:    prData.school_name    || '',
            school_type:    prData.school_type    || '',
            school_address: prData.school_address || '',
            school_zip:     prData.school_zip     || '',
            school_city:    prData.school_city    || '',
            school_phone:   prData.school_phone   || '',
            school_website: prData.school_website || '',
            director_name:  prData.director_name  || '',
            uai_code:       prData.uai_code       || '',
            siret:          prData.siret          || '',
          };
        });
      }
      const packsRes = await fetch('/api/packs/');
      if (packsRes.ok) setPacks(await packsRes.json());
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

  const handleBuyPack = async (pack) => {
    if (!window.confirm(`Vous allez acheter le ${pack.name} au prix de ${pack.price} €. Confirmez-vous ?`)) return;
    try {
      const res = await fetch('/api/buy-pack/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, pack_id: pack.id })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Pack acheté avec succès !");
        fetchData();
      } else {
        alert(data.error || "Erreur lors de l'achat.");
      }
    } catch (e) {
      alert("Erreur réseau.");
    }
  };

  const handleProfileSave = () => {
    if (!profileForm.school_eth_address || !/^0x[a-fA-F0-9]{40}$/.test(profileForm.school_eth_address)) {
      setProfileMsg({ type: 'error', text: 'L\'adresse MetaMask de l\'école est invalide ou manquante.' });
      return;
    }
    if (!profileForm.rectorate_eth_address || !/^0x[a-fA-F0-9]{40}$/.test(profileForm.rectorate_eth_address)) {
      setProfileMsg({ type: 'error', text: 'L\'adresse MetaMask du rectorat est invalide ou manquante.' });
      return;
    }

    setOtpModal({
      open: true,
      userId,
      actionType: 'UPDATE_PROFILE',
      title: '\uD83D\uDCBE Enregistrer les modifications',
      message: "Mettre à jour les informations de l'établissement ?",
      details: 'Un code de validation sera envoyé à votre email.',
      onConfirm: (otpCode) => doProfileSave(otpCode),
    });
  };

  const doProfileSave = async (otpCode) => {
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res  = await fetch('/api/update-profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...profileForm, otp_code: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        closeOTPModal();
        setProfileMsg({ type: 'success', text: data.message });
        return { ok: true };
      } else {
        return { ok: false, error: data.error || 'Erreur.' };
      }
    } catch {
      return { ok: false, error: 'Erreur serveur.' };
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = () => {
    setPasswordMsg({ type: '', text: '' });
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    const complexPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
    if (!complexPasswordRegex.test(passwordForm.new_password)) {
      setPasswordMsg({ type: 'error', text: 'Le mot de passe doit faire au moins 12 caractères, inclure une majuscule, une minuscule, un chiffre et un caractère spécial.' });
      return;
    }
    setOtpModal({
      open: true,
      userId,
      actionType: 'CHANGE_PASSWORD',
      title: '\uD83D\uDD12 Modifier le mot de passe',
      message: 'Confirmer le changement de mot de passe ?',
      details: "Assurez-vous d'avoir bien mémorisé votre nouveau mot de passe.",
      onConfirm: (otpCode) => doPasswordSave(otpCode),
    });
  };

  const doPasswordSave = async (otpCode) => {
    setPasswordSaving(true);
    try {
      const res  = await fetch('/api/update-profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:          userId,
          current_password: passwordForm.current_password,
          new_password:     passwordForm.new_password,
          otp_code:         otpCode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        closeOTPModal();
        setPasswordMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' });
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        return { ok: true };
      } else {
        return { ok: false, error: data.error || 'Erreur.' };
      }
    } catch {
      return { ok: false, error: 'Erreur serveur.' };
    } finally {
      setPasswordSaving(false);
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

  const handleDeleteAccount = async (otpCode) => {
    setDeleteMsg({ type: '', text: '' });
    try {
      const res  = await fetch('/api/delete-account/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, confirm: true, otp_code: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteStep(2);
        setShowDeleteModal(true);
        setTimeout(() => { sessionStorage.clear(); navigate('/'); window.location.reload(); }, 3000);
        return { ok: true };
      } else {
        return { ok: false, error: data.error || 'Erreur.' };
      }
    } catch {
      return { ok: false, error: 'Erreur serveur.' };
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
    { id: 'wallet',  label: '🔒 Wallet & Profil' },
    { id: 'quota',   label: 'Quota & Usage' },
    { id: 'packs',   label: 'Acheter un Pack' },
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

      {/* WALLET & PROFIL */}
      {activeTab === 'wallet' && (
        <div className="form-card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 700 }}>Wallet &amp; Profil</h2>
          <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: 24 }}>
            Les adresses MetaMask enregistrées définissent <strong>qui peut signer les diplômes</strong>.
            Seul le portefeuille dont l'adresse est renseignée ici sera accepté lors de la validation.
          </p>

          {profileMsg.text && (
            <div className={`msg-box msg-${profileMsg.type}`} style={{ marginBottom: 16 }}>
              {profileMsg.type === 'success' ? '✅' : '⚠️'} {profileMsg.text}
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email officiel de l'école</label>
            <input
              className="input-field"
              type="email"
              value={profileForm.email}
              onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email du Rectorat</label>
            <input
              className="input-field"
              type="email"
              value={profileForm.rectorate_email}
              onChange={e => setProfileForm(f => ({ ...f, rectorate_email: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">🔒 Adresse MetaMask de l'école <span style={{color: "#ef4444"}}>*</span></label>
            <input
              className="input-field"
              type="text"
              placeholder="0x..."
              value={profileForm.school_eth_address}
              onChange={e => setProfileForm(f => ({ ...f, school_eth_address: e.target.value }))}
              pattern="^0x[0-9a-fA-F]{40}$"
              required
            />
            <small style={{ color: 'var(--gray)', fontSize: '0.8em', marginTop: 4, display: 'block' }}>
              Obligatoire. Adresse publique visible dans MetaMask (onglet principal, sous le nom du compte).
              Seul le wallet possédant la clé privée correspondante pourra signer.
            </small>
          </div>

          <div className="input-group">
            <label className="input-label">🔒 Adresse MetaMask du Rectorat <span style={{color: "#ef4444"}}>*</span></label>
            <input
              className="input-field"
              type="text"
              placeholder="0x..."
              value={profileForm.rectorate_eth_address}
              onChange={e => setProfileForm(f => ({ ...f, rectorate_eth_address: e.target.value }))}
              pattern="^0x[0-9a-fA-F]{40}$"
              required
            />
            <small style={{ color: 'var(--gray)', fontSize: '0.8em', marginTop: 4, display: 'block' }}>
              Obligatoire. L'adresse publique du rectorat partenaire chargé de valider vos diplômes.
            </small>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 14, margin: '16px 0', fontSize: '0.875rem', color: '#166534' }}>
            <strong>🔗 Comment trouver son adresse publique MetaMask ?</strong><br />
            Ouvrez MetaMask → écran principal → l'adresse <code>0x...</code> affichée sous le nom du compte.
            Cliquez dessus pour la copier. C'est l'adresse <strong>publique</strong>, sans risque à partager.
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #bbf7d0' }}>
              <span>Besoin d'aide avec MetaMask ? </span>
              <Link to="/support" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: '#15803d', textDecoration: 'underline' }}>
                Consultez le guide et tutoriel complet
              </Link>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: 'auto', marginTop: 8 }}
            onClick={handleProfileSave}
            disabled={profileSaving}
          >
            {profileSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>

          {/* --- Changement de mot de passe --- */}
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 32, paddingTop: 24 }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--dark)' }}>Changer le mot de passe</h3>

            {passwordMsg.text && (
              <div className={`msg-box msg-${passwordMsg.type}`} style={{ marginBottom: 16 }}>
                {passwordMsg.type === 'success' ? '✅' : '⚠️'} {passwordMsg.text}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Mot de passe actuel</label>
              <input
                className="input-field"
                type="password"
                value={passwordForm.current_password}
                onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                autoComplete="current-password"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Nouveau mot de passe</label>
              <input
                className="input-field"
                type="password"
                value={passwordForm.new_password}
                onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))}
                autoComplete="new-password"
                minLength={8}
              />
              <small style={{ color: 'var(--gray)', fontSize: '0.8em', marginTop: 4, display: 'block' }}>Minimum 8 caractères.</small>
            </div>

            <div className="input-group">
              <label className="input-label">Confirmer le nouveau mot de passe</label>
              <input
                className="input-field"
                type="password"
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))}
                autoComplete="new-password"
                style={passwordForm.confirm_password && passwordForm.confirm_password !== passwordForm.new_password ? { borderColor: '#ef4444' } : {}}
              />
              {passwordForm.confirm_password && passwordForm.confirm_password !== passwordForm.new_password && (
                <small style={{ color: '#ef4444', fontSize: '0.8em', marginTop: 4, display: 'block' }}>Les mots de passe ne correspondent pas.</small>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: 'auto', marginTop: 8 }}
              onClick={handlePasswordSave}
              disabled={passwordSaving || !passwordForm.current_password || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm_password}
            >
              {passwordSaving ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </div>
        </div>
      )}

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

          {/* ── Informations établissement — éditable ── */}
          <div className="form-card" style={{ marginBottom: 24 }}>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 700 }}>🏫 Établissement</h2>
            <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: 20 }}>
              Ces informations peuvent être affichées sur les attestations.
            </p>

            {profileMsg.text && activeTab === 'profile' && (
              <div className={`msg-box msg-${profileMsg.type}`} style={{ marginBottom: 16 }}>
                {profileMsg.type === 'success' ? '✅' : '⚠️'} {profileMsg.text}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Nom officiel de l'établissement</label>
              <input
                className="input-field"
                type="text"
                placeholder="ex: Lycée Jules Ferry"
                value={profileForm.school_name}
                onChange={e => setProfileForm(f => ({ ...f, school_name: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Type d'établissement</label>
              <select
                className="input-field"
                value={profileForm.school_type}
                onChange={e => setProfileForm(f => ({ ...f, school_type: e.target.value }))}
              >
                <option value="">— Sélectionner —</option>
                <option value="LYCEE">Lycée</option>
                <option value="BTS_IUT">BTS / IUT</option>
                <option value="UNIVERSITE">Université</option>
                <option value="GRANDE_ECOLE">Grande École</option>
                <option value="INGENIEUR">École d'ingénieurs</option>
                <option value="COMMERCE">École de commerce</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Nom du directeur / chef d'établissement</label>
              <input
                className="input-field"
                type="text"
                placeholder="ex: Marie Dupont"
                value={profileForm.director_name}
                onChange={e => setProfileForm(f => ({ ...f, director_name: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Adresse postale</label>
              <input
                className="input-field"
                type="text"
                placeholder="ex: 12 rue de la Paix"
                value={profileForm.school_address}
                onChange={e => setProfileForm(f => ({ ...f, school_address: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="input-group" style={{ flex: '0 0 120px' }}>
                <label className="input-label">Code postal</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="75001"
                  value={profileForm.school_zip}
                  onChange={e => setProfileForm(f => ({ ...f, school_zip: e.target.value }))}
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Ville</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Paris"
                  value={profileForm.school_city}
                  onChange={e => setProfileForm(f => ({ ...f, school_city: e.target.value }))}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Téléphone</label>
              <input
                className="input-field"
                type="tel"
                placeholder="01 23 45 67 89"
                value={profileForm.school_phone}
                onChange={e => setProfileForm(f => ({ ...f, school_phone: e.target.value }))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Site web</label>
              <input
                className="input-field"
                type="url"
                placeholder="https://www.ecole.fr"
                value={profileForm.school_website}
                onChange={e => setProfileForm(f => ({ ...f, school_website: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="input-group" style={{ flex: '0 0 calc(50% - 5px)' }}>
                <label className="input-label">Code UAI / RNE</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="0750654E"
                  maxLength={8}
                  value={profileForm.uai_code}
                  onChange={e => setProfileForm(f => ({ ...f, uai_code: e.target.value }))}
                />
                <small style={{ color: 'var(--gray)', fontSize: '0.78em', marginTop: 3, display: 'block' }}>7 chiffres + 1 lettre</small>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Numéro SIRET</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="12345678901234"
                  maxLength={14}
                  value={profileForm.siret}
                  onChange={e => setProfileForm(f => ({ ...f, siret: e.target.value }))}
                />
                <small style={{ color: 'var(--gray)', fontSize: '0.78em', marginTop: 3, display: 'block' }}>14 chiffres</small>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: 'auto', marginTop: 8 }}
              onClick={handleProfileSave}
              disabled={profileSaving}
            >
              {profileSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 700 }}>Utilisation annuelle</h2>
              {quota?.renewal_date && (
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, background: '#eff6ff', padding: '4px 10px', borderRadius: 99 }}>
                  Renouvellement le {new Date(quota.renewal_date).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
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

          <div className="form-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--dark)' }}>Besoin de plus de certifications ?</div>
              <p style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: 4, marginBottom: 0 }}>
                Passez a un plan superieur depuis l'onglet Abonnement ou choisissez un Pack.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setActiveTab('packs')}>
                Voir les Packs
              </button>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setActiveTab('plans')}>
                Voir les Abonnements
              </button>
            </div>
          </div>
        </>
      )}

      {/* PACKS */}
      {activeTab === 'packs' && (
        <>
          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>Acheter des Packs supplémentaires</h2>
            <p style={{ color: 'var(--gray)', marginTop: 4, fontSize: '0.875rem' }}>
              Achetez un volume de certifications directement sans modifier votre abonnement annuel principal.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {packs.map(pack => (
              <div key={pack.id} className="form-card" style={{ padding: 24, marginBottom: 0, border: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: 'var(--dark)' }}>{pack.name}</h3>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>+{pack.diplomas_amount} <span style={{fontSize: '0.9rem', color: 'var(--gray)', fontWeight: 500}}>diplômes</span></div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--dark)', marginBottom: 16 }}>{pack.price} &euro;</div>
                <button 
                  className="btn btn-outline" 
                  style={{ marginTop: 'auto', width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }} 
                  onClick={() => handleBuyPack(pack)}
                >
                  Acheter
                </button>
              </div>
            ))}
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
                    onClick={() => {
                      setShowDeleteModal(false);
                      setOtpModal({
                        open: true,
                        userId,
                        actionType: 'DELETE_ACCOUNT',
                        title: '\uD83D\uDDD1\uFE0F Supprimer mon compte',
                        message: 'Confirmer définitivement la suppression de votre compte.',
                        details: 'Cette action est irréversible. Toutes vos données personnelles seront effacées. Les diplômes validés seront anonymisés.',
                        onConfirm: (otpCode) => handleDeleteAccount(otpCode),
                      });
                    }}
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

export default SchoolProfile;
