# Changelog — CertiChain
> Projet Annuel — Filière SI (Sécurité Informatique) — 5e année ESGI  
> Pilotage & Gouvernance : Julien ATTARD (Chef de Projet / PM)  
> Équipe Technique : Aurélien LOGEAIS, Rayan ALIZEID, Mohammed KADDOURI, Ayman GAYES

---

## [Novembre — Décembre 2025] — Initialisation & Cadrage Stratégique

### Ajouté — Gestion de Projet (Julien ATTARD)
- Rédaction du **cadrage projet (MVP)** : périmètre, objectifs, livrables attendus
- Réalisation du **diagramme de cas d'utilisation** : acteurs Admin (Établissement) et Recruteur (Vérificateur)
- Mise en place de la **matrice RACI** : définition des pôles opérationnels (Tech, DevOps, Front, Sécurité)
- Élaboration du **diagramme de Gantt** : planification des jalons et livrables
- Configuration des espaces de travail **Jira** et **Confluence**
- Réalisation de l'**analyse SWOT** : forces (standardisation) et faiblesses (adoption) de CertiChain
- Rédaction des **User Stories** initiales pour chaque acteur
- Choix et justification de la **stack technique** : React, Django, Solidity, IPFS, Polygon

### Ajouté — Technique
- `Initial commit` — structuration du dépôt Git (Rayan)
- `BE-28` : Initialisation de la structure du projet (Rayan)
- MAJ README initiale x3 (Aurélien)

---

## [Janvier — Février 2026] — Ingénierie de Sécurité & Privacy by Design

> Période sans commits techniques — pilotage et documentation assurés
> intégralement par le Chef de Projet.

### Ajouté — Gestion de Projet (Julien ATTARD)
- Rédaction de la **matrice des risques SI** : 12 risques identifiés (technique, juridique, organisationnel), évaluation probabilité/impact, plan de mitigation
- Rédaction de l'**étude de conformité RGPD** (Art. 5, 6, 7, 17, 25) imposant le principe de Privacy by Design à l'équipe
- Définition de la contrainte **Privacy by Design** : aucune donnée personnelle stockée on-chain, uniquement le hash SHA-256 pseudonymisé
- Réalisation du **diagramme de séquence** : Phase 1 Off-Chain (backend ↔ MetaMask) et Phase 2 On-Chain (ancrage Polygon)
- **Arbitrage technologique** : justification du choix des Soulbound Tokens (SBT) pour garantir la non-transférabilité des titres
- Pilotage **Agile** : suivi de 82 tickets Jira, respect des limites WIP, déblocage des dépendances inter-équipes

### Note PM
> L'étude RGPD produite durant cette période a directement impacté le code :
> voir `BE-64` (semaine du 09 mars) — Aurélien a refactorisé le backend
> pour s'aligner sur la séparation stricte données personnelles (IPFS) /
> hash anonymisé (on-chain) documentée par le PM.

---

## [14 février — 01 mars 2026] — Socle Technique & Hybridation Web2/Web3

### Ajouté — Gestion de Projet (Julien ATTARD)
- **Validation architecture hybride** : passage en mode IPFS / Polygon validé par le PM pour garantir une vérification en moins de 3 secondes

### Ajouté — Technique
- `BE-27` : Mise en place outils DevOps (Rayan)
- `BE-30` : Initialisation de la VM de production sur Proxmox + configuration VPN (Rayan)
- `BE-44` : Changement base de données Docker (Rayan + Aurélien)
- `BE-51` : Mise en place pipelines CI/CD via GitHub Actions (Rayan)
- `BE-54` : **Intégration de la blockchain dans l'architecture** (Mohammed)
- `BE-57` : Création page profil + modification abonnement (Ayman)
- `BE-58` : Harmonisation du système d'abonnement (Aurélien)
- `BE-59` : Optimisation page SchoolProfile + abonnement (Aurélien)
- `BE-61` : Correction problèmes abonnement (Aurélien)
- `BE-63` : Modification README (Aurélien)
- V1 première version fonctionnelle (Aurélien)
- V2 page personnalisée pour la validation (Aurélien)
- `BE-45` : Limitation abonnement + validation (Aurélien)
- MAJ `requirements.txt`, `package.json`, README (Mohammed)

---

## [09 au 15 mars 2026] — Livraison Bêta & Conformité RGPD

### ⭐ Impact PM tracé dans le code
- `BE-64` : **Refonte majeure du backend pour s'aligner sur la documentation RGPD de Julien ATTARD** — séparation stricte données personnelles (IPFS) / hash anonymisé on-chain (Aurélien)

### Ajouté — Technique
- `BE-62` : Déploiement système de loggers pour auditabilité des actions critiques (Rayan)
- `BE-53` : CI/CD Deploy — déclenchement automatique sur PR Main (Rayan)
- `BE-66` : Modification blockchain RGPD + visualisation diplôme (Aurélien)
- `BE-67` : Mise en place révocation et expiration — cycle de vie du diplôme (Aurélien)
- `BE-68` : Ajout état diplôme dans le hash (Aurélien)
- `BE-70` : Création QR Code et UUID personnalisé (Aurélien)
- `BE-72` : Signature cryptographique via clé privée MetaMask (Aurélien)
- `BE-73` : Modification profil + nouvelle procédure locale README (Aurélien)
- `BE-74` : Droit à l'oubli pour étudiant + modification script (Aurélien)
- `BE-75` : Mise en place anti-usurpation d'identité (Aurélien)
- `BE-76` : Séparation stricte interfaces Diplômé et Recruteur (Aurélien)
- `BE-77` : Implémentation validation suppression données RGPD (Aurélien)
- `BE-78` : Regroupement signature diplôme pour rectorat (Aurélien)
- `BE-79` : Étoffer informations profil école (Aurélien)
- `BE-80` : Ajout vérification mail pour modifications importantes (Aurélien)
- `BE-85` : MAJ README (Aurélien)
- `BE-86` : Suppression données possible au lancement du script + MAJ README (Aurélien)
- `BE-88` : Ajout QR code sur diplôme Bêta (Aurélien)
- `BE-89` : Modification script lancement — suppression media (Aurélien)
- `BE-92` : Masquage lien, QR code et document si diplôme non validé (Aurélien)
- `BE-93` : Script de lancement Linux (Aurélien)
- `BE-94` : Fix script Windows (Rayan)
- `BE-95` : Bouton déconnexion page rectorat (Aurélien)

---

## [16 au 20 mars 2026] — Mise en production V1.0 & Sécurisation

### Ajouté — Technique
- `BE-96` : Correction bug script Windows (Aurélien)
- **Déploiement V1.0** — mise en production officielle, merge main ← develop (Rayan)
- Configuration Nginx pour servir les fichiers statiques React (Rayan)
- `BE-98` : Sécurité diplôme — accès restreint à une seule page + correction (Aurélien)
- `BE-99` : Aperçu (preview) photo d'identité de l'étudiant (Aurélien)
- `BE-100` : Restructuration du formulaire d'inscription établissement (Aurélien)
- `BE-101` : Guide d'aide à l'utilisation de MetaMask — V1 (Aurélien)
- `BE-102` : Vérification des inputs + durcissement des mots de passe (Aurélien)
- `BE-103` : Sauvegarde des coordonnées du QR code (Aurélien)
- `BE-104` : Réglage de l'expiration de session (Aurélien)
- `BE-105` : Amélioration navigation page diplôme (Aurélien)
- `BE-106` : Champs obligatoires au processus de création diplôme et profil (Aurélien)
- `BE-107` : Modification + correction système d'abonnements (Aurélien)
- Pipeline Docker améliorée : tagging intelligent, déclenchement sur PR, migration vers images Docker, ajout service Cloudflared (Rayan)

### Ajouté — Gestion de Projet (Julien ATTARD)
- Rédaction et publication du **CHANGELOG historique complet** du projet CertiChain

---

## [23 au 29 mars 2026] — Consolidation post-V1.0

> Période sans commits techniques — stabilisation post-déploiement V1.0.

---

## [Avril 2026] — Intégration Email Transactionnel & Infrastructure

### Ajouté — Technique
- `BE-111` : Fix des tests Hardhat — validation smart contract (Rayan)
- Intégration **Anymail + Resend API** pour l'envoi d'emails transactionnels (Rayan)
- Implémentation **envoi asynchrone des emails** pour les actions critiques (Rayan)
- Ajout `django-anymail` dans `requirements.txt` (Rayan)
- Configuration logging dédié pour le monitoring des erreurs d'envoi email (Rayan)
- Ajout configuration réseau personnalisée dans `docker-compose` (Rayan)
- Correction entrypoint : shell `bash` → `sh` (Rayan)
- Dockerfile : remplacement `npm ci` par `npm install` (Rayan)