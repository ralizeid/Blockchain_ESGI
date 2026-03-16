import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../App.css';

const Validate = () => {
  const { token } = useParams();
  
  const [status, setStatus] = useState('loading'); 
  const [diplomaInfo, setDiplomaInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [ethAddress, setEthAddress]     = useState('');
  const [ethSignature, setEthSignature] = useState('');
  const [ethStatus, setEthStatus]       = useState('idle'); // 'idle'|'signing'|'signed'|'error'
  const [ethError, setEthError]         = useState('');

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

  const handleMetaMaskSign = async () => {
    setEthStatus('signing');
    setEthError('');
    try {
      if (!window.ethereum) throw new Error("MetaMask n'est pas installé. Veuillez installer l'extension MetaMask.");
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account  = accounts[0];
      const sig = await window.ethereum.request({
        method: 'personal_sign',
        params: [diplomaInfo.diploma_hash, account],
      });
      setEthAddress(account);
      setEthSignature(sig);
      setEthStatus('signed');
    } catch (err) {
      setEthStatus('error');
      setEthError(err.message || 'Erreur MetaMask.');
    }
  };

  const handleAction = async (actionType) => {
    setStatus('loading'); 
    try {
        const body = { action: actionType };
        if (actionType === 'validate') {
            body.eth_signature = ethSignature;
            body.eth_address   = ethAddress;
        }
        const response = await fetch(`/api/validate/${token}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
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
            
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', textAlign: 'left', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <p><strong>Étudiant :</strong> {diplomaInfo?.last_name?.toUpperCase()} {diplomaInfo?.first_name}</p>
                <p><strong>Formation :</strong> {diplomaInfo?.course_name}</p>
                <p><strong>Date d'obtention :</strong> {diplomaInfo?.graduation_date}</p>
                {diplomaInfo?.diploma_hash && (
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', wordBreak: 'break-all', fontFamily: 'monospace', margin: 0 }}>
                    <strong>Hash :</strong> {diplomaInfo.diploma_hash}
                  </p>
                )}
            </div>

            {/* Étape MetaMask */}
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 6px' }}>🦊 Signature MetaMask requise</p>
              <p style={{ color: '#92400e', fontSize: '0.88rem', margin: '0 0 12px' }}>
                Pour valider, vous devez signer ce diplôme avec votre portefeuille MetaMask.
                Votre adresse sera enregistrée on-chain comme co-signataire.
              </p>
              {ethStatus === 'signed' ? (
                <div style={{ color: '#166534', fontWeight: 'bold', wordBreak: 'break-all' }}>
                  ✅ Signé par <code style={{ fontSize: '0.78rem' }}>{ethAddress}</code>
                </div>
              ) : (
                <button
                  className="btn"
                  style={{ background: '#f59e0b', color: 'white', width: 'auto', border: 'none' }}
                  onClick={handleMetaMaskSign}
                  disabled={ethStatus === 'signing'}
                >
                  {ethStatus === 'signing' ? '⏳ En attente de MetaMask…' : '🦊 Connecter et Signer'}
                </button>
              )}
              {ethStatus === 'error' && <p style={{ color: '#dc2626', margin: '8px 0 0', fontSize: '0.85rem' }}>{ethError}</p>}
            </div>

            <p style={{ marginBottom: '20px', fontWeight: 'bold' }}>Confirmez-vous l'authenticité de ce diplôme ?</p>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button 
                    className="btn" 
                    style={{ background: ethStatus === 'signed' ? '#16a34a' : '#94a3b8', color: 'white', width: 'auto', cursor: ethStatus === 'signed' ? 'pointer' : 'not-allowed' }}
                    onClick={() => ethStatus === 'signed' && handleAction('validate')}
                    disabled={ethStatus !== 'signed'}
                    title={ethStatus !== 'signed' ? "Signez d'abord avec MetaMask" : undefined}
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