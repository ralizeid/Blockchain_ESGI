from web3 import Web3
import json
import os
from django.conf import settings

def mint_diploma_on_blockchain(diploma_id, student_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"):
    try:
        w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
        if not w3.is_connected():
            print("Erreur: Impossible de se connecter à la blockchain.")
            return None

        # Ton adresse de contrat toute neuve !
        CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
        # La clé privée du compte #0 de Hardhat (qui va payer les frais)
        ADMIN_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        admin_account = w3.eth.account.from_key(ADMIN_PRIVATE_KEY)

        abi_path = os.path.join(settings.BASE_DIR, 'diplomas', 'CertiChainSBT.json')
        with open(abi_path) as f:
            abi = json.load(f)['abi']

        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)
        
        transaction = contract.functions.safeMint(student_address).build_transaction({
            'from': admin_account.address,
            'nonce': w3.eth.get_transaction_count(admin_account.address),
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price
        })

        signed_tx = w3.eth.account.sign_transaction(transaction, ADMIN_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        return w3.to_hex(tx_hash)
    except Exception as e:
        print(f"Erreur Web3 fatale: {e}")
        return None
