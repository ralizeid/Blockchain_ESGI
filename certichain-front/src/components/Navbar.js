import React from 'react';
import { Link } from 'react-router-dom';
import ConnectWallet from './ConnectWallet';
import '../App.css';

const Navbar = ({ account, setAccount }) => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          CertiChain
        </Link>
      </div>
      
      <div className="nav-links">
        {/* Lien simple pour la vérification publique */}
        <Link to="/verify" className="nav-link">
          Vérification
        </Link>
        
        {/* Nouveau bouton "Se connecter" stylisé */}
        <Link 
          to="/login" 
          className="nav-link" 
          style={{ 
            border: '1px solid #e2e8f0', 
            padding: '8px 16px', 
            borderRadius: '8px',
            marginRight: '10px' // Espace avec le bouton wallet
          }}
        >
          Se connecter
        </Link>
        
        {/* Bouton de connexion Metamask */}
        <ConnectWallet setGlobalAccount={setAccount} />
      </div>
    </nav>
  );
};

export default Navbar;