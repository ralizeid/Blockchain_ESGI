import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';

/**
 * Tableau de bord Rectorat
 * – Connexion via MetaMask (l'adresse eth est la clé d'identification)
 * – Liste des diplômes en attente de signature, groupés par école
 * – Validation 1 par 1 ou validation groupée (par école ou tout d'un coup)
 */
const RectoratDashboard = () => {
  const [ethAddress,    setEthAddress]    = useState('');
  const [connectStatus, setConnectStatus] = useState('idle'); // idle | connecting | connected | error
  const [connectError,  setConnectError]  = useState('');
  const [schools,       setSchools]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [globalMsg,     setGlobalMsg]     = useState({ type: '', text: '' });
  const [validating,    setValidating]    = useState(false);
  const [progress,      setProgress]      = useState({ done: 0, total: 0 });
  // diplômes sélectionnés (set de rectorate_token)
  const [selected,      setSelected]      = useState(new Set());

  // ─── MetaMask ──────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    setConnectStatus('connecting');
    setConnectError('');
    try {
      if (!window.ethereum) throw new Error("MetaMask n'est pas installé. Veuillez installer l'extension.");

      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setEthAddress(accounts[0]);
      setConnectStatus('connected');
    } catch (err) {
      setConnectStatus('error');
      if (err.code === 4001) {
        setConnectError('Connexion annulée par l\'utilisateur.');
      } else {
        setConnectError(err.message || 'Erreur de connexion MetaMask.');
      }
    }
  };

  // ─── Chargement ────────────────────────────────────────────────────────────
  const loadPending = useCallback(async () => {
    if (!ethAddress) return;
    setLoading(true);
    setGlobalMsg({ type: '', text: '' });
    try {
      const res  = await fetch(`/api/rectorate/pending/?eth_address=${ethAddress}`);
      const data = await res.json();
      if (res.ok) {
        setSchools(data.schools || []);
        setSelected(new Set());
      } else {
        setGlobalMsg({ type: 'error', text: data.error || 'Erreur lors du chargement.' });
      }
    } catch {
      setGlobalMsg({ type: 'error', text: 'Impossible de contacter le serveur.' });
    } finally {
      setLoading(false);
    }
  }, [ethAddress]);

  useEffect(() => { loadPending(); }, [loadPending]);

  // ─── Sélection ─────────────────────────────────────────────────────────────
  const allTokens = schools.flatMap(s => s.diplomas.map(d => d.rectorate_token));

  const toggleSelect = (token) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(token) ? next.delete(token) : next.add(token);
      return next;
    });

  const selectSchool = (schoolDiplomas, checked) =>
    setSelected(prev => {
      const next = new Set(prev);
      schoolDiplomas.forEach(d => checked ? next.add(d.rectorate_token) : next.delete(d.rectorate_token));
      return next;
    });

  const selectAll = (checked) =>
    setSelected(checked ? new Set(allTokens) : new Set());

  // ─── Signature ─────────────────────────────────────────────────────────────
  const signOne = async (diploma) => {
    const sig = await window.ethereum.request({
      method: 'personal_sign',
      params: [diploma.diploma_hash, ethAddress],
    });
    return { token: diploma.rectorate_token, eth_address: ethAddress, eth_signature: sig };
  };

  const handleValidate = async (diplomaList) => {
    if (diplomaList.length === 0) return;
    setValidating(true);
    setProgress({ done: 0, total: diplomaList.length });
    setGlobalMsg({ type: '', text: '' });

    const validations = [];
    for (const diploma of diplomaList) {
      try {
        const v = await signOne(diploma);
        validations.push(v);
        setProgress(p => ({ ...p, done: p.done + 1 }));
      } catch (err) {
        setGlobalMsg({ type: 'error', text: `Signature annulée ou erreur MetaMask : ${err.message}` });
        setValidating(false);
        return;
      }
    }

    try {
      const res  = await fetch('/api/rectorate/bulk-validate/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ validations }),
      });
      const data = await res.json();
      if (res.ok) {
        const txt = data.failures > 0
          ? `✅ ${data.successes} validé(s) — ⚠️ ${data.failures} erreur(s)`
          : `✅ ${data.successes} diplôme(s) validé(s) et ancré(s) on-chain !`;
        setGlobalMsg({ type: data.failures > 0 ? 'warning' : 'success', text: txt });
        await loadPending();
      } else {
        setGlobalMsg({ type: 'error', text: data.error || 'Erreur serveur.' });
      }
    } catch {
      setGlobalMsg({ type: 'error', text: 'Erreur de connexion au serveur.' });
    }
    setValidating(false);
  };

  const handleValidateSelected = () => {
    const list = schools
      .flatMap(s => s.diplomas)
      .filter(d => selected.has(d.rectorate_token));
    handleValidate(list);
  };

  const handleValidateSchool = (school) => handleValidate(school.diplomas);
  const handleValidateAll    = ()        => handleValidate(schools.flatMap(s => s.diplomas));

  // ─── Helpers UI ────────────────────────────────────────────────────────────
  const totalPending = schools.reduce((acc, s) => acc + s.diplomas.length, 0);
  const isSchoolFullySelected = (school) =>
    school.diplomas.every(d => selected.has(d.rectorate_token));

  // ─── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <h1 className="page-title">🏛️ Tableau de bord Rectorat</h1>
      <p className="page-subtitle">
        Validez les diplômes soumis par les établissements rattachés à votre rectorat.
      </p>

      {/* ── Connexion MetaMask ── */}
      {connectStatus !== 'connected' && (
        <div className="form-card" style={{ padding: '30px', textAlign: 'center' }}>
          <p style={{ marginBottom: '20px', fontSize: '1.05rem', color: 'var(--text-2)' }}>
            Connectez votre portefeuille MetaMask pour accéder aux diplômes en attente.
          </p>
          <button
            className="btn"
            style={{ background: '#f59e0b', color: 'white', border: 'none', width: 'auto' }}
            onClick={handleConnect}
            disabled={connectStatus === 'connecting'}
          >
            {connectStatus === 'connecting' ? '⏳ Connexion…' : '🦊 Connecter MetaMask'}
          </button>
          {connectStatus === 'error' && (
            <p style={{ color: '#dc2626', marginTop: '12px', fontSize: '0.9rem' }}>{connectError}</p>
          )}
        </div>
      )}

      {/* ── Dashboard connecté ── */}
      {connectStatus === 'connected' && (
        <>
          {/* Identité connectée */}
          <div className="wallet-bar">
            <div className="wallet-bar__id">
              🦊 Connecté : <code>{ethAddress}</code>
            </div>
            <div className="wallet-bar__btns">
              <button
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '4px 14px', fontSize: '0.85rem' }}
                onClick={loadPending}
                disabled={loading}
              >
                🔄 Actualiser
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '4px 14px', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fca5a5', background: '#fee2e2' }}
                onClick={() => {
                  setEthAddress('');
                  setConnectStatus('idle');
                  setSchools([]);
                  setSelected(new Set());
                }}
              >
                🚪 Se déconnecter
              </button>
            </div>
          </div>

          {/* Message global */}
          {globalMsg.text && (
            <div className={`msg-box msg-${globalMsg.type}`} style={{ marginBottom: '20px' }}>
              {globalMsg.text}
            </div>
          )}

          {/* Barre d'actions globales */}
          {totalPending > 0 && (
            <div className="action-bar">
              <label className="action-bar__check">
                <input
                  type="checkbox"
                  checked={selected.size === allTokens.length && allTokens.length > 0}
                  onChange={e => selectAll(e.target.checked)}
                />
                Tout sélectionner ({allTokens.length})
              </label>
              <div className="action-bar__btns">
                {selected.size > 0 && (
                  <button
                    className="btn"
                    style={{ background: '#0284c7', color: 'white', border: 'none', width: 'auto' }}
                    onClick={handleValidateSelected}
                    disabled={validating}
                  >
                    ✍️ Signer la sélection ({selected.size})
                  </button>
                )}
                <button
                  className="btn"
                  style={{ background: '#16a34a', color: 'white', border: 'none', width: 'auto' }}
                  onClick={handleValidateAll}
                  disabled={validating || totalPending === 0}
                >
                  ✅ Tout valider ({totalPending})
                </button>
              </div>
            </div>
          )}

          {/* Progression */}
          {validating && (
            <div className="progress-banner">
              <p className="progress-banner__title">
                ⏳ Signature en cours… ({progress.done}/{progress.total})
              </p>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="progress-banner__note">
                Confirmez chaque popup MetaMask pour votre portefeuille.
              </p>
            </div>
          )}

          {/* Liste vide */}
          {!loading && totalPending === 0 && (
            <div className="form-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
              <p style={{ fontSize: '1rem', margin: 0 }}>
                Aucun diplôme en attente de validation pour cette adresse.
              </p>
            </div>
          )}

          {loading && (
            <p style={{ textAlign: 'center', color: 'var(--text-4)' }}>⏳ Chargement…</p>
          )}

          {/* Groupes par école */}
          {schools.map(school => (
            <div key={school.school_id} className="school-card">
              {/* En-tête école */}
              <div className="school-card__header">
                <div className="school-card__name-group">
                  <input
                    type="checkbox"
                    checked={isSchoolFullySelected(school)}
                    onChange={e => selectSchool(school.diplomas, e.target.checked)}
                    title="Sélectionner toute l'école"
                  />
                  <span className="school-card__name">🏫 {school.school_name}</span>
                  <span className="school-count-badge">
                    {school.diplomas.length} diplôme{school.diplomas.length > 1 ? 's' : ''} en attente
                  </span>
                </div>
                <button
                  className="btn"
                  style={{ background: '#16a34a', color: 'white', border: 'none', width: 'auto', fontSize: '0.85rem' }}
                  onClick={() => handleValidateSchool(school)}
                  disabled={validating}
                >
                  ✅ Tout valider – {school.school_name}
                </button>
              </div>

              {/* Tableau des diplômes */}
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Étudiant</th>
                    <th>Formation</th>
                    <th>Date d'obtention</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {school.diplomas.map(diploma => (
                    <tr
                      key={diploma.rectorate_token}
                      className={selected.has(diploma.rectorate_token) ? 'row-selected' : ''}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selected.has(diploma.rectorate_token)}
                          onChange={() => toggleSelect(diploma.rectorate_token)}
                        />
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{diploma.last_name?.toUpperCase()} {diploma.first_name}</span>
                      </td>
                      <td>{diploma.course_name}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: '0.88rem' }}>{diploma.graduation_date}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn"
                          style={{
                            background: 'var(--primary)', color: 'white', border: 'none',
                            width: 'auto', padding: '5px 14px', fontSize: '0.82rem',
                          }}
                          onClick={() => handleValidate([diploma])}
                          disabled={validating}
                          title={`Signer le hash : ${diploma.diploma_hash}`}
                        >
                          ✍️ Signer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default RectoratDashboard;
