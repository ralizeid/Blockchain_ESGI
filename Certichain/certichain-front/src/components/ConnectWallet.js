import React, { useState, useEffect } from 'react';
import { setupWeb3 } from '../services/web3Service';

const ConnectWallet = ({ setGlobalAccount }) => {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');

  // Vérifier si déjà connecté au chargement
  useEffect(() => {
    const checkConnection = async () => {
      const { ethereum } = window;
      if (ethereum) {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          handleAccountChange(accounts[0]);
        }
      }
    };
    checkConnection();
  }, []);

  const handleAccountChange = (newAccount) => {
    setAccount(newAccount);
    if (setGlobalAccount) setGlobalAccount(newAccount); // Remonte l'info à App.js
  };

  const connect = async () => {
    try {
      setError('');
      const { signer } = await setupWeb3();
      const address = await signer.getAddress();
      handleAccountChange(address);
    } catch (err) {
      setError("Erreur de connexion wallet");
      console.error(err);
    }
  };

  return (
    <div>
      {account ? (
        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-200">
          <span style={{fontWeight: 'bold'}}>🟢 Connecté :</span>
          {/* Affiche seulement le début et la fin de l'adresse */}
          <span style={{fontFamily: 'monospace'}}>
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      ) : (
        <button 
          onClick={connect}
          style={{
            backgroundColor: '#6366f1', 
            color: 'white', 
            padding: '10px 20px', 
            borderRadius: '8px', 
            border: 'none', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🦊 Connecter Wallet
        </button>
      )}
      {error && <p style={{color: 'red', fontSize: '12px'}}>{error}</p>}
    </div>
  );
};

export default ConnectWallet;