import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifierPortal from './pages/VerifierPortal';
import Login from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    setIsAuthenticated(!!userId); // true si userId existe
  }, []);

  const handleLogin = (userId, username) => {
    localStorage.setItem('user_id', userId);
    localStorage.setItem('username', username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="min-h-screen">
        {/* On passe l'état et la fonction de logout à la Navbar */}
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* On passe handleLogin à la page Login */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/admin" /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/admin" element={
            isAuthenticated ? <IssuerDashboard /> : <Navigate to="/login" />
          } />
          
          <Route path="/verify" element={<VerifierPortal />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;