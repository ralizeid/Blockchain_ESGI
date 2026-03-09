# CertiChain

> **La blockchain au service de la fiabilité des diplômes.**

## Présentation

**CertiChain** est une solution conçue pour restaurer la confiance numérique dans les certifications académiques face à la croissance de la falsification de documents.

L'objectif est de fournir une "source unique de vérité" infalsifiable, permettant aux établissements d'enregistrer des diplômes et aux recruteurs d'en vérifier l'authenticité instantanément, en remplaçant des processus manuels longs et coûteux.

## Fonctionnalités clés (MVP)

- **Authenticité et intégrité** : Enregistrement de l'empreinte cryptographique (hash) des documents sur blockchain.
- **Interface émetteur** : Portail d'administration pour les écoles et universités pour certifier les documents.
- **Interface vérificateur** : Portail public permettant à un recruteur de vérifier la validité d'un diplôme en quelques secondes.
- **Soulbound Tokens (SBT)** : Tokens non-transférables garantissant que le diplôme reste attaché à son titulaire légitime.
- **Conformité RGPD** : Aucune donnée personnelle stockée en clair sur la blockchain (Privacy by Design). Droit d'accès, de portabilité et d'effacement disponibles depuis le profil.

## Stack technique

| Couche | Technologie |
|---|---|
| Blockchain | Hardhat (local) / Polygon PoS (prod), Solidity |
| Backend | Django 5 + Django REST Framework |
| Frontend | React 19, react-router-dom 7, ethers.js 6 |
| Base de données | SQLite (dev) |

---

## Lancement du projet

Les trois composants doivent être démarrés dans l'ordre : **Blockchain → Backend → Frontend**.

### Étape 1 — Blockchain (Hardhat)

Ouvrez **deux terminaux** dans `certichain-blockchain/`.

**Terminal 1 — Démarrer le nœud local :**
```bash
cd certichain-blockchain
npm install
npx hardhat node --hostname 0.0.0.0
```
> Ce terminal simule la blockchain et doit rester ouvert. Le compte #0 affiché sera utilisé par le backend pour payer les frais de gaz.

**Terminal 2 — Déployer le smart contract :**
```bash
cd certichain-blockchain
npx hardhat run scripts/deploy.js --network localhost
```
> ⚠️ Notez l'adresse du contrat affichée (ex : `0x5FbDB2315678afecb367f032d93F642f64180aa3`).

---

### Étape 2 — Backend (Django)

**1. Installer les dépendances Python :**
```bash
cd certichain-back
python3 -m venv venv
source venv/bin/activate   # Windows : venv\Scripts\activate
pip install -r requirements.txt web3
```

**2. Configurer le lien Web3 :**

- Copier l'ABI du contrat généré par Hardhat vers le backend :
  ```bash
  cp ../certichain-blockchain/artifacts/contracts/CertiChainSBT.sol/CertiChainSBT.json diplomas/
  ```
- Dans `diplomas/web3_service.py`, vérifier que `CONTRACT_ADDRESS` correspond bien à l'adresse obtenue à l'étape 1.

**3. Initialiser la base de données et démarrer le serveur :**
```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
> Les liens de validation de diplômes s'affichent directement dans ce terminal (simulation d'envoi d'email).

---

### Étape 3 — Frontend (React)

```bash
cd certichain-front
npm install
npm start
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000). Les appels API sont automatiquement proxifiés vers `http://localhost:8000`.

---

## Configuration MetaMask (pour la démo)

Pour visualiser les transactions en temps réel :

1. **Ajouter le réseau Hardhat local dans MetaMask :**
   - Nom du réseau : `Hardhat Local`
   - URL RPC : `http://127.0.0.1:8545`
   - ID de chaîne : `31337`
   - Symbole : `ETH`

2. **Importer le compte administrateur (compte #0 de Hardhat) :**
   - Clé privée : `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Solde initial : 10 000 ETH (environnement de test uniquement)

---

## Scénario de test

1. Créer un compte établissement depuis la page de connexion (choisir un plan d'abonnement).
2. Se connecter et accéder au tableau de bord émetteur.
3. Créer un nouveau diplôme — deux emails de validation sont générés (école + rectorat).
4. Valider via les deux liens affichés dans le terminal Django.
5. Vérifier que le statut passe à **VALIDATED** avec le hash de transaction blockchain.
6. Tester la vérification publique depuis le portail vérificateur.

---

## L'équipe

- Julien ATTARD
- Mohammed KADDOURI
- Ayman GAYES
- Rayan ALIZEID
- Aurélien LOGEAIS
