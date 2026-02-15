import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifierPortal from './pages/VerifierPortal';

function App() {
  const [account, setAccount] = useState(null);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar account={account} setAccount={setAccount} />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<IssuerDashboard account={account} />} />
            <Route path="/verify" element={<VerifierPortal />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;