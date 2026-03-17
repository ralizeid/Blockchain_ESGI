import os

path = 'Certichain/certichain-front/src/pages/Login.js'
with open(path, 'r', encoding='utf-8') as f:
    original = f.read()

# I am going to replace everything inside the `return (` statement.
# Let's split securely.

start_marker = "return ("
start_idx = original.find(start_marker)
end_marker = "export default Login;"
end_idx = original.find(end_marker)

new_return = """  return (
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
                <label className="input-label">Identifiant École</label>
                <input className="input-field" type="text" name="username" value={formData.username} onChange={handleChange} required />
              </div>
              
              {isRegister && (
                <>
                  <div className="input-group">
                    <label className="input-label">Email officiel de l'école</label>
                    <input className="input-field" type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Nom officiel de l'établissement <span style={{color:'#ef4444'}}>*</span></label>
                    <input className="input-field" type="text" name="school_name" value={formData.school_name} placeholder="ex: Lycée Jules Ferry" onChange={handleChange} required />
                  </div>
                </>
              )}

              <div className="input-group">
                <label className="input-label">Mot de passe</label>
                <input className="input-field" type="password" name="password" value={formData.password} onChange={handleChange} required />
              </div>
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
                <label className="input-label">Nom du drecteur / chef d'établissement</label>
                <input className="input-field" type="text" name="director_name" value={formData.director_name} placeholder="ex: Marie Dupont" onChange={handleChange} />
              </div>

              <div className="input-group">
                <label className="input-label">Adresse postale</label>
                <input className="input-field" type="text" name="school_address" value={formData.school_address} placeholder="ex: 12 rue de la Paix" onChange={handleChange} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="input-group" style={{ flex: '0 0 110px' }}>
                  <label className="input-label">Code postal</label>
                  <input className="input-field" type="text" name="school_zip" value={formData.school_zip} placeholder="75001" onChange={handleChange} pattern="\d{4,6}" />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Ville</label>
                  <input className="input-field" type="text" name="school_city" value={formData.school_city} placeholder="Paris" onChange={handleChange} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Téléphone</label>
                <input className="input-field" type="tel" name="school_phone" value={formData.school_phone} placeholder="01 23 45 67 89" onChange={handleChange} />
              </div>

              <div className="input-group">
                <label className="input-label">Site web</label>
                <input className="input-field" type="url" name="school_website" value={formData.school_website} placeholder="https://www.ecole.fr" onChange={handleChange} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="input-group" style={{ flex: '0 0 calc(50% - 5px)' }}>
                  <label className="input-label">Code UAI / RNE</label>
                  <input className="input-field" type="text" name="uai_code" value={formData.uai_code} placeholder="0750654E" onChange={handleChange} maxLength={8} />
                  <small style={{ color:'#64748b', fontSize:'0.78em', marginTop:'3px', display:'block' }}>7 chiffres + 1 lettre</small>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Numéro SIRET</label>
                  <input className="input-field" type="text" name="siret" value={formData.siret} placeholder="12345678901234" onChange={handleChange} maxLength={14} pattern="\d{14}" />
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
                <label className="input-label">Email du Rectorat (Validateur)</label>
                <input className="input-field" type="email" name="rectorate_email" value={formData.rectorate_email} placeholder="ex: validation@academie-paris.fr" onChange={handleChange} required />
                <small style={{ color: '#64748b', fontSize: '0.8em', marginTop: '5px', display: 'block' }}>
                  ⚠️ Ce rectorat devra valider chaque diplôme émis.
                </small>
              </div>

              <div className="input-group">
                <label className="input-label">Adresse MetaMask de l'école</label>
                <input className="input-field" type="text" name="school_eth_address" value={formData.school_eth_address} placeholder="0x..." onChange={handleChange} pattern="^0x[0-9a-fA-F]{40}$" />
              </div>

              <div className="input-group">
                <label className="input-label">Adresse MetaMask du Rectorat</label>
                <input className="input-field" type="text" name="rectorate_eth_address" value={formData.rectorate_eth_address} placeholder="0x..." onChange={handleChange} pattern="^0x[0-9a-fA-F]{40}$" />
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
"""

new_file = original[:start_idx] + new_return + "\n" + original[end_idx:]
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_file)
print("done rewriting login.js")
