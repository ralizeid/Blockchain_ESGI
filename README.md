# CertiChain

> **La blockchain au service de la fiabilité des diplômes.**

CertiChain est une plateforme de certification de diplômes basée sur la blockchain. Les établissements émettent des diplômes dont l'empreinte cryptographique est ancrée sur une blockchain publique. Toute personne (recruteur, entreprise) peut vérifier l'authenticité d'un diplôme en quelques secondes, sans contacter l'école.

---

## Table des matières

1. [Architecture générale](#1-architecture-générale)
2. [Prérequis](#2-prérequis)
3. [Structure du projet](#3-structure-du-projet)
4. [Lancement en mode développement](#4-lancement-en-mode-développement)
   - [Étape 1 — Blockchain Hardhat](#étape-1--blockchain-hardhat)
   - [Étape 2 — Backend Django](#étape-2--backend-django)
   - [Étape 3 — Frontend React](#étape-3--frontend-react)
5. [Configuration du fichier `.env`](#5-configuration-du-fichier-env)
6. [Configuration MetaMask](#6-configuration-metamask)
7. [Configuration email (OTP + validation)](#7-configuration-email-otp--validation)
8. [Scénario de test complet](#8-scénario-de-test-complet)
9. [Référence des endpoints API](#9-référence-des-endpoints-api)
10. [Déploiement Docker (production)](#10-déploiement-docker-production)
11. [Fonctionnalités et sécurité](#11-fonctionnalités-et-sécurité)
12. [L'équipe](#12-léquipe)

---

## 1. Architecture générale

```
┌─────────────────────────────────────────────────────────────────┐
│                        Navigateur                               │
│           React 19  ·  ethers.js 6  ·  MetaMask                 │
│                   http://localhost:3000                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API (proxy → :8000)
┌────────────────────────────▼────────────────────────────────────┐
│                     Backend Django 5                            │
│        Django REST Framework  ·  SQLite (dev) / PostgreSQL      │
│                   http://localhost:8000                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ web3.py (RPC)
┌────────────────────────────▼────────────────────────────────────┐
│              Blockchain Hardhat (local) / Polygon (prod)        │
│          Smart contract CertiChainSBT.sol  ·  Solidity 0.8.20   │
│                   http://localhost:8545                          │
└─────────────────────────────────────────────────────────────────┘
```

**Flux d'émission d'un diplôme (simplifié) :**

1. L'école remplit le formulaire → code OTP envoyé par email pour confirmer
2. Le backend calcule `SHA-256(prénom|nom|cursus|UUID-secret)` et sauvegarde le diplôme
3. L'école et le rectorat reçoivent chacun un lien de validation par email
4. Chaque validateur clique le lien, connecte son wallet MetaMask et signe le hash hors-chaîne
5. Quand les **deux** signatures sont valides, le backend appelle `certify()` sur le smart contract
6. Le diplôme passe en statut **VALIDATED + ANCHORED** — un QR code de vérification est généré

---

## 2. Prérequis

| Outil | Version minimale | Vérification |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | toute version récente | `git --version` |
| MetaMask | extension navigateur | metamask.io |

> **Windows** : utilisez PowerShell ou Git Bash. Les commandes ci-dessous fonctionnent dans les deux.

---

## 3. Structure du projet

```
Blockchain_ESGI/
├── docker-compose.yml           ← Déploiement production (PostgreSQL + Django + Nginx)
├── .env                         ← Variables d'environnement (à créer, voir §5)
├── README.md
└── Certichain/
    ├── certichain-blockchain/   ← Smart contract Solidity + scripts Hardhat
    │   ├── contracts/
    │   │   └── CertiChainSBT.sol
    │   ├── scripts/
    │   │   └── deploy.js
    │   └── package.json
    ├── certichain-back/         ← API Django REST Framework
    │   ├── config/
    │   │   ├── settings.py
    │   │   └── urls.py
    │   ├── diplomas/
    │   │   ├── models.py        ← Diploma, UserProfile, ActionOTP, SubscriptionPlan
    │   │   ├── views.py         ← Toutes les vues API
    │   │   ├── urls.py          ← Routage API
    │   │   ├── serializers.py
    │   │   └── web3_service.py  ← Interface avec la blockchain
    │   ├── .env                 ← Config locale backend
    │   ├── requirements.txt
    │   └── manage.py
    └── certichain-front/        ← Application React
        ├── src/
        │   ├── pages/
        │   │   ├── IssuerDashboard.js   ← Portail école
        │   │   ├── SchoolProfile.js     ← Profil et paramètres
        │   │   ├── Login.js             ← Connexion / inscription
        │   │   ├── Validate.js          ← Signature MetaMask
        │   │   ├── VerifierPortal.js    ← Vérification publique
        │   │   └── Home.js
        │   └── components/
        │       ├── OTPModal.js          ← Modal validation par email
        │       ├── ConfirmModal.js
        │       └── Navbar.js
        └── package.json
```

---

## 4. Lancement en mode développement

Les trois composants doivent être démarrés **dans l'ordre** : Blockchain → Backend → Frontend.  
Chaque composant tourne dans son propre terminal.

### Script automatisé Windows (`setup_Win.ps1`)

Un script PowerShell à la racine du projet automatise les trois lancements d'un seul coup.

```powershell
.\setup_Win.ps1
```

Au démarrage, le script pose cette question :

```
Reinitialiser la base de donnees ? Cela supprimera les migrations et db.sqlite3 [o/N]
```

| Réponse | Effet |
|---|---|
| `o`, `oui`, `y`, `yes` | Supprime tous les fichiers de `diplomas/migrations/` **sauf `__init__.py`**, puis supprime `db.sqlite3`. Les migrations sont recréées et appliquées automatiquement au démarrage. |
| Toute autre réponse (vide, `n`…) | La base et les migrations sont conservées telles quelles. |

> Utile pour repartir d'une base propre après un changement de schéma ou pour réinitialiser les données de test.

---

### Lancement manuel (pas à pas)

Si vous préférez contrôler chaque service séparément, suivez les étapes ci-dessous.

---

### Étape 1 — Blockchain Hardhat

**Terminal A — Démarrer le nœud local :**

```bash
cd Certichain/certichain-blockchain
npm install
npx hardhat node --hostname 0.0.0.0
```

Ce terminal simule une blockchain Ethereum locale. **Il doit rester ouvert.**  
À son démarrage, il affiche 20 comptes de test avec leurs clés privées et 10 000 ETH fictifs chacun.

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...
```

> ⚠️ Ces comptes sont publiquement connus. Ne les utilisez **jamais** en production.

**Terminal B — Déployer le smart contract :**

```bash
cd Certichain/certichain-blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Sortie attendue :
```
CertiChain déployé avec succès !
Adresse du contrat : 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Copiez cette adresse** — vous en aurez besoin dans le `.env` du backend.

Copiez aussi le fichier ABI vers le backend :
```bash
cp artifacts/contracts/CertiChainSBT.sol/CertiChainSBT.json ../certichain-back/diplomas/
```

> **Note :** À chaque redémarrage du nœud Hardhat, le contrat est réinitialisé et doit être redéployé.

---

### Étape 2 — Backend Django

**Terminal C :**

```bash
cd Certichain/certichain-back

# Créer et activer l'environnement virtuel (à faire une seule fois)
python -m venv ../../.venv

# Activation — Windows PowerShell :
..\..\venv\Scripts\Activate.ps1
# macOS / Linux :
source ../../.venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Appliquer les migrations (crée db.sqlite3 + insère les plans d'abonnement automatiquement)
python manage.py migrate

# Lancer le serveur
python manage.py runserver 0.0.0.0:8000
```

Le serveur écoute sur `http://localhost:8000`.

> **Mode email en développement :** sans configuration SMTP, tous les emails (OTP, liens de validation) s'affichent directement dans ce terminal.

---

### Étape 3 — Frontend React

**Terminal D :**

```bash
cd Certichain/certichain-front
npm install
npm start
```

L'application s'ouvre automatiquement sur `http://localhost:3000`.  
Le fichier `package.json` contient `"proxy": "http://localhost:8000"` : tous les appels `/api/...` sont automatiquement redirigés vers le backend.

---

## 5. Configuration du fichier `.env`

Le backend lit ses variables depuis `Certichain/certichain-back/.env`.  
Créez ce fichier (ou modifiez l'existant) avec le contenu suivant :

```env
# ─── Général ─────────────────────────────────────────────────────
DEBUG=True
ALLOWED_HOSTS=*
FRONTEND_URL=http://localhost:3000

# Clé secrète Django (générez-en une unique en prod)
# python -c "import secrets; print(secrets.token_urlsafe(50))"
SECRET_KEY=django-insecure-changez-moi-en-production

# ─── Blockchain (nœud Hardhat local) ─────────────────────────────
# URL du nœud RPC — ne pas modifier en local
BLOCKCHAIN_RPC_URL=http://localhost:8545

# Clé privée du compte #0 Hardhat (paie les frais de gas)
# ⚠️ En production : utilisez un compte dédié avec peu de fonds
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Adresse du smart contract déployé (copiez-la depuis l'étape 1)
BLOCKCHAIN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# ─── Email (OTP + liens de validation) ───────────────────────────
# Laisser vide = mode console (emails dans le terminal, parfait pour le dev)
# Remplir = vrai SMTP Gmail (voir §7 pour la procédure)
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# ─── Base de données (PostgreSQL — uniquement pour Docker/prod) ───
# Ces variables ne sont lues que si POSTGRES_HOST est défini
# En local, elles sont ignorées (SQLite est utilisé automatiquement)
# POSTGRES_HOST=db
# POSTGRES_DB=certichain_db
# POSTGRES_USER=admin
# POSTGRES_PASSWORD=super_password_a_changer
```

### Récapitulatif des variables

| Variable | Obligatoire | Description |
|---|---|---|
| `DEBUG` | Oui | `True` en dev, `False` en prod |
| `ALLOWED_HOSTS` | Oui | `*` en dev, domaine réel en prod |
| `FRONTEND_URL` | Oui | URL du frontend (pour les liens dans les emails) |
| `SECRET_KEY` | Prod | Clé secrète Django — générer en prod |
| `BLOCKCHAIN_RPC_URL` | Oui | URL du nœud Ethereum RPC |
| `BLOCKCHAIN_PRIVATE_KEY` | Oui | Clé privée du compte qui paie le gas |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | Oui | Adresse du contrat déployé |
| `EMAIL_HOST_USER` | Non (dev) | Adresse Gmail pour l'envoi d'OTPs |
| `EMAIL_HOST_PASSWORD` | Non (dev) | Mot de passe d'application Gmail (16 chars) |
| `POSTGRES_HOST` | Docker uniquement | Active PostgreSQL à la place de SQLite |
| `POSTGRES_DB` | Docker uniquement | Nom de la base de données |
| `POSTGRES_USER` | Docker uniquement | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | Docker uniquement | Mot de passe PostgreSQL |

---

## 6. Configuration MetaMask

MetaMask est l'extension de wallet Ethereum utilisée pour signer les diplômes. Chaque validateur (école + rectorat) doit avoir MetaMask installé et configuré.

### Installer MetaMask

Téléchargez l'extension depuis metamask.io pour Chrome, Firefox ou Edge.  
Créez un wallet ou importez-en un existant. **Sauvegardez votre phrase de récupération.**

---

### Ajouter le réseau Hardhat local

En développement, vous travaillez sur une blockchain locale simulée par Hardhat.  
MetaMask doit être configuré pour s'y connecter.

1. Cliquez sur le sélecteur de réseau en haut à gauche de MetaMask
2. Cliquez **"Ajouter un réseau"** → **"Ajouter un réseau manuellement"**
3. Renseignez :

| Champ | Valeur |
|---|---|
| Nom du réseau | `Hardhat Local` |
| Nouvelle URL RPC | `http://127.0.0.1:8545` |
| ID de chaîne | `31337` |
| Symbole de la devise | `ETH` |
| URL de l'explorateur de blocs | *(laisser vide)* |

4. Cliquez **"Enregistrer"**, puis sélectionnez `Hardhat Local` comme réseau actif.

---

### Importer les comptes de test Hardhat

Ces comptes sont préchargés avec 10 000 ETH fictifs. Ils sont utilisés pour simuler l'école (Account #0) et le rectorat (Account #1).

**Pour importer un compte :**  
MetaMask → icône compte (rond en haut à droite) → **"Ajouter un compte ou du matériel"** → **"Importer un compte"** → coller la clé privée.

| Rôle | Adresse publique | Clé privée (test uniquement — jamais en prod !) |
|---|---|---|
| **École** (Account #0) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Rectorat** (Account #1) | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |

---

### Comprendre adresse publique vs clé privée

```
Clé privée  →  (algorithme ECDSA)  →  Adresse publique (0x...)
              (opération à sens unique)
```

- **Adresse publique (`0x...`)** : votre identifiant on-chain. Sans risque à partager.  
  Elle s'affiche en haut de la fenêtre principale MetaMask.
- **Clé privée** : permet de signer et d'autoriser des transactions. **Ne jamais la communiquer.**

Dans CertiChain, vous enregistrez uniquement l'**adresse publique** dans le profil.  
La clé privée ne quitte jamais votre navigateur : MetaMask vous demande juste d'approuver la signature.

---

### Comment MetaMask signe dans CertiChain

Le flux de signature est **gasless** (gratuit pour l'école et le rectorat) :

```
1. Backend génère : message = "Valider diploma <hash>"
2. Votre navigateur → MetaMask affiche le message → vous cliquez "Signer"
3. MetaMask produit une signature (65 octets) avec votre clé privée
4. Le frontend envoie la signature au backend
5. Le backend appelle ecrecover(hash, signature) → retrouve votre adresse publique
6. Le backend vérifie que cette adresse correspond à celle enregistrée dans le profil
7. Quand les deux signatures (école + rectorat) sont valides :
   → Le backend (Account #0 Hardhat) appelle certify() sur le smart contract
   → Il paie lui-même les frais de gas (quelques centimes fictifs en local)
```

---

### Problème fréquent : "Nonce incorrect" après redémarrage Hardhat

Quand vous redémarrez le nœud Hardhat, les compteurs de transactions sont remis à zéro, mais MetaMask garde en mémoire les anciens numéros.

**Solution :** MetaMask → Paramètres → Avancé → **"Effacer les données d'activité et nonce"** (pour chaque compte importé).

---

## 7. Configuration email (OTP + validation)

CertiChain envoie des emails pour :
- **Codes OTP** à 6 chiffres (valables 10 min) pour valider chaque action critique
- **Liens de validation** envoyés à l'école et au rectorat pour signer chaque diplôme
- **Lien RGPD** envoyé aux étudiants pour exercer leur droit à l'oubli

### Actions protégées par OTP

| Action | Description |
|---|---|
| `CREATE_DIPLOMA` | Émettre un nouveau diplôme |
| `REVOKE_DIPLOMA` | Révoquer un diplôme ancré sur la blockchain |
| `ERASE_DIPLOMA` | Effacement RGPD des données d'un diplôme |
| `UPDATE_PROFILE` | Modifier le profil ou les adresses MetaMask |
| `CHANGE_PASSWORD` | Changer le mot de passe du compte |
| `DELETE_ACCOUNT` | Supprimer définitivement son compte |

### Mode développement (par défaut)

Sans configuration SMTP, tous les emails s'affichent directement dans le terminal Django.  
Cherchez des blocs comme celui-ci dans la console du backend :

```
Content-Type: text/plain; charset="utf-8"
Subject: [CertiChain] Code de validation – Émettre un diplôme
To: votre@email.com

Votre code de validation est : 483921
Ce code est valable 10 minutes.
```

Copiez ce code dans la modale OTP du navigateur pour continuer.

### Mode production (Gmail SMTP)

Pour envoyer de vrais emails, créez un **mot de passe d'application** Gmail :

1. Allez sur myaccount.google.com → **Sécurité**
2. Activez la **validation en deux étapes** (obligatoire)
3. Revenez dans Sécurité → **Mots de passe des applications**
4. Choisissez **"Autre (nom personnalisé)"** → tapez `CertiChain` → **Générer**
5. Copiez le code de 16 caractères affiché (sans les espaces)

Puis dans `certichain-back/.env` :

```env
EMAIL_HOST_USER=votre.adresse@gmail.com
EMAIL_HOST_PASSWORD=abcdabcdabcdabcd
```

Redémarrez le backend. Les emails seront désormais envoyés réellement.

---

## 8. Scénario de test complet

### Prérequis

- Nœud Hardhat démarré (Terminal A)
- Contrat déployé et ABI copié (Terminal B)
- Backend lancé avec `.env` correctement configuré (Terminal C)
- Frontend lancé (Terminal D)
- MetaMask configuré : réseau Hardhat Local, Account #0 (école) et Account #1 (rectorat) importés

---

### 1. Créer un compte établissement

1. Ouvrez `http://localhost:3000`
2. Cliquez **"Créer un compte"**
3. Remplissez : nom d'utilisateur, email, mot de passe, email du rectorat
4. Cochez le consentement RGPD
5. Un code OTP est envoyé à votre email (ou visible dans le terminal Django) → saisissez-le
6. Compte créé ✅

---

### 2. Configurer les adresses MetaMask

1. Connectez-vous → **Profil** → onglet **"Wallet & Profil"**
2. Champ **"Adresse MetaMask de l'école"** → collez `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
3. Champ **"Adresse MetaMask du Rectorat"** → collez `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
4. Cliquez **"Enregistrer les modifications"** → entrez le code OTP reçu → valider ✅

---

### 3. Souscrire à un abonnement

1. Depuis le profil → onglet **"Abonnement"**
2. Choisissez un plan :

| Plan | Prix / an | Diplômes / an |
|---|---|---|
| Starter | 299 € | 50 |
| Standard | 699 € | 200 |
| Premium | 1 499 € | Illimité |

3. Confirmez → ✅

> Sans abonnement actif, l'émission de diplômes est bloquée.

---

### 4. Émettre un diplôme

1. Allez sur **IssuerDashboard** → **"Nouveau Diplôme"**
2. Remplissez : nom, prénom, cursus, date d'obtention, email de l'étudiant, fichier PDF
3. Cliquez **"Soumettre"**
4. Une modale OTP s'ouvre → cliquez **"Recevoir le code par email"**
5. Récupérez le code dans le terminal Django (ou votre boîte mail en prod) → saisissez-le → **"Valider"**
6. Le diplôme est créé en statut **PENDING** ✅
7. Deux emails de validation sont envoyés (liens visibles dans le terminal Django)

---

### 5. Validation côté école (signature MetaMask)

1. Dans le terminal Django, cherchez le lien `http://localhost:3000/validate/<token-école>`
2. Ouvrez ce lien dans le navigateur
3. Assurez-vous que MetaMask est sur le réseau **Hardhat Local** et sur le **Account #0** (école)
4. Cliquez **"Connecter et Signer"** → MetaMask demande la connexion → Approuvez
5. Une signature est demandée → cliquez **"Signer"** dans MetaMask
6. Cliquez **"Valider le diplôme"** → ✅ Validé côté école

---

### 6. Validation côté rectorat (signature MetaMask)

1. Dans le terminal Django, cherchez le lien `http://localhost:3000/validate/<token-rectorat>`
2. Ouvrez ce lien dans un autre onglet
3. Basculez MetaMask sur **Account #1** (rectorat)
4. Cliquez **"Connecter et Signer"** → MetaMask → Approuvez le changement de compte
5. Signez → **"Valider le diplôme"** → ✅

Le diplôme passe en **VALIDATED + ANCHORED** — le hash est inscrit sur la blockchain. Un QR code est généré.

---

### 7. Vérifier le diplôme (vue recruteur)

1. Dans le dashboard, copiez le lien de vérification du diplôme
2. Ouvrez `http://localhost:3000/verify/<uuid>` dans un onglet privé
3. Résultat attendu : **✅ DIPLÔME AUTHENTIQUE** avec les deux adresses co-signataires, le cursus, et le statut blockchain

---

## 9. Référence des endpoints API

Tous les endpoints sont préfixés par `/api/`. Le backend tourne sur `:8000`.

### Authentification

| Méthode | Chemin | Description |
|---|---|---|
| `POST` | `/api/register/` | Créer un compte établissement |
| `POST` | `/api/login/` | Connexion (retourne `user_id` + `username`) |

### Diplômes

| Méthode | Chemin | Description |
|---|---|---|
| `POST` | `/api/certify/` | Émettre un diplôme *(OTP requis)* |
| `GET` | `/api/my-diplomas/` | Liste des diplômes de l'école connectée |
| `GET` | `/api/search/` | Recherche publique de diplôme |
| `GET/POST` | `/api/validate/<token>/` | Page de signature MetaMask |
| `GET` | `/api/verify/<uuid>/` | Vérification publique par UUID |
| `POST` | `/api/revoke-diploma/` | Révoquer un diplôme ancré *(OTP requis)* |
| `GET` | `/api/verify-blockchain/` | Vérification directe on-chain par hash |

### Profil & Abonnement

| Méthode | Chemin | Description |
|---|---|---|
| `GET/PATCH` | `/api/update-profile/` | Lire / modifier le profil *(OTP requis pour PATCH)* |
| `GET` | `/api/quota/` | Quota d'émissions de l'année en cours |
| `GET` | `/api/plans/` | Liste des plans d'abonnement disponibles |
| `POST` | `/api/upgrade/` | Changer de plan |

### RGPD

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/api/export-data/` | Exporter ses données personnelles (JSON) |
| `POST` | `/api/delete-account/` | Supprimer son compte *(OTP requis)* |
| `POST` | `/api/student-erasure/` | Demande de droit à l'oubli étudiant |
| `POST` | `/api/student-erasure/confirm/` | Confirmer l'effacement avec l'OTP |
| `POST` | `/api/school-diploma-erasure/` | Effacement RGPD par l'école *(OTP requis)* |

### Rectorat

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/api/rectorate/pending/` | Diplômes en attente pour ce rectorat |
| `POST` | `/api/rectorate/bulk-validate/` | Validation en masse (dashboard rectorat) |

### OTP

| Méthode | Chemin | Corps de la requête | Description |
|---|---|---|---|
| `POST` | `/api/send-action-otp/` | `{"user_id": 1, "action_type": "CREATE_DIPLOMA"}` | Envoyer un code OTP |

**Valeurs d'`action_type` disponibles :** `CREATE_DIPLOMA`, `REVOKE_DIPLOMA`, `ERASE_DIPLOMA`, `UPDATE_PROFILE`, `CHANGE_PASSWORD`, `DELETE_ACCOUNT`

---

## 10. Déploiement Docker (production)

Le `docker-compose.yml` à la racine orchestre trois services :
- `db` : PostgreSQL 15
- `backend` : Django + Gunicorn
- `frontend` : React buildé servi par Nginx (port 80)

### Créer le `.env` de production (à la racine du projet)

```env
DEBUG=False
SECRET_KEY=<générez une clé unique avec : python -c "import secrets; print(secrets.token_urlsafe(50))">
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com
FRONTEND_URL=https://votre-domaine.com

BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
BLOCKCHAIN_PRIVATE_KEY=<clé privée compte prod>
BLOCKCHAIN_CONTRACT_ADDRESS=<adresse contrat prod>

EMAIL_HOST_USER=votre@gmail.com
EMAIL_HOST_PASSWORD=<mot de passe application 16 chars>

POSTGRES_HOST=db
POSTGRES_DB=certichain_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=<mot de passe fort>
```

### Lancer

```bash
# Depuis la racine du projet
docker compose up --build -d

# Appliquer les migrations (crée les tables + insère les plans d'abonnement automatiquement)
docker compose exec backend python manage.py migrate

# Voir les logs
docker compose logs -f backend
```

L'application est accessible sur le port 80.

### Déployer le contrat en production (Polygon)

1. Obtenez un wallet avec quelques MATIC (frais de déploiement)
2. Ajoutez la config réseau Polygon dans `certichain-blockchain/hardhat.config.js`
3. `npx hardhat run scripts/deploy.js --network polygon`
4. Mettez à jour `BLOCKCHAIN_CONTRACT_ADDRESS` et `BLOCKCHAIN_RPC_URL` dans le `.env` de prod

---

## 11. Fonctionnalités et sécurité

### Fonctionnalités principales

| Fonctionnalité | Description |
|---|---|
| Émission de diplôme | Formulaire complet : nom, prénom, cursus, date, fichier PDF, photo |
| Double signature | École + Rectorat signent chacun le hash avec MetaMask via `ecrecover` |
| Ancrage blockchain | Hash SHA-256 + adresses co-signataires inscrits sur le smart contract |
| QR code de vérification | Lien public `/verify/<uuid>` vérifiant la DB et la blockchain en parallèle |
| Codes OTP anti-usurpation | Validation email pour toute action critique (6 chiffres, 10 min, usage unique) |
| Révocation blockchain | Le flag `revoked` est mis à `true` sur le contrat (immuable, traçable) |
| Droit à l'oubli RGPD | Effacement des données personnelles, conservation de la preuve blockchain |
| Export de données | JSON de toutes les données personnelles (RGPD Art. 20) |
| Dashboard rectorat | Vue en masse des diplômes en attente, validation par lot |
| Plans d'abonnement | Starter (50/an), Standard (200/an), Premium (illimité) |
| Vérification publique | Portail recruteur sans compte requis, QR code ou UUID |

### Architecture de sécurité

**Privacy by Design (RGPD Art. 25) :**  
Aucune donnée personnelle n'est écrite sur la blockchain. Seul un hash SHA-256 pseudonymisé est ancré :

```
hash = SHA256(prénom | nom | cursus | UUID-secret)
```

L'UUID-secret est généré aléatoirement à chaque diplôme. Sans cet UUID, il est impossible de relier un hash blockchain à une personne réelle — même par force brute.

**Protection anti-usurpation (OTP) :**  
Chaque action critique déclenche l'envoi d'un code à 6 chiffres valable 10 minutes. L'OTP est invalidé après usage unique. Le modèle `ActionOTP` est séparé du modèle utilisateur pour éviter toute interférence.

**Vérification de signature MetaMask :**  
Le backend retrouve l'adresse publique via `ecrecover(hash, signature)` et la compare aux adresses enregistrées dans le profil. Toute signature d'un wallet non autorisé est rejetée (HTTP 403).

**Architecture gasless :**  
L'école et le rectorat signent hors-chaîne (gratuit, aucune transaction blockchain). Seul le compte backend effectue la transaction on-chain et paie les frais de gas.

---

## 12. L'équipe

| Prénom / Nom |
|---|
| Julien ATTARD |
| Mohammed KADDOURI |
| Ayman GAYES |
| Rayan ALIZEID |
| Aurélien LOGEAIS |
