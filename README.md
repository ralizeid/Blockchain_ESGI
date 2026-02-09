# CertiChain - Frontend 🎓

**La blockchain au service de la fiabilité des diplômes.**

Ce dépôt contient le code source de l'interface utilisateur (Frontend) du projet CertiChain. Il permet aux établissements d'émettre des certificats et aux recruteurs de vérifier leur authenticité via la blockchain Polygon.

## 🚀 Fonctionnalités (MVP)

* **Espace Établissement (Admin) :** Connexion sécurisée et formulaire d'émission de diplômes (hachage IPFS + Minting SBT).
* **Espace Vérificateur (Public) :** Recherche instantanée de diplôme par ID ou scan QR Code.
* **Wallet :** Intégration de MetaMask pour la signature des transactions.

## 🛠 Stack Technique

* [cite_start]**Framework :** React.js [cite: 255]
* **Blockchain Interaction :** Ethers.js
* [cite_start]**Réseau Cible :** Polygon Testnet (Amoy) [cite: 35]
* **Design :** CSS3 (Architecture Custom "Clean Tech")

## 📦 Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé :
* [Node.js](https://nodejs.org/) (v16 ou supérieur)
* [MetaMask](https://metamask.io/) (Extension navigateur)

## 💻 Installation et Lancement (Local)

La règle d'or de l'équipe : **"Testez tous en local"**.

1.  **Cloner le projet :**
    ```bash
    git clone [https://github.com/VOTRE-ORGA/certichain-front.git](https://github.com/VOTRE-ORGA/certichain-front.git)
    cd certichain-front
    ```

2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

3.  **Configurer l'environnement :**
    Créez un fichier `.env` à la racine basé sur l'exemple :
    ```text
    REACT_APP_CONTRACT_ADDRESS=0xVotreAdresseDeContrat
    REACT_APP_API_URL=http://localhost:8000
    ```

4.  **Lancer le serveur de développement :**
    ```bash
    npm start
    ```
    L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

## 🌳 Workflow Git

Merci de respecter les conventions de l'équipe :

* **Branche `main`** : Production uniquement (Protected).
* **Branche `develop`** : Branche de développement principale. Faites vos Merge Requests (MR) ici.
* **Branches `feature/BE-XX`** : Pour tout nouveau développement.
    * *Nommage Commit :* `BE-XX : Description de la tâche`

## 👥 Équipe

* [cite_start]**Gestion de Projet :** ATTARD Julien [cite: 80]
* [cite_start]**Tech Lead :** KADDOURI Mohammed [cite: 84]
* [cite_start]**Frontend & UX :** GAYES Ayman [cite: 91]
* [cite_start]**DevOps :** ALIZEID Rayan [cite: 87]
* [cite_start]**Sécurité :** LOGEAIS Aurélien [cite: 89]
