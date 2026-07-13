#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CERTICHAIN_DIR="$REPO_ROOT/Certichain"
BACKEND_DIR="$CERTICHAIN_DIR/certichain-back"
BLOCKCHAIN_DIR="$CERTICHAIN_DIR/certichain-blockchain"
FRONTEND_DIR="$CERTICHAIN_DIR/certichain-front"

# Couleurs
CYAN='\033[0;36m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
GRAY='\033[1;30m'
NC='\033[0m' # No Color

# Fonction pour ouvrir un nouveau terminal selon l'environnement Linux
open_terminal() {
    local cmd="$1"
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "$cmd; exec bash"
    elif command -v x-terminal-emulator &> /dev/null; then
        x-terminal-emulator -e "bash -c \"$cmd; exec bash\""
    elif command -v konsole &> /dev/null; then
        konsole -e bash -c "$cmd; exec bash"
    elif command -v xterm &> /dev/null; then
        xterm -e bash -c "$cmd; exec bash"
    else
        # Fallback si aucun émulateur de terminal n'est trouvé
        echo -e "${YELLOW}Aucun émulateur de terminal trouvé, exécution en arrière-plan :${NC}"
        bash -c "$cmd" &
    fi
}

echo -e "${CYAN}--- DÉMARRAGE DU PROJET CERTICHAIN (LINUX) ---${NC}"

# 0. RESET BASE DE DONNÉES
read -p "Réinitialiser la base de données ? Cela supprimera les migrations et db.sqlite3 [o/N] " reset_db
if [[ "$reset_db" =~ ^[oOyY] ]]; then
    echo -e "${RED}>>> Suppression des migrations et de la base de données...${NC}"

    # Suppression des migrations
    find "$BACKEND_DIR/diplomas/migrations" -type f -name "*.py" ! -name "__init__.py" -delete 2>/dev/null

    # Suppression de la db
    DB_FILE="$BACKEND_DIR/db.sqlite3"
    if [ -f "$DB_FILE" ]; then
        rm -f "$DB_FILE"
    fi

    echo -e "${GREEN}>>> Base de données et migrations supprimées.${NC}"
else
    echo -e "${GRAY}>>> Base de données conservée.${NC}"
fi

cd "$CERTICHAIN_DIR" || exit

# Option : reset des données locales (DB + médias)
read -p "Supprimer les données locales (db + medias) avant lancement ? (o/N) " reset_local
if [[ "$reset_local" =~ ^[oOyY] ]]; then
    echo -e "${YELLOW}>>> Suppression des données locales...${NC}"

    DB_PATH="$BACKEND_DIR/db.sqlite3"
    if [ -f "$DB_PATH" ]; then
        rm -f "$DB_PATH"
        echo -e "${YELLOW}- db.sqlite3 supprimé${NC}"
    fi

    MEDIA_FOLDERS=("$BACKEND_DIR/media/diplomas" "$BACKEND_DIR/media/photos")

    for folder in "${MEDIA_FOLDERS[@]}"; do
        if [ -d "$folder" ]; then
            rm -rf "$folder"/*
            echo -e "${YELLOW}- contenu vidé : $folder${NC}"
        else
            mkdir -p "$folder"
            echo -e "${YELLOW}- dossier créé : $folder${NC}"
        fi
    done

    echo -e "${GREEN}>>> Reset local terminé (DB + medias).${NC}"
fi

# Trouver le VENV
VENV_PYTHON="$REPO_ROOT/.venv/bin/python"
VENV_PIP="$REPO_ROOT/.venv/bin/pip"

if [ ! -f "$VENV_PYTHON" ]; then
    # Fallback sur le système par défaut s'il n'y a pas de venv local spécifique
    VENV_PYTHON="python3"
    VENV_PIP="pip3"
fi

# 1. BLOCKCHAIN (Hardhat)
echo -e "${YELLOW}[1/3] Préparation Hardhat${NC}"
cd "$BLOCKCHAIN_DIR" || exit
npm install

# Ouvre le process dans un nouveau shell
open_terminal "cd '$BLOCKCHAIN_DIR' && npx hardhat node --hostname 0.0.0.0"
sleep 5

# Déploiement
echo -e "${YELLOW}>>> Déploiement du contrat...${NC}"
npx hardhat run scripts/deploy.js --network localhost > deploy.log 2>&1
CONTRACT_ADDRESS=$(grep -oP "0x[a-fA-F0-9]{40}" deploy.log | head -n 1)
echo -e "${GREEN}>>> ADRESSE : $CONTRACT_ADDRESS${NC}"

# 2. BACKEND (Django)
cd "$BACKEND_DIR" || exit
echo -e "${YELLOW}[2/3] Préparation Backend${NC}"

# Copie ABI
ABI_PATH="$BACKEND_DIR/diplomas"
mkdir -p "$ABI_PATH"
cp -f "$BLOCKCHAIN_DIR/artifacts/contracts/CertiChainSBT.sol/CertiChainSBT.json" "$ABI_PATH/"

# Mise à jour de l'adresse du contrat dans .env
if [ -n "$CONTRACT_ADDRESS" ]; then
    ENV_FILE="$BACKEND_DIR/.env"
    if [ -f "$ENV_FILE" ]; then
        sed -i "s/^BLOCKCHAIN_CONTRACT_ADDRESS=.*/BLOCKCHAIN_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" "$ENV_FILE"
        echo -e "${GREEN}>>> .env mis à jour avec l'adresse $CONTRACT_ADDRESS${NC}"
    else
        echo -e "${RED}>>> Fichier .env introuvable, veuillez le créer.${NC}"
    fi
else
    echo -e "${RED}>>> ATTENTION : adresse du contrat non détectée, .env inchangé${NC}"
fi

# Lancement Django
BACKEND_DIR_ABS="$BACKEND_DIR"
COMMAND_DJANGO="cd '$BACKEND_DIR_ABS' && '$VENV_PIP' install -r requirements.txt web3 --no-cache-dir -q && '$VENV_PYTHON' manage.py makemigrations && '$VENV_PYTHON' manage.py migrate && '$VENV_PYTHON' manage.py runserver 0.0.0.0:8000"
open_terminal "$COMMAND_DJANGO"

# 3. FRONTEND (React)
cd "$FRONTEND_DIR" || exit
echo -e "${YELLOW}[3/3] Préparation Frontend${NC}"
npm install
COMMAND_REACT="cd '$FRONTEND_DIR' && npm start"
open_terminal "$COMMAND_REACT"

cd "$REPO_ROOT" || exit
echo -e "${CYAN}--- Lancement terminé ---${NC}"
