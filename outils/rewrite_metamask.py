from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
LOGIN_FILE = REPO_ROOT / 'Certichain' / 'certichain-front' / 'src' / 'pages' / 'Login.js'

code = LOGIN_FILE.read_text(encoding='utf-8')
start_idx = code.find('<label className="input-label">Adresse MetaMask de l\'école</label>')

if start_idx == -1:
    print('Could not find MetaMask block.')
    raise SystemExit(0)

div_start = code.rfind('<div className="input-group">', 0, start_idx)
div_end = code.find('</div>', start_idx) + 6
metamask_block = code[div_start:div_end]
code = code.replace(metamask_block, '')

insert_marker = '''                  <div className="input-group">
                    <label className="input-label">Nom officiel de l'établissement <span style={{color:'#ef4444'}}>*</span></label>
                    <input className="input-field" type="text" name="school_name" value={formData.school_name} placeholder="ex: Lycée Jules Ferry" onChange={handleChange} required />
                  </div>'''

code = code.replace(insert_marker, insert_marker + "\n" + metamask_block)
LOGIN_FILE.write_text(code, encoding='utf-8')
print('MetaMask address moved.')
