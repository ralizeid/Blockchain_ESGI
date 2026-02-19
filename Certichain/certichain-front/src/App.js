import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifierPortal from './pages/VerifierPortal';
import Login from './pages/Login';
import Validate from './pages/Validate'; // <-- Import de la nouvelle page

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    setIsAuthenticated(!!userId);
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;