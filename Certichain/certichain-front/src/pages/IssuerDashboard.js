import React, { useState, useEffect } from 'react';
import '../App.css';

const IssuerDashboard = () => {
  const userId = localStorage.getItem('user_id');
  const [activeTab, setActiveTab] = useState('create'); 
  const [myDiplomas, setMyDiplomas] = useState([]);
  const [selectedDiploma, setSelectedDiploma] = useState(null); 
  const [msg, setMsg] = useState({ type: '', text: '' }); 
  const [formData, setFormData] = useState({ nom: '', prenom: '', dateObtention: '', diplomeFile: null, course_name: '' });
  
  const [quota, setQuota] = useState({ used: 0, limit: 3, remaining: 3 });

  const fetchQuota = async () => {
    try {
      const res = await fetch(`/api/quota/?user_id=${userId}`);
      const data = await res.json();
      if (res.ok) setQuota(data);
    } catch (e) {
      console.error("Erreur récupération quota");
    }
  };

  useEffect(() => {
    if (activeTab === 'list') { 
      const fetchMyDiplomas = async () => {
        const res = await fetch(`/api/my-diplomas/?user_id=${userId}`);
        const data = await res.json();
        setMyDiplomas(data);
        };
      fetchMyDiplomas();
    }
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
      const responseData = await res.json();

      if (res.ok) {
        setMsg({ type: 'success', text: "Demande créée ! En attente de validation (Voir emails)." });
        fetchQuota(); 
        setTimeout(() => setActiveTab('list'), 2000);
      } else {
        setMsg({ type: 'error', text: responseData.error || "Erreur lors de l'enregistrement." });
      }
    } catch (e) {
      setMsg({ type: 'error', text: "Erreur serveur." });
    }
  };
  
  const getStatusBadge = (status) => {
    if (status === 'VALIDATED') return <span style={{padding: '4px 8px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontSize: '0.8rem'}}>Validé ✅</span>;
    if (status === 'PENDING') return <span style={{padding: '4px 8px', borderRadius: '12px', background: '#ffedd5', color: '#9a3412', fontSize: '0.8rem'}}>En attente ⏳</span>;
    if (status === 'REJECTED') return <span style={{padding: '4px 8px', borderRadius: '12px', background: '#fee2e2', color: '#991b1b', fontSize: '0.8rem'}}>Refusé ❌</span>;
    return status;
  };

  const progressPercentage = Math.min((quota.used / quota.limit) * 100, 100);
  const isLimitReached = quota.used >= quota.limit;

  return (
    <div className="dashboard-container">
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', border: isLimitReached ? '2px solid #ef4444' : '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Plan actuel : <strong>Standard (Test)</strong></h3>
            <span style={{ fontWeight: 'bold', color: isLimitReached ? '#ef4444' : '#1e293b' }}>
                {quota.used} / {quota.limit} Certifications
            </span>
        </div>
        <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
            <div style={{ 
                width: `${progressPercentage}%`, 
                background: isLimitReached ? '#ef4444' : '#3b82f6', 
                height: '100%',
                transition: 'width 0.5s ease'
            }}></div>
        </div>
        {isLimitReached ? (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '10px', margin: 0 }}>⚠️ Limite atteinte. Veuillez upgrader votre abonnement ou refuser une certification en cours.</p>
        ) : (
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px', margin: 0 }}>Il vous reste {quota.remaining} certification(s) pour cette année.</p>
        )}
      </div>

      <div style={{display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center'}}>
        <button className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => {setActiveTab('create'); setSelectedDiploma(null);}}>Nouveau Diplôme</button>
        <button className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('list')}>Mes émissions</button>
      </div>

      {msg.text && <div className={`msg-box msg-${msg.type}`}>{msg.text}</div>}

      {activeTab === 'create' ? (
        <div className="form-card">
          <h2>🎓 Émettre un Diplôme</h2>
          <form onSubmit={handleSubmit}>
             <div className="input-group">
                <label className="input-label">Nom de l'étudiant</label>
                <input className="input-field" onChange={e => setFormData({...formData, nom: e.target.value})} required disabled={isLimitReached}/>
             </div>
             <div className="input-group">
                <label className="input-label">Prénom</label>
                <input className="input-field" onChange={e => setFormData({...formData, prenom: e.target.value})} required disabled={isLimitReached}/>
             </div>
             <div className="input-group">
                <label className="input-label">Cursus / Formation</label>
                <input className="input-field" onChange={e => setFormData({...formData, course_name: e.target.value})} required disabled={isLimitReached}/>
             </div>
             <div className="input-group">
                <label className="input-label">Date d'obtention</label>
                <input className="input-field" type="date" onChange={e => setFormData({...formData, dateObtention: e.target.value})} required disabled={isLimitReached}/>
             </div>
             <div className="input-group">
                <label className="input-label">Fichier (PDF ou Image)</label>
                <div className="file-upload-wrapper">
                  <input type="file" onChange={e => setFormData({...formData, diplomeFile: e.target.files[0]})} required disabled={isLimitReached}/>
                </div>
             </div>
             <button 
                className="btn btn-primary" 
                type="submit" 
                disabled={isLimitReached}
                style={{ opacity: isLimitReached ? 0.5 : 1, cursor: isLimitReached ? 'not-allowed' : 'pointer' }}
             >
                {isLimitReached ? "Limite atteinte" : "Lancer la procédure"}
             </button>
          </form>
        </div>
      ) : (
        <div className="form-card">
          {selectedDiploma ? (
            <div className="certificate-result animate-fade-in">
                <div className="certificate-header">DÉTAIL DU DIPLÔME</div>
                <div className="certificate-body">
                    <h2 style={{textAlign: 'center'}}>{selectedDiploma.first_name} {selectedDiploma.last_name}</h2>
                    <div style={{textAlign: 'center', margin: '15px 0'}}>
                        {getStatusBadge(selectedDiploma.status)}
                    </div>
                    
                    <div className="certificate-row">
                      <span className="certificate-label">Formation :</span> 
                      <b>{selectedDiploma.course_name}</b>
                    </div>
                    <div className="certificate-row">
                      <span className="certificate-label">Date :</span> 
                      <b>{selectedDiploma.graduation_date}</b>
                    </div>

                    {/* --- NOUVEAU BLOC : SUIVI DES VALIDATIONS --- */}
                    <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center', color: '#334155' }}>Suivi des validations</h4>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #cbd5e1' }}>
                            <span style={{ color: '#64748b' }}>École (Vous) :</span>
                            <strong>{selectedDiploma.school_validated ? '✅ Validé' : '⏳ En attente'}</strong>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Rectorat :</span>
                            <strong>{selectedDiploma.rectorate_validated ? '✅ Validé' : '⏳ En attente'}</strong>
                        </div>
                        
                        {selectedDiploma.status === 'REJECTED' && (
                            <div style={{ marginTop: '15px', color: '#dc2626', textAlign: 'center', fontWeight: 'bold' }}>
                                Ce diplôme a été refusé.
                            </div>
                        )}
                    </div>

                    <div style={{marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px'}}>
                         {selectedDiploma.image && (
                          <a href={selectedDiploma.image} target="_blank" rel="noopener noreferrer" className="btn-download" download>
                            📥 Document Original
                          </a>
                        )}
                        <button className="btn btn-secondary" style={{width: 'auto'}} onClick={() => setSelectedDiploma(null)}>Retour</button>
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
                                    <strong style={{ textDecoration: d.status === 'REJECTED' ? 'line-through' : 'none' }}>
                                        {d.last_name.toUpperCase()} {d.first_name}
                                    </strong>
                                    <div style={{fontSize: '0.85rem', color: '#64748b'}}>{d.course_name}</div>
                                </div>
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