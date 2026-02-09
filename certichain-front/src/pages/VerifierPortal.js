import React, { useState } from 'react';
import '../App.css';

const VerifierPortal = () => {
  const [searchId, setSearchId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if(!searchId) return;
    setLoading(true);
    
    // Simulation d'attente réseau pour l'effet "Recherche"
    setTimeout(() => {
        setResult({
          valid: true,
          student: "Mohammed Kaddouri", // Exemple tiré de ton doc
          school: "ESGI - Mastère Blockchain",
          date: "2025-06-30",
          ipfsLink: "#"
        });
        setLoading(false);
    }, 1500);
  };

  return (
    <div className="dashboard-container" style={{textAlign: 'center'}}>
      
      <h1 style={{fontSize: '2rem', marginBottom: '10px'}}>Vérification Publique</h1>
      <p style={{color: '#64748b', marginBottom: '30px'}}>
        Entrez l'identifiant unique (Token ID) ou le hash du diplôme pour vérifier son authenticité.
      </p>

      {/* Barre de recherche style "Google" */}
      <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '40px'}}>
        <input 
            type="text" 
            className="input-field" 
            placeholder="Ex: 0x8f3... ou ID du diplôme" 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            style={{maxWidth: '400px'}}
        />
        <button className="btn btn-primary" onClick={handleVerify} disabled={loading} style={{width: 'auto'}}>
            {loading ? 'Recherche...' : 'Vérifier'}
        </button>
      </div>

      {/* Résultat visuel "Certificat" */}
      {result && (
        <div className="certificate-result animate-fade-in">
          <div className="certificate-header">
            <span style={{fontSize: '1.5rem'}}>✅</span>
            <span>DIPLÔME AUTHENTIQUE ET VÉRIFIÉ</span>
          </div>
          
          <div className="certificate-body">
            <div className="certificate-row">
              <span className="certificate-label">Bénéficiaire :</span>
              <span className="certificate-value">{result.student}</span>
            </div>
            <div className="certificate-row">
              <span className="certificate-label">Établissement :</span>
              <span className="certificate-value">{result.school}</span>
            </div>
            <div className="certificate-row">
              <span className="certificate-label">Date d'émission :</span>
              <span className="certificate-value">{result.date}</span>
            </div>
            <div className="certificate-row" style={{borderBottom: 'none'}}>
              <span className="certificate-label">Preuve numérique :</span>
              <a href={result.ipfsLink} className="certificate-value" style={{color: '#2563eb'}}>
                Voir le document original (IPFS) ↗
              </a>
            </div>
          </div>
          
          <div style={{background: '#f8fafc', padding: '15px', fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid #e2e8f0'}}>
            Certifié sur la Blockchain Polygon • Immuable & Sécurisé
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifierPortal;