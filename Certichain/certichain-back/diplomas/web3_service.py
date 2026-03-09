from web3 import Web3
import json
import os
from django.conf import settings

def mint_diploma_on_blockchain(diploma_id, student_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"):
    try:
        rpc_url = os.environ.get('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545')
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not w3.is_connected():
            print("Erreur: Impossible de se connecter à la blockchain.")
            return None

        # Lecture des secrets depuis les variables d'environnement (jamais en dur)
        contract_address  = os.environ.get('BLOCKCHAIN_CONTRACT_ADDRESS')
        admin_private_key = os.environ.get('BLOCKCHAIN_PRIVATE_KEY')

        if not contract_address or not admin_private_key:
            print("Erreur: BLOCKCHAIN_CONTRACT_ADDRESS ou BLOCKCHAIN_PRIVATE_KEY manquant dans .env")
            return None

        admin_account = w3.eth.account.from_key(admin_private_key)

        abi_path = os.path.join(settings.BASE_DIR, 'diplomas', 'CertiChainSBT.json')
        with open(abi_path) as f:
            abi = json.load(f)['abi']

        contract = w3.eth.contract(address=contract_address, abi=abi)

        transaction = contract.functions.safeMint(student_address).build_transaction({
            'from': admin_account.address,
            'nonce': w3.eth.get_transaction_count(admin_account.address),
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price
        })

        signed_tx = w3.eth.account.sign_transaction(transaction, admin_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

        return w3.to_hex(tx_hash)
    except Exception as e:
        print(f"Erreur Web3 fatale: {e}")
        return None
