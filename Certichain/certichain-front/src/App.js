import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifierPortal from './pages/VerifierPortal';
import Login from './pages/Login';
import Validate from './pages/Validate';
import SchoolProfile from './pages/SchoolProfile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import VerifyDiploma from './pages/VerifyDiploma';
import RectoratDashboard from './pages/RectoratDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      const userId = sessionStorage.getItem('user_id');
      const loginTime = sessionStorage.getItem('login_time');

      // Vérification de la session : 12 heures en millisecondes = 43200000 ms
      if (userId && loginTime) {
        const now = new Date().getTime();
        const timeElapsed = now - parseInt(loginTime, 10);

        if (timeElapsed > 12 * 60 * 60 * 1000) {
          // Expiration : Plus de 12h, on déconnecte
          sessionStorage.clear();
          setIsAuthenticated(false);
          // Optionnel : Recharger la page pour rediriger l'utilisateur vers /login immédiatement
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        } else {
          // Valide : Moins de 12h
          setIsAuthenticated(true);
        }
      } else {
        // Pas de données valides : on assure la déconnexion initiale
        sessionStorage.clear();
        setIsAuthenticated(false);
      }
    };

    // Vérifier immédiatement au chargement de l'application
    checkSession();

    // Vérifier périodiquement (toutes les 5 minutes) au cas où l'utilisateur laisse l'onglet ouvert
    const intervalId = setInterval(checkSession, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleLogin = (userId, username) => {
    sessionStorage.setItem('user_id', userId);
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('login_time', new Date().getTime().toString());
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
  };

  return (
    <Router>
      <div className="min-h-screen">
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/admin" /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/admin" element={
            isAuthenticated ? <IssuerDashboard /> : <Navigate to="/login" />
          } />
          
          <Route path="/verify" element={<VerifierPortal />} />
          
          {/* NOUVELLE ROUTE POUR LA VALIDATION (Accessible à tous, pas besoin d'être connecté) */}
          <Route path="/validate/:token" element={<Validate />} />
          <Route path="/school-profile" element={isAuthenticated ? <SchoolProfile /> : <Navigate to="/login" />
} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          {/* Vérification publique par UUID étudiant (QR Code) */}
          <Route path="/verify/:uuid" element={<VerifyDiploma />} />
          {/* Tableau de bord Rectorat (public, auth via MetaMask) */}
          <Route path="/rectorat" element={<RectoratDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;