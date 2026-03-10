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

## Configuration MetaMask

### Pourquoi MetaMask ?

CertiChain utilise un système de **double signature cryptographique** (école + rectorat). Chaque validateur signe le hash du diplôme avec son propre wallet MetaMask — la clé privée ne quitte jamais le navigateur. Le backend vérifie la signature via `ecrecover` et ancre les deux adresses publiques sur la blockchain.

> **Architecture gasless** : l'école et le rectorat signent gratuitement (hors-chaîne). C'est le compte CertiChain (défini dans `.env`) qui paie les frais de transaction blockchain.

---

### 1 — Ajouter le réseau Hardhat local

1. Ouvrez MetaMask → **Paramètres** → **Réseaux** → **Ajouter un réseau manuellement**
2. Renseignez :

| Champ | Valeur |
|---|---|
| Nom du réseau | `Hardhat Local` |
| URL RPC | `http://127.0.0.1:8545` |
| ID de chaîne | `31337` |
| Symbole | `ETH` |

---

### 2 — Importer les comptes de test Hardhat

Ces comptes sont affichés dans le terminal `npx hardhat node`. Ils ont 10 000 ETH fictifs et sont **publiquement connus** — ne les utilisez jamais en production.

**Importer dans MetaMask :** icône compte → **Ajouter un compte** → **Importer un compte** → coller la clé privée.

| Rôle | Adresse publique | Clé privée (test uniquement) |
|---|---|---|
| École (Account #0) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Rectorat (Account #1) | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |

> **Adresse publique vs clé privée** : l'adresse publique (`0x...` visible dans MetaMask sur l'écran principal) est sans risque à partager. La clé privée ne doit jamais être communiquée.

---

### 3 — Renseigner les adresses dans CertiChain

Lors de l'inscription ou depuis **Profil → Wallet & Profil** :

- **Adresse MetaMask de l'école** : l'adresse publique du wallet qui signera côté école
- **Adresse MetaMask du Rectorat** : l'adresse publique du wallet partenaire

Seul le wallet dont l'adresse est enregistrée pourra valider les diplômes. Toute tentative de signature avec un autre wallet sera rejetée (HTTP 403).

---

## Scénario de test (double signature)

1. Créer un compte établissement — renseigner les deux adresses publiques MetaMask.
2. Se connecter → **IssuerDashboard** → créer un diplôme.
3. **Validation École** :
   - Sélectionner Account #0 dans MetaMask
   - Ouvrir le lien école affiché dans le terminal Django
   - Cliquer **"🦊 Connecter et Signer"** → approuver dans MetaMask → **"Valider"**
4. **Validation Rectorat** :
   - Switcher sur Account #1 dans MetaMask
   - Ouvrir le lien rectorat → même opération
5. Le diplôme passe en **VALIDATED + ANCHORED** avec les deux adresses gravées on-chain.
6. Scanner le QR code ou ouvrir `/verify/<uuid>` → **✅ DIPLÔME AUTHENTIQUE** avec les deux adresses co-signataires.

---

## L'équipe

- Julien ATTARD
- Mohammed KADDOURI
- Ayman GAYES
- Rayan ALIZEID
- Aurélien LOGEAIS
