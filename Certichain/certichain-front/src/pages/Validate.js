import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../App.css';

const Validate = () => {
  const { token } = useParams(); // Récupère le token dans l'URL (ex: /validate/1234-5678)
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/validate/${token}/`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || "Une erreur est survenue.");
        }
      } catch (err) {
        setStatus('error');
        setMessage("Impossible de contacter le serveur de validation.");
      }
    };

    validateToken();
  }, [token]);

  return (
    <div className="hero-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="form-card animate-fade-in" style={{ maxWidth: '500px', textAlign: 'center', padding: '40px 20px' }}>
        
        {status === 'loading' && (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
            <h2>Validation en cours...</h2>
            <p style={{ color: '#64748b' }}>Veuillez patienter pendant que nous vérifions la signature numérique.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '20px', color: '#166534' }}>✅</div>
            <h2 style={{ color: '#15803d' }}>Opération réussie</h2>
            <p style={{ color: '#334155', fontSize: '1.1rem', margin: '20px 0' }}>{message}</p>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '30px' }}>
              Le diplôme sera définitivement certifié et public une fois que les deux parties (École et Rectorat) auront validé.
            </p>
            <Link to="/">
              <button className="btn btn-primary" style={{ width: 'auto' }}>Retour à l'accueil</button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '20px', color: '#991b1b' }}>❌</div>
            <h2 style={{ color: '#b91c1c' }}>Échec de la validation</h2>
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