import re

with open("temp_dashboard.js", "r", encoding="utf8") as f:
    content = f.read()

# 1. Add states for presets
state_addition = """
  const [formData, setFormData] = useState({
"""
state_replacement = """  const [qrPresets, setQrPresets] = useState([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [formData, setFormData] = useState({
"""
content = content.replace(state_addition, state_replacement)

# 2. Add fetch logic and useEffect update
fetch_addition = """  const fetchQuota = useCallback(async () => {"""
fetch_replacement = """  const fetchQrPresets = useCallback(async () => {
    try {
      const res = await fetch(`/api/qr-presets/?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setQrPresets(data);
      }
    } catch(e) {
      console.error("Erreur récupération presets", e);
    }
  }, [userId]);

  const saveQrPreset = async () => {
    if (!newPresetName.trim()) return;
    try {
      const res = await fetch(`/api/qr-presets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: newPresetName.trim(),
          embed_qr: formData.embed_qr,
          qr_x_pct: Number(formData.qr_x_pct),
          qr_y_pct: Number(formData.qr_y_pct),
          qr_size_pct: Number(formData.qr_size_pct)
        })
      });
      if (res.ok) {
        setNewPresetName('');
        fetchQrPresets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteQrPreset = async (id) => {
    try {
      const res = await fetch(`/api/qr-presets/${id}/?user_id=${userId}`, { method: 'DELETE' });
      if (res.ok) fetchQrPresets();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQrPresets();
  }, [fetchQrPresets]);

  const fetchQuota = useCallback(async () => {"""
content = content.replace(fetch_addition, fetch_replacement)

# 3. Add the UI block for presets
ui_search = """                     {previewUrl ? ("""
ui_replacement = """                     <div style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                       <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '0.85rem' }}>Sauvegarder et réutiliser ces paramètres (Presets)</div>
                       <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                         <input
                           type="text"
                           placeholder="Nom du preset (ex: Modèle Licence)"
                           className="input-field"
                           style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }}
                           value={newPresetName}
                           onChange={e => setNewPresetName(e.target.value)}
                         />
                         <button type="button" onClick={saveQrPreset} className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}>
                           Enregistrer
                         </button>
                       </div>
                       {qrPresets.length > 0 && (
                         <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                           {qrPresets.map(preset => (
                             <div key={preset.id} style={{ display: 'flex', alignItems: 'center', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                               <button 
                                 type="button"
                                 title="Appliquer ce preset"
                                 onClick={() => setFormData(f => ({
                                   ...f,
                                   embed_qr: preset.embed_qr,
                                   qr_x_pct: preset.qr_x_pct,
                                   qr_y_pct: preset.qr_y_pct,
                                   qr_size_pct: preset.qr_size_pct
                                 }))}
                                 style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem' }}
                               >
                                 {preset.name}
                               </button>
                               <button
                                 type="button"
                                 title="Supprimer ce preset"
                                 onClick={() => deleteQrPreset(preset.id)}
                                 style={{ padding: '4px 8px', border: 'none', borderLeft: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer', color: '#ef4444' }}
                               >
                                 ×
                               </button>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>

                     {previewUrl ? ("""
content = content.replace(ui_search, ui_replacement)


with open("Certichain/certichain-front/src/pages/IssuerDashboard.js", "w", encoding="utf8") as f:
    f.write(content)
