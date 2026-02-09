import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulation d'une connexion réussie (sans Backend pour le moment)
    console.log("Tentative de connexion avec :", credentials);
    
    // On redirige vers le dashboard admin
    navigate('/admin');
  };

  return (
    <div className="hero-container" style={{ minHeight: '80vh', background: 'var(--light)' }}>
      <div className="form-card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem' }}>
        
        <div className="form-header">
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏛️</div>
          <h2>Portail Établissement</h2>
          <p style={{ color: '#64748b' }}>Connectez-vous pour émettre et gérer les certifications académiques.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Email institutionnel</label>
            <input 
              className="input-field" 
              type="email" 
              name="email" 
              placeholder="admin@ecole.fr" 
              value={credentials.email}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Mot de passe</label>
            <input 
              className="input-field" 
              type="password" 
              name="password" 
              placeholder="••••••••" 
              value={credentials.password}
              onChange={handleChange}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Se connecter
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#94a3b8' }}>
          <p>Pas encore inscrit ? <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Contacter le support CertiChain</a></p>
        </div>

      </div>
    </div>
  );
};

export default Login;