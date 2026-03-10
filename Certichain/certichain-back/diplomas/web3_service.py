from web3 import Web3
import json
import os
import hashlib
from django.conf import settings


def _get_contract():
    """Initialise et retourne (w3, contract, admin_account) depuis les variables d'environnement."""
    rpc_url = os.environ.get('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545')
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        raise ConnectionError("Impossible de se connecter à la blockchain (RPC: %s)" % rpc_url)

    contract_address  = os.environ.get('BLOCKCHAIN_CONTRACT_ADDRESS')
    admin_private_key = os.environ.get('BLOCKCHAIN_PRIVATE_KEY')

    if not contract_address or not admin_private_key:
        raise EnvironmentError(
            "BLOCKCHAIN_CONTRACT_ADDRESS ou BLOCKCHAIN_PRIVATE_KEY manquant dans .env"
        )

    abi_path = os.path.join(settings.BASE_DIR, 'diplomas', 'CertiChainSBT.json')
    with open(abi_path) as f:
        abi = json.load(f)['abi']

    contract      = w3.eth.contract(address=contract_address, abi=abi)
    admin_account = w3.eth.account.from_key(admin_private_key)
    return w3, contract, admin_account, admin_private_key


def compute_diploma_hash(first_name: str, last_name: str, course_name: str, secret_uuid: str) -> str:
    """
    Calcule le hash SHA-256 pseudonymisé du diplôme (RGPD Art. 5.1.f – pseudonymisation).

    Format canonique : "prénom|nom|intitulé|uuid-secret"
    L'UUID (school_token généré aléatoirement) est un sel cryptographique :
    il empêche la réidentification par force brute même si l'attaquant
    connaît la liste de prénoms/noms courants.

    Retourne une chaîne hex préfixée 0x (32 octets = type bytes32 Solidity).
    """
    canonical = (
        first_name.strip().lower()  + "|" +
        last_name.strip().lower()   + "|" +
        course_name.strip().lower() + "|" +
        str(secret_uuid)
    )
    return '0x' + hashlib.sha256(canonical.encode('utf-8')).hexdigest()


def certify_diploma_on_blockchain(diploma_hash: str) -> str | None:
    """
    Ancre le hash d'un diplôme sur la blockchain via certify(bytes32).
    – Identité : adresse du portefeuille admin (0x…), jamais le nom de l'école.
    – Aucune donnée personnelle n'est transmise au contrat.
    Retourne le hash de transaction Ethereum ou None en cas d'erreur.
    """
    try:
        w3, contract, admin_account, admin_private_key = _get_contract()
        hash_bytes = bytes.fromhex(diploma_hash.removeprefix('0x'))

        tx = contract.functions.certify(hash_bytes).build_transaction({
            'from':     admin_account.address,
            'nonce':    w3.eth.get_transaction_count(admin_account.address),
            'gas':      200000,
            'gasPrice': w3.eth.gas_price,
        })
        signed = w3.eth.account.sign_transaction(tx, admin_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        return w3.to_hex(tx_hash)
    except Exception as e:
        print(f"Erreur certify_diploma_on_blockchain: {e}")
        return None


def revoke_diploma_on_blockchain(diploma_hash: str) -> str | None:
    """
    Révoque un diplôme sur la blockchain via revoke(bytes32).
    Le hash reste enregistré (preuve d'historique) mais le flag revoked passe à true.
    Retourne le hash de transaction Ethereum ou None en cas d'erreur.
    """
    try:
        w3, contract, admin_account, admin_private_key = _get_contract()
        hash_bytes = bytes.fromhex(diploma_hash.removeprefix('0x'))

        tx = contract.functions.revoke(hash_bytes).build_transaction({
            'from':     admin_account.address,
            'nonce':    w3.eth.get_transaction_count(admin_account.address),
            'gas':      100000,
            'gasPrice': w3.eth.gas_price,
        })
        signed = w3.eth.account.sign_transaction(tx, admin_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        return w3.to_hex(tx_hash)
    except Exception as e:
        print(f"Erreur revoke_diploma_on_blockchain: {e}")
        return None


def verify_diploma_on_blockchain(diploma_hash: str) -> dict | None:
    """
    Interroge le contrat (lecture seule) pour vérifier l'état d'un diplôme.
    Retourne un dict {certified, revoked, issuer, issued_at} ou None en cas d'erreur.
    """
    try:
        w3, contract, _, _ = _get_contract()
        hash_bytes = bytes.fromhex(diploma_hash.removeprefix('0x'))
        certified, revoked, issuer, issued_at = contract.functions.verify(hash_bytes).call()
        return {
            "certified":  certified,
            "revoked":    revoked,
            "issuer":     issuer,
            "issued_at":  issued_at,
        }
    except Exception as e:
        print(f"Erreur verify_diploma_on_blockchain: {e}")
        return None
