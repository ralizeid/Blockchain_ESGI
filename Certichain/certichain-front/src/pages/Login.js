import React, { useState, useEffect } from 'react';
import '../App.css';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    rectorate_email: '',
    subscription_plan: '',
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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
