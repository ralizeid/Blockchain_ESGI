import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const Home = () => {
  return (
    <div className="hero-container">
      
      <div>
        <h1 className="hero-title">
          CertiChain <span style={{color: '#2563eb'}}>🎓</span>
        </h1>
        <h2 className="hero-subtitle">
          La blockchain au service de la fiabilité des diplômes. 
          Authenticité garantie, vérification instantanée.
        </h2>
      </div>

      <div className="cards-grid">
        
        {/* Carte ÉCOLE */}
        <div className="card">
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏛️</div>
          <h3>Espace Établissement</h3>
          <p>Émettez des diplômes infalsifiables et certifiés sur le réseau Polygon.</p>
          {/* CORRECTION ICI : on pointe vers /login */}
          <Link to="/login" style={{width: '100%'}}>
            <button className="btn btn-primary">Accéder au Dashboard</button>
          </Link>
        </div>

        {/* Carte RECRUTEUR */}
        <div className="card">
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔍</div>
          <h3>Espace Vérificateur</h3>
          <p>Vérifiez l'authenticité d'un candidat ou d'un diplôme en moins de 3 secondes.</p>
          <Link to="/verify" style={{width: '100%'}}>
            <button className="btn btn-secondary">Vérifier un Diplôme</button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Home;