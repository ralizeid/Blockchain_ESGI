from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
TARGET_FILE = REPO_ROOT / 'Certichain' / 'certichain-front' / 'src' / 'pages' / 'IssuerDashboard.js'

content = TARGET_FILE.read_text(encoding='utf-8')

if 'const [qrPresets, setQrPresets] = useState([]);' in content:
    print('Dashboard already updated.')
    raise SystemExit(0)

state_addition = """  const [formData, setFormData] = useState({
"""
state_replacement = """  const [qrPresets, setQrPresets] = useState([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [formData, setFormData] = useState({
"""
content = content.replace(state_addition, state_replacement)

fetch_addition = """  const fetchQuota = useCallback(async () => {"""
fetch_replacement = """  const fetchQrPresets = useCallback(async () => {
    try {
      const res = await fetch(`/api/qr-presets/?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setQrPresets(data);
      }
    } catch (error) {
      console.error('Erreur récupération presets', error);
    }
  }, [userId]);

  const saveQrPreset = async () => {
    if (!newPresetName.trim()) return;
    try {
      const res = await fetch('/api/qr-presets/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: newPresetName.trim(),
          embed_qr: formData.embed_qr,
          qr_x_pct: Number(formData.qr_x_pct),
          qr_y_pct: Number(formData.qr_y_pct),
          qr_size_pct: Number(formData.qr_size_pct),
        }),
      });
      if (res.ok) {
        setNewPresetName('');
        fetchQrPresets();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteQrPreset = async (id) => {
    try {
      const res = await fetch(`/api/qr-presets/${id}/?user_id=${userId}`, { method: 'DELETE' });
      if (res.ok) fetchQrPresets();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchQrPresets();
  }, [fetchQrPresets]);

  const fetchQuota = useCallback(async () => {"""
content = content.replace(fetch_addition, fetch_replacement)

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
                                   qr_size_pct: preset.qr_size_pct,
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

TARGET_FILE.write_text(content, encoding='utf-8')
