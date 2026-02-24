import React, { useState } from 'react';
import '../App.css';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  
  // AJOUT : on initialise rectorate_email dans le state
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    email: '', 
    rectorate_email: '' 
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (isRegister) {
          setSuccess("Inscription réussie ! Un email a été envoyé au rectorat pour liaison.");
          setIsRegister(false);
        } else {
          onLogin(data.user_id, data.username);
        }
      } else {
        // Affiche l'erreur renvoyée par Django (ex: email manquant)
        const errorMsg = typeof data === 'object' ? JSON.stringify(data) : data.error;
        setError(errorMsg || "Une erreur est survenue.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    }
  };

  return (
    <div className="hero-container">
      <div className="form-card" style={{ maxWidth: '450px' }}>
        <div className="form-header">
          <h2>{isRegister ? "Inscription Établissement" : "Connexion"}</h2>
        </div>

        {error && <div className="msg-box msg-error">⚠️ {error}</div>}
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

               {/* --- NOUVEAU CHAMP RECTORAT --- */}
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
                 <small style={{color: '#64748b', fontSize: '0.8em', marginTop: '5px', display: 'block'}}>
                    ⚠️ Ce rectorat devra valider chaque diplôme émis par double authentification.
                 </small>
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

        <p style={{marginTop: '20px', cursor: 'pointer', color: 'var(--primary)', textAlign: 'center'}} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "J'ai déjà un compte" : "Créer un compte établissement"}
        </p>
      </div>
    </div>
  );
};

export default Login;