

### 🛠️ Étape 1 : La Blockchain (Terminal 1 & 2)

**1. Installation des dépendances :**
```bash
cd certichain-blockchain
npm install
```

**2. Lancement du réseau local Hardhat (Terminal 1) :**
Ce terminal simule la blockchain et doit rester ouvert. L'option `0.0.0.0` permet d'y accéder depuis l'extérieur (ex: depuis Windows vers une VM Linux).
```bash
npx hardhat node --hostname 0.0.0.0
```
*Note : Le compte #0 affiché ici sera utilisé par le Backend pour payer les frais de gaz.*

**3. Déploiement du Smart Contract (Terminal 2) :**
Ouvrez un nouveau terminal, placez-vous dans `certichain-blockchain` et lancez :
```bash
npx hardhat run scripts/deploy.js --network localhost
```
⚠️ **IMPORTANT :** Copiez l'adresse du contrat qui s'affiche (ex: `0x5FbDB2315678afecb367f032d93F642f64180aa3`).

---

### 🧠 Étape 2 : Le Backend Django (Terminal 2)

**1. Préparation de l'environnement Python :**
```bash
cd certichain-back
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt web3
```

**2. ⚠️ CONFIGURATION DU LIEN WEB3 :**

* **L'ABI du contrat :** Copiez le fichier `CertiChainSBT.json` généré par Hardhat vers le backend pour que Python puisse lire les fonctions du contrat.
  ```bash
  cp ../certichain-blockchain/artifacts/contracts/CertiChainSBT.sol/CertiChainSBT.json diplomas/
  ```
* **L'adresse du Contrat :** Ouvrez le fichier `diplomas/web3_service.py` et vérifiez que la variable `CONTRACT_ADDRESS` correspond bien à l'adresse obtenue lors du déploiement à l'étape 1.

**3. Base de données et lancement du serveur :**
```bash
python manage.py makemigrations diplomas
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
*(Le serveur Django simulera l'envoi d'emails en affichant les liens de validation de diplômes directement dans ce terminal).*

---



## 🦊 Configuration de MetaMask (Pour la Démo)

Pour voir les transactions s'exécuter en temps réel et vérifier les paiements des frais de gaz :

1. **Ajouter le réseau local Hardhat :**
   - Nom du réseau : `Hardhat Local`
   - Nouvelle URL de RPC : `http://<VOTRE_IP_SERVEUR>:8545` (ou `http://127.0.0.1:8545`)
   - ID de chaîne : `31337`
   - Symbole de la devise : `ETH`
2. **Importer le compte Administrateur (Custodial) :**
   - Dans MetaMask, allez dans "Importer un compte".
   - Collez la clé privée du Compte #0 de Hardhat :
     `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Vous verrez apparaître un solde de 10 000 ETH ! 💰



## 🎬 Scénario de Test (Le Flux de Validation)

1. Connectez-vous sur le Frontend et créez un **Nouveau Diplôme**.

   - Le serveur Django intercepte la double validation et génère la transaction.
   - Le Terminal Hardhat affiche le minage d'un nouveau bloc.
   - Votre solde sur MetaMask diminue (les frais de gaz ont été payés automatiquement).
   - Le statut du diplôme passe à "VALIDATED" avec la preuve de transaction (Hash).
