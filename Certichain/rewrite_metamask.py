import os
import re

path = 'certichain-front/src/pages/Login.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# I want to move:
#               <div className="input-group">
#                 <label className="input-label">Adresse MetaMask de l'école</label>
#                 <input className="input-field" type="text" name="school_eth_address" value={formData.school_eth_address} placeholder="0x..." onChange={handleChange} pattern="^0x[0-9a-fA-F]{40}$" title="Adresse Ethereum valide (0x suivi de 40 caractères hexadécimaux)" />
#                 <small style={{ color: '#64748b', fontSize: '0.8em', marginTop: '5px', display: 'block' }}>
#                   🔒 Seul ce wallet pourra signer les diplômes côté école.
#                 </small>
#               </div>
# From Step 3 to Step 1.

# Let's read the exact block from code
start_idx = code.find('<label className="input-label">Adresse MetaMask de l\\'école</label>')
if start_idx != -1:
    div_start = code.rfind('<div className="input-group">', 0, start_idx)
    div_end = code.find('</div>', start_idx) + 6
    metamask_block = code[div_start:div_end]
    
    code = code.replace(metamask_block, '')
    
    # insert in step 1, near the bottom of step 1 for `isRegister`, right before the password field or after school_name
    insert_marker = '''                  <div className="input-group">
                    <label className="input-label">Nom officiel de l'établissement <span style={{color:'#ef4444'}}>*</span></label>
                    <input className="input-field" type="text" name="school_name" value={formData.school_name} placeholder="ex: Lycée Jules Ferry" onChange={handleChange} required />
                  </div>'''
    
    # insert metamask_block right after the insert_marker
    new_insert = insert_marker + "\n" + metamask_block
    code = code.replace(insert_marker, new_insert)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("MetaMask address moved.")
else:
    print("Could not find MetaMask block.")
