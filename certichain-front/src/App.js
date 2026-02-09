import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifierPortal from './pages/VerifierPortal';
import Login from './pages/Login'; // <--- 1. IMPORT

function App() {
  const [account, setAccount] = useState(null);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar account={account} setAccount={setAccount} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} /> {/* <--- 2. ROUTE LOGIN */}
          <Route path="/admin" element={<IssuerDashboard account={account} />} />
          <Route path="/verify" element={<VerifierPortal />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;