import React, { useState } from 'react';
import '../App.css'; // S'assure que le style est chargé

const IssuerDashboard = ({ account }) => {
  const [formData, setFormData] = useState({ nom: '', prenom: '', dateObtention: '', diplomeFile: null });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, diplomeFile: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return alert("Connectez votre wallet d'abord !");
    setLoading(true);
    // Simulation...
    setTimeout(() => {
        alert("Diplôme certifié !");
        setLoading(false);
    }, 2000);
  };

  return (
    <div className="dashboard-container">
      <div className="form-card">
        <div className="form-header">
          <h2>🎓 Émettre un Diplôme</h2>
          <p style={{color: '#64748b'}}>Remplissez les informations pour générer un certificat sur la Blockchain Polygon.</p>
        </div>

        {/* Alerte si pas connecté */}
        {!account && (
          <div style={{background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center'}}>
            ⚠️ Veuillez connecter votre portefeuille Administrateur pour continuer.
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Nom de l'étudiant</label>
            <input className="input-field" type="text" name="nom" placeholder="Ex: Dupont" onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label className="input-label">Prénom de l'étudiant</label>
            <input className="input-field" type="text" name="prenom" placeholder="Ex: Jean" onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label className="input-label">Date d'obtention</label>
            <input className="input-field" type="date" name="dateObtention" onChange={handleChange} required />
          </div>
          
          <div className="input-group">
            <label className="input-label">Visuel du diplôme (PDF/Image)</label>
            <div className="file-upload-wrapper">
                <input type="file" accept=".pdf,.png,.jpg" onChange={handleFileChange} style={{width: '100%'}} required />
                <p style={{fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px'}}>Glissez un fichier ou cliquez pour parcourir</p>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || !account}
            style={{marginTop: '1rem', opacity: (loading || !account) ? 0.6 : 1}}
          >
            {loading ? "Certification en cours..." : "Certifier sur la Blockchain"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IssuerDashboard;