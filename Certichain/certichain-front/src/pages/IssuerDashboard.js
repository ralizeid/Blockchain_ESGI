import React, { useState, useEffect } from 'react';
import '../App.css';

const IssuerDashboard = () => {
  const userId = localStorage.getItem('user_id');
  const [activeTab, setActiveTab] = useState('create'); 
  const [myDiplomas, setMyDiplomas] = useState([]);
  const [selectedDiploma, setSelectedDiploma] = useState(null); 
  const [msg, setMsg] = useState({ type: '', text: '' }); 
  const [formData, setFormData] = useState({ nom: '', prenom: '', dateObtention: '', diplomeFile: null, course_name: '' });

  const fetchMyDiplomas = async () => {
    const res = await fetch(`/api/my-diplomas/?user_id=${userId}`);
    const data = await res.json();
    setMyDiplomas(data);
  };

  useEffect(() => {
    if (activeTab === 'list') fetchMyDiplomas();
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!formData.diplomeFile) {
      setMsg({ type: 'error', text: "Veuillez joindre le fichier du diplôme." });
      return;
    }

    const data = new FormData();
    data.append('user_id', userId);
    data.append('first_name', formData.prenom);
    data.append('last_name', formData.nom);
    data.append('course_name', formData.course_name);
    data.append('graduation_date', formData.dateObtention);
    data.append('image', formData.diplomeFile);

    try {
      const res = await fetch('/api/certify/', { method: 'POST', body: data });
      if (res.ok) {
        setMsg({ type: 'success', text: "Demande créée ! En attente de validation (Voir emails)." }); // Message mis à jour
        setTimeout(() => setActiveTab('list'), 2000);
      } else {
        setMsg({ type: 'error', text: "Erreur lors de l'enregistrement." });
      }
    } catch (e) {
      setMsg({ type: 'error', text: "Erreur serveur." });
    }
  };
  
  // Fonction pour afficher une belle pastille de statut
  const getStatusBadge = (status) => {
    if (status === 'VALIDATED') return <span style={{padding: '4px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontSize: '0.8rem'}}>Validé ✅</span>;
    if (status === 'PENDING') return <span style={{padding: '4px 8px', borderRadius: '12px', background: '#ffedd5', color: '#9a3412', fontSize: '0.8rem'}}>En attente ⏳</span>;
    return status;
  };

  return (
    <div className="dashboard-container">
      <div style={{display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center'}}>
        <button className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => {setActiveTab('create'); setSelectedDiploma(null);}}>Nouveau Diplôme</button>
        <button className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('list')}>Mes émissions</button>
      </div>

      {msg.text && <div className={`msg-box msg-${msg.type}`}>{msg.text}</div>}

      {activeTab === 'create' ? (
        <div className="form-card">
          <h2>🎓 Émettre un Diplôme (Double Validation)</h2>
          <p style={{color: '#64748b', marginBottom: '20px'}}>
            Après création, un email sera envoyé à vous ET au rectorat pour valider le document.
          </p>
          <form onSubmit={handleSubmit}>
             <div className="input-group">
                <label className="input-label">Nom de l'étudiant</label>
                <input className="input-field" onChange={e => setFormData({...formData, nom: e.target.value})} required/>
             </div>
             <div className="input-group">
                <label className="input-label">Prénom</label>
                <input className="input-field" onChange={e => setFormData({...formData, prenom: e.target.value})} required/>
             </div>
             <div className="input-group">
                <label className="input-label">Cursus / Formation</label>
                <input className="input-field" onChange={e => setFormData({...formData, course_name: e.target.value})} required/>
             </div>
             <div className="input-group">
                <label className="input-label">Date d'obtention</label>
                <input className="input-field" type="date" onChange={e => setFormData({...formData, dateObtention: e.target.value})} required/>
             </div>
             <div className="input-group">
                <label className="input-label">Fichier (PDF ou Image)</label>
                <div className="file-upload-wrapper">
                  <input type="file" onChange={e => setFormData({...formData, diplomeFile: e.target.files[0]})} required/>
                </div>
             </div>
             <button className="btn btn-primary" type="submit">Lancer la procédure</button>
          </form>
        </div>
      ) : (
        <div className="form-card">
          {selectedDiploma ? (
             // ... Code de détail existant (inchangé, sauf si tu veux afficher le statut en grand) ...
            <div className="certificate-result animate-fade-in">
                <div className="certificate-header">DÉTAIL DU DIPLÔME</div>
                <div className="certificate-body">
                    <h2 style={{textAlign: 'center'}}>{selectedDiploma.first_name} {selectedDiploma.last_name}</h2>
                    <div style={{textAlign: 'center', margin: '15px 0'}}>
                        {getStatusBadge(selectedDiploma.status)}
                    </div>
                    {/* ... Le reste du détail (bouton télécharger etc) ... */}
                    <div style={{marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px'}}>
                         {/* BOUTON TÉLÉCHARGER */}
                         {selectedDiploma.image && (
                          <a href={selectedDiploma.image} target="_blank" rel="noopener noreferrer" className="btn-download" download>
                            📥 Télécharger le document
                          </a>
                        )}
                        <button className="btn btn-secondary" style={{width: 'auto'}} onClick={() => setSelectedDiploma(null)}>Retour à la liste</button>
                    </div>
                </div>
            </div>
          ) : (
            <>
                <h2>📜 Historique et Statuts</h2>
                {myDiplomas.length === 0 ? (
                    <p style={{color: '#94a3b8', textAlign: 'center', marginTop: '20px'}}>Aucun diplôme émis.</p>
                ) : (
                    <div style={{marginTop: '20px'}}>
                        {myDiplomas.map(d => (
                            <div key={d.id} 
                                onClick={() => setSelectedDiploma(d)}
                                style={{
                                    padding: '15px', 
                                    borderBottom: '1px solid #f1f5f9', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <strong>{d.last_name.toUpperCase()} {d.first_name}</strong>
                                    <div style={{fontSize: '0.85rem', color: '#64748b'}}>{d.course_name}</div>
                                </div>
                                {/* AJOUT DU BADGE DE STATUT ICI */}
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    {getStatusBadge(d.status)}
                                    <span style={{fontSize: '1.2rem', color: '#cbd5e1'}}>›</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default IssuerDashboard;