import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../App.css';

const Validate = () => {
  const { token } = useParams();
  
  const [status, setStatus] = useState('loading'); 
  const [diplomaInfo, setDiplomaInfo] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchDiplomaInfo = async () => {
      try {
        const response = await fetch(`/api/validate/${token}/`);
        const data = await response.json();

        if (response.ok) {
            if (data.status === 'VALIDATED' || data.status === 'REJECTED') {
                setStatus('success');
                setMessage(`Ce document a déjà été traité. Statut global : ${data.status === 'VALIDATED' ? '✅ Validé' : '❌ Refusé'}`);
            } 
            // NOUVEAU : Si la personne a déjà validé de son côté, mais que l'autre n'a pas encore validé
            else if (data.already_validated) {
                setStatus('success');
                setMessage(`Vous avez déjà validé ce diplôme en tant que ${data.validation_type}. Nous sommes en attente de l'autre partie pour finaliser le processus.`);
            } 
            else {
                setDiplomaInfo(data);
                setStatus('pending_action');
            }
        } else {
          setStatus('error');
          setMessage(data.error || "Lien invalide.");
        }
      } catch (err) {
        setStatus('error');
        setMessage("Impossible de contacter le serveur.");
      }
    };

    fetchDiplomaInfo();
  }, [token]);

  const handleAction = async (actionType) => {
    setStatus('loading'); 
    try {
        const response = await fetch(`/api/validate/${token}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: actionType })
        });
        const data = await response.json();
        
        if (response.ok) {
            setStatus('success');
            if (actionType === 'validate' && data.statut_global === 'PENDING') {
                setMessage(data.message + " (En attente de la validation de l'autre partie).");
            } else {
                setMessage(data.message);
            }
        } else {
            setStatus('error');
            setMessage(data.error || "Une erreur est survenue.");
        }
    } catch (err) {
        setStatus('error');
        setMessage("Erreur de connexion lors de l'envoi.");
    }
  };

  return (
    <div className="hero-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="form-card animate-fade-in" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '40px 20px' }}>
        
        {status === 'loading' && (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
            <h2>Chargement en cours...</h2>
          </div>
        )}

        {status === 'pending_action' && diplomaInfo && (
          <div>
            <h2 style={{ marginBottom: '5px' }}>Demande de Validation</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>
              En tant que <b>{diplomaInfo?.validation_type}</b>, vous devez vérifier les informations suivantes :
            </p>
            
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', textAlign: 'left', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
                <p><strong>Étudiant :</strong> {diplomaInfo?.last_name?.toUpperCase()} {diplomaInfo?.first_name}</p>
                <p><strong>Formation :</strong> {diplomaInfo?.course_name}</p>
                <p><strong>Date d'obtention :</strong> {diplomaInfo?.graduation_date}</p>
            </div>

            <p style={{ marginBottom: '20px', fontWeight: 'bold' }}>Confirmez-vous l'authenticité de ce diplôme ?</p>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button 
                    className="btn" 
                    style={{ background: '#16a34a', color: 'white', width: 'auto' }}
                    onClick={() => handleAction('validate')}
                >
                    ✅ Valider le diplôme
                </button>
                <button 
                    className="btn" 
                    style={{ background: '#dc2626', color: 'white', width: 'auto' }}
                    onClick={() => handleAction('reject')}
                >
                    ❌ Refuser
                </button>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '20px', color: '#166534' }}>📥</div>
            <h2 style={{ color: '#15803d' }}>Action enregistrée</h2>
            <p style={{ color: '#334155', fontSize: '1.1rem', margin: '20px 0' }}>{message}</p>
            <Link to="/">
              <button className="btn btn-secondary" style={{ width: 'auto' }}>Retour à l'accueil</button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '20px', color: '#991b1b' }}>❌</div>
            <h2 style={{ color: '#b91c1c' }}>Erreur</h2>
            <p style={{ color: '#334155', fontSize: '1.1rem', margin: '20px 0' }}>{message}</p>
            <Link to="/">
              <button className="btn btn-secondary" style={{ width: 'auto' }}>Retour à l'accueil</button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default Validate;