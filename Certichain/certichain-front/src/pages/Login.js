import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import '../App.css';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(() => {
    return sessionStorage.getItem('login_isRegister') === 'true';
  });

  useEffect(() => {
    sessionStorage.setItem('login_isRegister', isRegister);
  }, [isRegister]);

  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem('login_form_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      username: '',
      password: '',
      email: '',
      rectorate_email: '',
      school_eth_address: '',
      rectorate_eth_address: '',
      subscription_plan: '',
      gdpr_consent: false,
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
    };
  });

  useEffect(() => {
    // Évite de stocker le mot de passe pour des raisons de sécurité
    const { password, ...dataToSave } = formData;
    sessionStorage.setItem('login_form_data', JSON.stringify({ ...dataToSave, password: '' }));
  }, [formData]);

  const [step, setStep] = useState(() => {
    const savedStep = sessionStorage.getItem('login_step');
    return savedStep ? parseInt(savedStep, 10) : 1;
  });

  useEffect(() => {
    sessionStorage.setItem('login_step', step);
  }, [step]);
  const [plans, setPlans]     = useState([]);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  
  const [hasSchoolWallet, setHasSchoolWallet] = useState(true);
  const [generatedSchoolPrivateKey, setGeneratedSchoolPrivateKey] = useState('');

  const generateSchoolWallet = () => {
    try {
      const wallet = ethers.Wallet.createRandom();
      setGeneratedSchoolPrivateKey(wallet.privateKey);
      setFormData(prev => ({ ...prev, school_eth_address: wallet.address }));
    } catch (err) {
      setError("Erreur lors de la génération du wallet de l'école.");
    }
  };

  const [hasRectorateWallet, setHasRectorateWallet] = useState(true);
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState('');

  const generateRectorateWallet = () => {
    try {
      const wallet = ethers.Wallet.createRandom();
      setGeneratedPrivateKey(wallet.privateKey);
      setFormData(prev => ({ ...prev, rectorate_eth_address: wallet.address }));
    } catch (err) {
      setError("Erreur lors de la génération du wallet.");
    }
  };

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

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.username || formData.username.trim() === '') return setError("L'identifiant école est requis.");
      if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) return setError("Un email officiel valide est requis.");
      if (!formData.school_name || formData.school_name.trim() === '') return setError("Le nom de l'établissement est requis.");
      if (hasSchoolWallet && (!formData.school_eth_address || !/^0x[a-fA-F0-9]{40}$/.test(formData.school_eth_address))) {
        return setError("L'adresse MetaMask de l'école est invalide (doit commencer par 0x suivi de 40 caractères hexadécimaux).");
      }
      if (!hasSchoolWallet && !formData.school_eth_address) {
        return setError("Veuillez générer une adresse publique pour l'école.");
      }
      const complexPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
      if (!formData.password || !complexPasswordRegex.test(formData.password)) {
        return setError("Le mot de passe doit faire au moins 12 caractères et contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.");
      }
    } else if (step === 2) {
      if (!formData.school_type || formData.school_type.trim() === '') return setError("Prenez soin de sélectionner le type d'établissement.");
      if (formData.uai_code && formData.uai_code.length !== 8) return setError("Le code UAI / RNE doit contenir exactement 8 caractères.");
      if (formData.siret && !/^\d{14}$/.test(formData.siret)) return setError("Le numéro SIRET doit contenir exactement 14 chiffres.");
    }

    setStep(s => s + 1);
  };

  const handlePrevStep = () => {
    setStep(s => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      if (step < 3) {
        handleNextStep(e);
        return;
      }
      
      // Step 3 validation
      if (!formData.rectorate_email || !/\S+@\S+\.\S+/.test(formData.rectorate_email)) return setError("L'email du rectorat est invalide.");
      if (hasRectorateWallet && (!formData.rectorate_eth_address || !/^0x[a-fA-F0-9]{40}$/.test(formData.rectorate_eth_address))) {
        return setError("L'adresse MetaMask du rectorat est obligatoire (doit commencer par 0x suivi de 40 caractères hexadécimaux).");
      }
      if (!hasRectorateWallet && !formData.rectorate_eth_address) {
        return setError("Veuillez générer une adresse publique pour le rectorat (obligatoire).");
      }
      if (!formData.gdpr_consent) {
        return setError("Vous devez accepter la politique de confidentialité.");
      }
    }

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

  const planColors = { ESSENTIEL: '#3b82f6', CAMPUS: '#8b5cf6', UNIVERSITE: '#f59e0b', ACADEMIE: '#10b981' };

    return (
    <div className="hero-container">
      <div className="form-card" style={{ maxWidth: '480px' }}>
        <div className="form-header">
          <h2>{isRegister ? "Inscription Établissement" : "Connexion"}</h2>
          {isRegister && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '10px' }}>
              <div style={{ height: '5px', width: '30%', backgroundColor: step >= 1 ? 'var(--primary)' : '#e2e8f0', borderRadius: '5px' }} />
              <div style={{ height: '5px', width: '30%', backgroundColor: step >= 2 ? 'var(--primary)' : '#e2e8f0', borderRadius: '5px' }} />
              <div style={{ height: '5px', width: '30%', backgroundColor: step >= 3 ? 'var(--primary)' : '#e2e8f0', borderRadius: '5px' }} />
            </div>
          )}
        </div>

        {error   && <div className="msg-box msg-error">⚠️ {error}</div>}
        {success && <div className="msg-box msg-success">✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          {(!isRegister || step === 1) && (
            <>
              <div className="input-group">
                <label className="input-label">Identifiant École <span style={{color: "#ef4444"}}>*</span></label>
                <input className="input-field" type="text" name="username" value={formData.username} onChange={handleChange} required />
              </div>

              {(!isRegister) && (
                <div className="input-group">
                  <label className="input-label">Mot de passe <span style={{color: "#ef4444"}}>*</span></label>
                  <input className="input-field" type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
              )}
              
              {isRegister && (
                <>
                  <div className="input-group">
                    <label className="input-label">Email officiel de l'école <span style={{color: "#ef4444"}}>*</span></label>
                    <input className="input-field" type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Nom officiel de l'établissement <span style={{color:'#ef4444'}}>*</span></label>
                    <input className="input-field" type="text" name="school_name" value={formData.school_name} placeholder="ex: Lycée Jules Ferry" onChange={handleChange} required />
                  </div>
                  <div className="input-group" style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                    <label className="input-label">L'école possède-t-elle déjà une adresse MetaMask / Ethereum ?</label>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px', marginBottom: '15px' }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input type="radio" checked={hasSchoolWallet} onChange={() => setHasSchoolWallet(true)} style={{ accentColor: 'var(--primary)' }} />
                        Oui
                      </label>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input type="radio" checked={!hasSchoolWallet} onChange={() => {
                          setHasSchoolWallet(false);
                          if (!formData.school_eth_address || generatedSchoolPrivateKey === '') {
                            generateSchoolWallet();
                          }
                        }} style={{ accentColor: 'var(--primary)' }} />
                        Non, générer pour moi
                      </label>
                    </div>

                    {hasSchoolWallet ? (
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Adresse MetaMask de l'école <span style={{color: "#ef4444"}}>*</span></label>
                        <input className="input-field" type="text" name="school_eth_address" value={formData.school_eth_address} placeholder="0x..." onChange={handleChange} pattern="^0x[0-9a-fA-F]{40}$" title="Adresse Ethereum valide" required={hasSchoolWallet} />
                        <small style={{ color: '#64748b', fontSize: '0.8em', marginTop: '5px', display: 'block' }}>
                          🔒 Ce wallet signera les diplômes.
                        </small>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button type="button" onClick={generateSchoolWallet} className="btn" style={{ backgroundColor: '#e2e8f0', color: '#1e293b', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                          🔄 regénérer une adresse
                        </button>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label className="input-label">Adresse Publique (générée)</label>
                          <input className="input-field" type="text" name="school_eth_address" value={formData.school_eth_address} readOnly style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} />
                        </div>
                        {generatedSchoolPrivateKey && (
                          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                            <p style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '0.85rem', margin: '0 0 5px 0' }}>⚠️ CLÉ PRIVÉE - TRÈS IMPORTANT</p>
                            <p style={{ color: '#991b1b', fontSize: '0.75rem', margin: '0 0 10px 0' }}>
                              Copiez cette clé privée de toute urgence et conservez-la précieusement. Elle ne sera plus <strong>jamais</strong> affichée et est strictement nécessaire pour vous connecter sur MetaMask.
                            </p>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <input type="text" value={generatedSchoolPrivateKey} readOnly style={{ flex: 1, padding: '5px', fontSize: '0.8rem', border: '1px solid #f87171', borderRadius: '4px', backgroundColor: '#fff' }} />
                              <button type="button" onClick={() => navigator.clipboard.writeText(generatedSchoolPrivateKey)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer', fontSize: '0.8rem' }}>Copier</button>
                            </div>
                            <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#991b1b', backgroundColor: '#fee2e2', padding: '8px', borderRadius: '4px' }}>
                              <span>Tutoriel : </span> 
                              <Link to="/support" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: '#b91c1c', textDecoration: 'underline' }}>
                                Comment importer cette clé dans MetaMask ?
                              </Link>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="input-group">
                    <label className="input-label">Mot de passe <span style={{color: "#ef4444"}}>*</span></label>
                    <input className="input-field" type="password" name="password" value={formData.password} onChange={handleChange} required />
                  </div>
                </>
              )}
            </>
          )}

          {isRegister && step === 2 && (
            <>
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '0 0 12px', paddingTop: '10px' }}>
                <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 12px', fontSize: '0.95rem' }}>
                  🏫 Informations de l'établissement
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Type d'établissement <span style={{color: "#ef4444"}}>*</span></label>
                <select className="input-field" name="school_type" onChange={handleChange} value={formData.school_type}>
                  <option value="">— Sélectionner —</option>
                  <option value="UNIVERSITE">Université</option>
                  <option value="GRANDE_ECOLE">Grande École</option>
                  <option value="INGENIEUR">École d'ingénieurs</option>
                  <option value="COMMERCE">École de commerce</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Nom du directeur / chef d'établissement <span style={{color: "#ef4444"}}>*</span></label>
                <input className="input-field" type="text" name="director_name" required value={formData.director_name} placeholder="ex: Marie Dupont" onChange={handleChange} />
              </div>

              <div className="input-group">
                <label className="input-label">Adresse postale <span style={{color: "#ef4444"}}>*</span></label>
                <input className="input-field" type="text" name="school_address" required value={formData.school_address} placeholder="ex: 12 rue de la Paix" onChange={handleChange} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="input-group" style={{ flex: '0 0 110px' }}>
                  <label className="input-label">Code postal <span style={{color: "#ef4444"}}>*</span></label>
                  <input className="input-field" type="text" name="school_zip" required value={formData.school_zip} placeholder="75001" onChange={handleChange} pattern="\d{4,6}" />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Ville <span style={{color: "#ef4444"}}>*</span></label>
                  <input className="input-field" type="text" name="school_city" required value={formData.school_city} placeholder="Paris" onChange={handleChange} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Téléphone <span style={{color: "#ef4444"}}>*</span></label>
                <input className="input-field" type="tel" name="school_phone" required value={formData.school_phone} placeholder="01 23 45 67 89" onChange={handleChange} />
              </div>

              <div className="input-group">
                <label className="input-label">Site web</label>
                <input className="input-field" type="url" name="school_website" value={formData.school_website} placeholder="https://www.ecole.fr" onChange={handleChange} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="input-group" style={{ flex: '0 0 calc(50% - 5px)' }}>
                  <label className="input-label">Code UAI / RNE <span style={{color: "#ef4444"}}>*</span></label>
                  <input className="input-field" type="text" name="uai_code" required value={formData.uai_code} placeholder="0750654E" onChange={handleChange} maxLength={8} />
                  <small style={{ color:'#64748b', fontSize:'0.78em', marginTop:'3px', display:'block' }}>7 chiffres + 1 lettre</small>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Numéro SIRET <span style={{color: "#ef4444"}}>*</span></label>
                  <input className="input-field" type="text" name="siret" required value={formData.siret} placeholder="12345678901234" onChange={handleChange} maxLength={14} pattern="\d{14}" />
                  <small style={{ color:'#64748b', fontSize:'0.78em', marginTop:'3px', display:'block' }}>14 chiffres</small>
                </div>
              </div>
            </>
          )}

          {isRegister && step === 3 && (
            <>
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '0 0 12px', paddingTop: '10px' }}>
                <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 12px', fontSize: '0.95rem' }}>
                  🏛️ Rectorat & Wallets MetaMask
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Email du Rectorat (Validateur) <span style={{color: "#ef4444"}}>*</span></label>
                <input className="input-field" type="email" name="rectorate_email" value={formData.rectorate_email} placeholder="ex: validation@academie-paris.fr" onChange={handleChange} required />
                <small style={{ color: '#64748b', fontSize: '0.8em', marginTop: '5px', display: 'block' }}>
                  ⚠️ Ce rectorat devra valider chaque diplôme émis.
                </small>
              </div>

              <div className="input-group" style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <label className="input-label">Le rectorat possède-t-il déjà une adresse MetaMask / Ethereum ?</label>
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px', marginBottom: '15px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input type="radio" checked={hasRectorateWallet} onChange={() => setHasRectorateWallet(true)} style={{ accentColor: 'var(--primary)' }} />
                    Oui
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input type="radio" checked={!hasRectorateWallet} onChange={() => {
                      setHasRectorateWallet(false);
                      if (!formData.rectorate_eth_address || generatedPrivateKey === '') {
                        generateRectorateWallet();
                      }
                    }} style={{ accentColor: 'var(--primary)' }} />
                    Non, générer pour eux
                  </label>
                </div>

                {hasRectorateWallet ? (
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Adresse MetaMask du Rectorat <span style={{color: "#ef4444"}}>*</span></label>
                        <input className="input-field" type="text" name="rectorate_eth_address" value={formData.rectorate_eth_address} placeholder="0x..." onChange={handleChange} pattern="^0x[0-9a-fA-F]{40}$" required />
                      </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button type="button" onClick={generateRectorateWallet} className="btn" style={{ backgroundColor: '#e2e8f0', color: '#1e293b', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                      🔄 regénérer une adresse
                    </button>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Adresse Publique (générée)</label>
                      <input className="input-field" type="text" name="rectorate_eth_address" value={formData.rectorate_eth_address} readOnly style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} />
                    </div>
                    {generatedPrivateKey && (
                      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>
                        <p style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: '0.85rem', margin: '0 0 5px 0' }}>⚠️ CLÉ PRIVÉE - TRÈS IMPORTANT</p>
                        <p style={{ color: '#991b1b', fontSize: '0.75rem', margin: '0 0 10px 0' }}>
                          Copiez cette clé privée de toute urgence et transmettez-la au rectorat de manière sécurisée. Elle ne sera plus <strong>jamais</strong> affichée et est strictement nécessaire pour qu'ils puissent se connecter sur MetaMask.
                        </p>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <input type="text" value={generatedPrivateKey} readOnly style={{ flex: 1, padding: '5px', fontSize: '0.8rem', border: '1px solid #f87171', borderRadius: '4px', backgroundColor: '#fff' }} />
                          <button type="button" onClick={() => navigator.clipboard.writeText(generatedPrivateKey)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px', cursor: 'pointer', fontSize: '0.8rem' }}>Copier</button>
                        </div>                          <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#991b1b', backgroundColor: '#fee2e2', padding: '8px', borderRadius: '4px' }}>
                            <span>Tutoriel : </span> 
                            <Link to="/support" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: '#b91c1c', textDecoration: 'underline' }}>
                              Comment importer cette clé dans MetaMask ?
                            </Link>
                          </p>                      </div>
                    )}
                  </div>
                )}
              </div>

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
                        <label key={plan.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: selected ? `2px solid ${color}` : '2px solid #e2e8f0', background: selected ? `${color}12` : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <input type="radio" name="subscription_plan" value={plan.name} checked={selected} onChange={handleChange} style={{ accentColor: color }} />
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

              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" name="gdpr_consent" checked={formData.gdpr_consent} onChange={handleChange} required style={{ marginTop: '3px', flexShrink: 0, accentColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.85em', color: '#1e293b', lineHeight: '1.5' }}>
                    J'ai lu et j'accepte la <Link to="/privacy" target="_blank" style={{ color: 'var(--primary)' }}>politique de confidentialité</Link> de CertiChain. Je consens au traitement de mes donnés personnelles.
                  </span>
                </label>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {isRegister && step > 1 && (
               <button type="button" className="btn btn-secondary" onClick={handlePrevStep} style={{ flex: 1, backgroundColor: '#cbd5e1', color: '#1e293b' }}>
                 Précédent
               </button>
            )}
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isRegister ? (step < 3 ? 'Suivant' : "S'inscrire") : "Se connecter"}
            </button>
          </div>
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
