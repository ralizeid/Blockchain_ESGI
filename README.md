# CertiChain

> **La blockchain au service de la fiabilité des diplômes.**

CertiChain est une plateforme de certification de diplômes basée sur la blockchain. Les établissements émettent des diplômes dont le hash cryptographique est ancré on-chain. N'importe qui peut vérifier l'authenticité d'un diplôme via un lien ou un QR code, sans contacter l'école.

**Stack :** React 19 · Django 5 + DRF · Hardhat / Solidity · ethers.js 6 · MetaMask

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Lancement](#2-lancement)
3. [Configuration `.env`](#3-configuration-env)
4. [MetaMask](#4-metamask)
5. [Emails et OTP](#5-emails-et-otp)
6. [Déploiement Docker](#6-déploiement-docker)
7. [L'équipe](#7-léquipe)

---

## 1. Prérequis

| Outil | Version minimale |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| MetaMask | extension navigateur |

---

## 2. Lancement

```powershell
.\setup_Win.ps1
```

Au démarrage, le script demande si vous souhaitez **réinitialiser la base de données**.  
Répondre `o` / `oui` / `y` supprime `db.sqlite3` et toutes les migrations (sauf `__init__.py`) — utile pour repartir d'une base propre. Toute autre réponse conserve les données existantes.

Le script lance ensuite les trois services dans des fenêtres séparées et met à jour `.env` avec l'adresse du contrat déployé automatiquement.

---

## 3. Configuration `.env`

Fichier : `Certichain/certichain-back/.env`

```env
DEBUG=True
ALLOWED_HOSTS=*
FRONTEND_URL=http://localhost:3000

BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BLOCKCHAIN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Laisser vide = emails dans le terminal (dev)
# Remplir = vrai envoi SMTP Gmail (prod) — voir §5
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# PostgreSQL — uniquement Docker/prod (ignoré en local, SQLite utilisé par défaut)
# POSTGRES_HOST=db
# POSTGRES_DB=certichain_db
# POSTGRES_USER=admin
# POSTGRES_PASSWORD=
```

---

## 4. MetaMask

### Ajouter le réseau Hardhat local

MetaMask → sélecteur de réseau → **Ajouter un réseau manuellement** :

| Champ | Valeur |
|---|---|
| Nom | `Hardhat Local` |
| URL RPC | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Symbole | `ETH` |

### Comptes de test

MetaMask → icône compte → **Importer un compte** → coller la clé privée.

| Rôle | Adresse | Clé privée |
|---|---|---|
| École (Account #0) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Rectorat (Account #1) | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |

> ⚠️ Ces comptes sont publiquement connus — **jamais en production**.

### Problème "Nonce incorrect" après redémarrage Hardhat

MetaMask → Paramètres → Avancé → **Effacer les données d'activité et nonce** (pour chaque compte importé).

---

## 5. Emails et OTP

Chaque action critique (émettre un diplôme, révoquer, modifier le profil, changer le mot de passe, supprimer le compte…) envoie un **code OTP à 6 chiffres valable 10 minutes** sur l'email du compte.

**En développement** (pas de SMTP configuré) : le code s'affiche dans le terminal Django, cherchez :

```
Votre code de validation est : 483921
```

**En production** (Gmail SMTP) :

1. myaccount.google.com → Sécurité → activer la validation en deux étapes
2. Sécurité → **Mots de passe des applications** → Autre → `CertiChain` → Générer
3. Copiez le code de 16 caractères dans le `.env` :

```env
EMAIL_HOST_USER=votre@gmail.com
EMAIL_HOST_PASSWORD=abcdabcdabcdabcd
```

---

## 6. Déploiement Docker

```bash
# Créer le .env à la racine (voir §3, ajouter SECRET_KEY et POSTGRES_*)
docker compose up --build -d
docker compose exec backend python manage.py migrate
```

Pour la production, déployez le contrat sur Polygon et mettez à jour `BLOCKCHAIN_RPC_URL` et `BLOCKCHAIN_CONTRACT_ADDRESS`.

---

## 7. L'équipe

| Nom |
|---|
| Julien ATTARD |
| Mohammed KADDOURI |
| Ayman GAYES |
| Rayan ALIZEID |
| Aurélien LOGEAIS |
