import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    rectorate_email: '',
    school_eth_address: '',
    rectorate_eth_address: '',
    subscription_plan: '',
    gdpr_consent: false,
    // Informations établissement
    school_name: '',
    school_type: '',
    school_address: '',
    school_zip: '',
    school_city: '',
    school_phone: '',
    school_website: '',
    director_name: '',
    uai_code: '',
    siret: '',
  });

  const [plans, setPlans]     = useState([]);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // Charger les plans disponibles dès l'affichage du formulaire d'inscription
  useEffect(() => {
    if (!isRegister) return;
    if (plans.length > 0) return;
    fetch('/api/plans/')
      .then(r => r.json())
      .then(data => {
        setPlans(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, subscription_plan: data[0].name }));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegister]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const endpoint = isRegister ? 'register' : 'login';

    try {
      const response = await fetch(`/api/${endpoint}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegister) {
          setSuccess("Inscription réussie ! Vous pouvez maintenant vous connecter.");
          setIsRegister(false);
        } else {
          onLogin(data.user_id, data.username);
        }
      } else {
        const errorMsg = typeof data === 'object' ? JSON.stringify(data) : data.error;
        setError(errorMsg || "Une erreur est survenue.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    }
  };

  const planColors = { STARTER: '#3b82f6', STANDARD: '#8b5cf6', PREMIUM: '#f59e0b' };

  return (
    <div className="hero-container">
      <div className="form-card" style={{ maxWidth: '480px' }}>
        <div className="form-header">
          <h2>{isRegister ? "Inscription Établissement" : "Connexion"}</h2>
        </div>

        {error   && <div className="msg-box msg-error">⚠️ {error}</div>}
        {success && <div className="msg-box msg-success">✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Identifiant École</label>
            <input className="input-field" type="text" name="username" onChange={handleChange} required />
          </div>

          {isRegister && (
            <>
              <div className="input-group">
                <label className="input-label">Email officiel de l'école</label>
                <input className="input-field" type="email" name="email" onChange={handleChange} required />
              </div>

              {/* ── Informations établissement ── */}
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '16px 0 12px', paddingTop: '16px' }}>
                <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 12px', fontSize: '0.95rem' }}>
                  🏫 Informations de l'établissement
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Nom officiel de l'établissement <span style={{color:'#ef4444'}}>*</span></label>
                <input className="input-field" type="text" name="school_name" placeholder="ex: Lycée Jules Ferry" onChange={handleChange} required />
              </div>

              <div className="input-group">
                <label className="input-label">Type d'établissement</label>
                <select className="input-field" name="school_type" onChange={handleChange} value={formData.school_type}>
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
                <input className="input-field" type="text" name="director_name" placeholder="ex: Marie Dupont" onChange={handleChange} />
              </div>

              <div className="input-group">
                <label className="input-label">Adresse postale</label>
                <input className="input-field" type="text" name="school_address" placeholder="ex: 12 rue de la Paix" onChange={handleChange} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="input-group" style={{ flex: '0 0 110px' }}>
                  <label className="input-label">Code postal</label>
                  <input className="input-field" type="text" name="school_zip" placeholder="75001" onChange={handleChange} pattern="\d{4,6}" />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Ville</label>
                  <input className="input-field" type="text" name="school_city" placeholder="Paris" onChange={handleChange} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Téléphone</label>
                <input className="input-field" type="tel" name="school_phone" placeholder="01 23 45 67 89" onChange={handleChange} />
              </div>

              <div className="input-group">
                <label className="input-label">Site web</label>
                <input className="input-field" type="url" name="school_website" placeholder="https://www.ecole.fr" onChange={handleChange} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="input-group" style={{ flex: '0 0 calc(50% - 5px)' }}>
                  <label className="input-label">Code UAI / RNE</label>
                  <input className="input-field" type="text" name="uai_code" placeholder="0750654E" onChange={handleChange} maxLength={8} />
                  <small style={{ color:'#64748b', fontSize:'0.78em', marginTop:'3px', display:'block' }}>7 chiffres + 1 lettre</small>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Numéro SIRET</label>
                  <input className="input-field" type="text" name="siret" placeholder="12345678901234" onChange={handleChange} maxLength={14} pattern="\d{14}" />
                  <small style={{ color:'#64748b', fontSize:'0.78em', marginTop:'3px', display:'block' }}>14 chiffres</small>
                </div>
              </div>

              {/* ── Rectorat ── */}
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '16px 0 12px', paddingTop: '16px' }}>
                <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 12px', fontSize: '0.95rem' }}>
                  🏛️ Rectorat &amp; Wallets MetaMask
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Email du Rectorat (Validateur)</label>
                <input
                  className="input-field"
                  type="email"
                  name="rectorate_email"
                  placeholder="ex: validation@academie-paris.fr"
                  onChange={handleChange}
                  required
                />
                <small style={{ color: '#64748b', fontSize: '0.8em', marginTop: '5px', display: 'block' }}>
                  ⚠️ Ce rectorat devra valider chaque diplôme émis par double authentification.
                </small>
              </div>

              <div className="input-group">
                <label className="input-label">Adresse MetaMask de l'école</label>
                <input
                  className="input-field"
                  type="text"
                  name="school_eth_address"
                  placeholder="0x..."
                  onChange={handleChange}
                  pattern="^0x[0-9a-fA-F]{40}$"
                  title="Adresse Ethereum valide (0x suivi de 40 caractères hexadécimaux)"
                />
                <small style={{ color: '#64748b', fontSize: '0.8em', marginTop: '5px', display: 'block' }}>
                  🔒 Seul ce wallet pourra signer les diplômes côté école.
                </small>
              </div>

              <div className="input-group">
                <label className="input-label">Adresse MetaMask du Rectorat</label>
                <input
                  className="input-field"
                  type="text"
                  name="rectorate_eth_address"
                  placeholder="0x..."
                  onChange={handleChange}
                  pattern="^0x[0-9a-fA-F]{40}$"
                  title="Adresse Ethereum valide (0x suivi de 40 caractères hexadécimaux)"
                />
                <small style={{ color: '#64748b', fontSize: '0.8em', marginTop: '5px', display: 'block' }}>
                  🔒 Seul ce wallet pourra signer les diplômes côté rectorat.
                </small>
              </div>

              {/* ── Sélection du plan d'abonnement ── */}
              <div className="input-group">
                <label className="input-label">Abonnement annuel</label>
                {plans.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.85em' }}>Chargement des plans…</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {plans.map(plan => {
                      const selected = formData.subscription_plan === plan.name;
                      const color    = planColors[plan.name] || '#3b82f6';
                      return (
                        <label
                          key={plan.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: selected ? `2px solid ${color}` : '2px solid #e2e8f0',
                            background: selected ? `${color}12` : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          <input
                            type="radio"
                            name="subscription_plan"
                            value={plan.name}
                            checked={selected}
                            onChange={handleChange}
                            style={{ accentColor: color }}
                          />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 'bold', color: color }}>{plan.display_name}</span>
                            <span style={{ color: '#64748b', fontSize: '0.85em', marginLeft: '8px' }}>
                              {plan.max_diplomas === -1 ? 'Diplômes illimités' : `${plan.max_diplomas} diplômes / an`}
                            </span>
                          </div>
                          <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{plan.annual_price} €/an</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* ── Consentement RGPD ── */}
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="gdpr_consent"
                    checked={formData.gdpr_consent}
                    onChange={handleChange}
                    required
                    style={{ marginTop: '3px', flexShrink: 0, accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.85em', color: '#1e293b', lineHeight: '1.5' }}>
                    J'ai lu et j'accepte la{' '}
                    <Link to="/privacy" target="_blank" style={{ color: 'var(--primary)' }}>
                      politique de confidentialité
                    </Link>{' '}
                    de CertiChain. Je consens au traitement de mes données personnelles conformément
                    au RGPD (Art. 7).
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label">Mot de passe</label>
            <input className="input-field" type="password" name="password" onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary">
            {isRegister ? "S'inscrire" : "Se connecter"}
          </button>
        </form>

        <p
          style={{ marginTop: '20px', cursor: 'pointer', color: 'var(--primary)', textAlign: 'center' }}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? "J'ai déjà un compte" : "Créer un compte établissement"}
        </p>
      </div>
    </div>
  );
};

export default Login;
