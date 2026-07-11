# Installation et test en local (reproductible)

L'application se lance en local via un **script de démarrage** qui orchestre les
trois services (nœud blockchain Hardhat, API Django, front React). Le lancement
se fait **nativement**, sans Docker — la conteneurisation (`docker-compose.yml`)
est réservée au déploiement en production.

## Prérequis

| Outil | Version |
|---|---|
| Git | — |
| Python | 3.11+ |
| Node.js | 18+ (20 recommandé) |
| MetaMask | extension navigateur |

> **Testé sous Windows et Linux.** macOS n'est pas pris en charge par le script
> de démarrage (`setup_Linux.sh` s'appuie sur `sed -i` GNU et des émulateurs de
> terminal Linux absents de macOS).

## Étapes

### 1. Cloner le dépôt

```bash
git clone https://github.com/ralizeid/Blockchain_ESGI
cd Blockchain_ESGI
```

### 2. Créer l'environnement Python

Le script s'attend à trouver un environnement virtuel **à la racine du dépôt** :

```bash
# Windows
python -m venv .venv

# Linux
python3 -m venv .venv
```

### 3. Configurer l'environnement

Le fichier `.env` n'est pas versionné (il figure dans `.gitignore`). Créez
`Certichain/certichain-back/.env` avec le contenu ci-dessous. Les valeurs par
défaut correspondent au nœud Hardhat local ; **`BLOCKCHAIN_CONTRACT_ADDRESS`
sera renseigné automatiquement** par le script à l'étape 4.

```env
DEBUG=True
ALLOWED_HOSTS=*
FRONTEND_URL=http://localhost:3000

BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BLOCKCHAIN_CONTRACT_ADDRESS=

# Laisser vide = OTP affichés dans le terminal (dev)
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

> La clé privée ci-dessus est un compte de test Hardhat **public** — à ne jamais
> utiliser en production.

### 4. Lancer la stack

```powershell
# Windows
.\outils\setup_Win.ps1
```

```bash
# Linux
bash outils/setup_Linux.sh
```

Le script propose d'abord de **réinitialiser la base de données** (répondre `N`
pour conserver les données existantes), puis automatiquement :

1. installe les dépendances (npm + pip) ;
2. démarre le **nœud Hardhat** dans une fenêtre dédiée ;
3. **déploie le smart contract** et écrit son adresse dans le `.env` du backend ;
4. copie l'ABI du contrat vers le backend ;
5. applique les migrations Django et lance l'**API** sur le port **8000** ;
6. lance le **front React** sur le port **3000**.

Chaque service tourne dans sa propre fenêtre de terminal.

### 5. Configurer MetaMask (une seule fois)

**Ajouter le réseau Hardhat local :**

| Champ | Valeur |
|---|---|
| Nom | `Hardhat Local` |
| URL RPC | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Symbole | `ETH` |

**Importer les deux comptes de test** (clés privées listées dans le
[README §4](./README.md)) :

| Rôle | Compte |
|---|---|
| École | Account #0 |
| Rectorat | Account #1 |

> Ces comptes sont publiquement connus — **jamais en production**.

### 6. Accéder à l'application

| Service | URL |
|---|---|
| Frontend | <http://localhost:3000/> |
| API / Admin | <http://localhost:8000/> |

### 7. Codes OTP (en développement)

Chaque action critique (émission, révocation, modification de profil…) génère un
**code OTP à 6 chiffres**. Sans SMTP configuré, aucun email réel n'est envoyé :
le code **s'affiche dans la fenêtre du terminal Django**.

## Notes utiles

- **Arrêter l'application :** fermer les trois fenêtres de terminal ouvertes par
  le script.
- **Erreur de *nonce* MetaMask** après un redémarrage du nœud Hardhat : vider les
  données d'activité du compte (MetaMask → Paramètres → Avancé → *Effacer les
  données d'activité et nonce*), pour chaque compte importé.
- Le détail illustré du parcours d'émission côté établissement est fourni en
  annexe 10.6.
