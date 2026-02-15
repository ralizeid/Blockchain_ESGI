import React, { useState } from 'react';
import '../App.css';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  
  // États pour les messages
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
          setSuccess("Compte créé avec succès ! Connectez-vous.");
          setIsRegister(false);
        } else {
          // Connexion réussie : On remonte l'info à App.js
          onLogin(data.user_id, data.username);
        }
      } else {
        // Erreur API
        setError(data.error || "Une erreur est survenue. Vérifiez vos informations.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    }
  };

  return (
    <div className="hero-container">
      <div className="form-card" style={{ maxWidth: '450px' }}>
        <div className="form-header">
          <h2>{isRegister ? "Créer un compte" : "Connexion"}</h2>
        </div>

        {/* Affichage des messages JOLIS */}
        {error && <div className="msg-box msg-error">⚠️ {error}</div>}
        {success && <div className="msg-box msg-success">✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Identifiant École</label>
            <input className="input-field" type="text" name="username" onChange={handleChange} required />
          </div>

          {isRegister && (
             <div className="input-group">
               <label className="input-label">Email</label>
               <input className="input-field" type="email" name="email" onChange={handleChange} required />
             </div>
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