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
      {/* ===== BARRE DE NAVIGATION ===== */}
      <nav className="navbar">

        {/* Logo + Hamburger */}
        <div className="navbar-left">
          <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Ouvrir le menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 5H17.5M2.5 10H17.5M2.5 15H17.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>

          <Link to="/" className="nav-brand">
            <img
              className="nav-brand-icon nav-brand-icon-img"
              src={`${process.env.PUBLIC_URL}/favicon.ico`}
              alt="CertiChain"
            />
            <span>CertiChain</span>
          </Link>
        </div>

        {/* Actions à droite */}
        <div className="navbar-right">
          {isAuthenticated ? (
            <button
              onClick={handleLogoutClick}
              className="btn btn-ghost"
            >
              Se déconnecter
            </button>
          ) : (
            <Link to="/login">
              <button className="btn btn-primary btn-sm">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 1.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 7.5C4.69 9 2 10.12 2 12v1h11v-1c0-1.88-2.69-3-5.5-3z" fill="currentColor"/>
                </svg>
                Espace École
              </button>
            </Link>
          )}
        </div>
      </nav>

      {/* ===== OVERLAY ===== */}
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}></div>

      {/* ===== SIDEBAR ===== */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>

        {/* En-tête sidebar */}
        <div className="sidebar-header">
          <svg width="26" height="26" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 2L27 9V21L15 28L3 21V9L15 2Z" fill="url(#hexSideGrad)"/>
            <path d="M10.5 15L13.5 18L19.5 12" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="hexSideGrad" x1="3" y1="2" x2="27" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1"/>
                <stop offset="1" stopColor="#818CF8"/>
              </linearGradient>
            </defs>
          </svg>
          <span>CertiChain</span>
        </div>

        {/* Liens de navigation */}
        <nav className="sidebar-nav">

          <Link to="/" className="sidebar-link" onClick={() => setIsOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1.5 6.75L9 1.5L16.5 6.75V15.75A1.5 1.5 0 0 1 15 17.25H11.25V12H6.75V17.25H3A1.5 1.5 0 0 1 1.5 15.75V6.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Accueil</span>
          </Link>

          <Link to="/verify" className="sidebar-link" onClick={() => setIsOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8.25" cy="8.25" r="5.625" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M15.75 15.75L12.525 12.525" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Vérification Publique</span>
          </Link>

          <Link to="/rectorat" className="sidebar-link" onClick={() => setIsOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2.25 16.5V7.5L9 1.5L15.75 7.5V16.5H11.25V11.25H6.75V16.5H2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Espace Rectorat</span>
          </Link>

          <Link to="/support" className="sidebar-link" onClick={() => setIsOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 12V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="6" r="0.75" fill="currentColor"/>
            </svg>
            <span>Guide & Support</span>
          </Link>

          <Link to="/legal" className="sidebar-link" onClick={() => setIsOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5L2.25 5.25V9C2.25 12.728 5.272 15.75 9 16.5C12.728 15.75 15.75 12.728 15.75 9V5.25L9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.75 9L8.25 10.5L11.25 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Mentions légales</span>
          </Link>

          {isAuthenticated && (
            <>
              <div className="sidebar-section-label">Administration</div>

              <Link to="/admin" className="sidebar-link" onClick={() => setIsOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2.25" y="2.25" width="5.625" height="5.625" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="10.125" y="2.25" width="5.625" height="5.625" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="2.25" y="10.125" width="5.625" height="5.625" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="10.125" y="10.125" width="5.625" height="5.625" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span>Espace Émetteur</span>
              </Link>

              <Link to="/school-profile" className="sidebar-link" onClick={() => setIsOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="5.625" r="3.375" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2.25 16.5C2.25 13.186 5.272 10.5 9 10.5C12.728 10.5 15.75 13.186 15.75 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Profil & Abonnement</span>
              </Link>
            </>
          )}

        </nav>
      </div>
    </>
  );
};

export default Navbar;
