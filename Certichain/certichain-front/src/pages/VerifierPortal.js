import React, { useState } from 'react';
import '../App.css';

const VerifierPortal = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedDiploma, setSelectedDiploma] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search/?query=${query}`);
      const data = await res.json();
      setResults(data);
      setSelectedDiploma(null); 
    } catch (e) {
      console.error("Erreur connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Helper pour l'URL
  const getFileUrl = (path) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${path}`;
  };

  return (
    <div className="dashboard-container">
      <h1 style={{textAlign: 'center'}}>Vérification Publique</h1>
      
      <div style={{display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center'}}>
        <input 
          className="input-field" 
          placeholder="Nom de famille ou ID du diplôme..." 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{maxWidth: '400px'}}
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading} style={{width: 'auto'}}>
          {loading ? '...' : 'Rechercher'}
        </button>
      </div>

      {/* LISTE DES RÉSULTATS */}
      {!selectedDiploma && results.length > 0 && (
        <div className="form-card animate-fade-in">
          <h3 style={{marginTop: 0}}>{results.length} Résultat(s) trouvé(s)</h3>
          {results.map(d => (
            <div key={d.id} 
                 onClick={() => setSelectedDiploma(d)}
                 style={{padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                 onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                 onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
              <div>
                <strong>{d.last_name.toUpperCase()} {d.first_name}</strong>
                <div style={{color: '#64748b', fontSize: '0.9em'}}>{d.course_name}</div>
              </div>
              <button className="btn btn-secondary" style={{width: 'auto', padding: '5px 15px', fontSize: '0.8rem'}}>Voir</button>
            </div>
          ))}
        </div>
      )}

      {/* DÉTAIL DU DIPLÔME SÉLECTIONNÉ */}
      {selectedDiploma && (
        <div className="certificate-result animate-fade-in">
          <div className="certificate-header">✅ DIPLÔME AUTHENTIQUE</div>
          <div className="certificate-body">
            <h2 style={{textAlign: 'center', marginBottom: '10px'}}>{selectedDiploma.first_name} {selectedDiploma.last_name}</h2>
            <p style={{textAlign: 'center', color: '#64748b', marginBottom: '30px'}}>
              {selectedDiploma.course_name} • {selectedDiploma.graduation_date}
            </p>
            
            <div className="certificate-row">
              <span className="certificate-label">Établissement émetteur :</span> 
              <b>ESGI (Certifié)</b>
            </div>
            <div className="certificate-row">
              <span className="certificate-label">ID Unique :</span> 
              <b>#{selectedDiploma.id}</b>
            </div>
            
            {/* BOUTON TÉLÉCHARGER UNIQUEMENT */}
            {selectedDiploma.image && (
              <div style={{marginTop: '40px', textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1'}}>
                 <p style={{marginBottom: '15px', color: '#64748b', fontSize: '0.9rem'}}>Le document officiel est disponible au téléchargement :</p>
                 <a 
                    href={getFileUrl(selectedDiploma.image)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-primary" // J'ai mis le style 'btn-primary' pour qu'il ressorte bien
                    style={{textDecoration: 'none', display: 'inline-block'}}
                    download
                 >
                    📥 Télécharger le Document Original
                 </a>
              </div>
            )}
            
            <div style={{textAlign: 'center', marginTop: '30px'}}>
              <button className="btn btn-secondary" onClick={() => setSelectedDiploma(null)} style={{width: 'auto'}}>
                Retour à la recherche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifierPortal;