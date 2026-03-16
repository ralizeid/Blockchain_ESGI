import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const Navbar = ({ isAuthenticated, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);
  
  const handleLogoutClick = () => {
    onLogout();
    setIsOpen(false); // CORRECTION : On force la fermeture au lieu d'inverser
    navigate('/');    // On redirige vers l'accueil
  };

  return (
    <>
      <nav className="navbar">
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span className="hamburger" onClick={toggleSidebar}>☰</span>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--dark)', fontWeight: '800', fontSize: '1.2rem' }}>
            CertiChain
          </Link>
        </div>

        <div>
          {isAuthenticated ? (
            <button 
              onClick={handleLogoutClick} 
              className="btn" 
              style={{background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '5px 15px'}}
            >
              Se déconnecter
            </button>
          ) : (
            <Link to="/login">
              <button className="btn btn-primary" style={{padding: '8px 16px', fontSize: '0.9rem'}}>Espace École</button>
            </Link>
          )}
        </div>
      </nav>

      {/* OVERLAY */}
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}></div>

      {/* SIDEBAR */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{padding: '0 25px 20px', fontSize: '1.5rem', fontWeight: 'bold', color: 'white'}}>
          Menu
        </div>
        
        <Link to="/" className="sidebar-link" onClick={() => setIsOpen(false)}>🏠 Accueil</Link>
        <Link to="/verify" className="sidebar-link" onClick={() => setIsOpen(false)}>🔍 Vérification Publique</Link>
        <Link to="/rectorat" className="sidebar-link" onClick={() => setIsOpen(false)}>🏛️ Espace Rectorat</Link>

        {isAuthenticated && (
          <>
            <div style={{margin: '20px 25px 10px', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px'}}>
              Administration
            </div>
            <Link to="/admin" className="sidebar-link" onClick={() => setIsOpen(false)}>🎓 Espace Émetteur</Link>
            <Link to="/school-profile" className="sidebar-link" onClick={() => setIsOpen(false)}>🏫 Profil & Abonnement</Link>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;