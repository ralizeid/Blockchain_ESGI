$ErrorActionPreference = "Continue"

Write-Host "--- DEMARRAGE DU PROJET CERTICHAIN ---" -ForegroundColor Cyan

Set-Location "Certichain"

# Option : reset des donnees locales (DB + medias)
$resetAnswer = Read-Host "Supprimer les donnees locales (db + medias) avant lancement ? (o/N)"
if ($resetAnswer -match '^(o|oui|y|yes)$') {
    Write-Host ">>> Suppression des donnees locales..." -ForegroundColor Yellow

    $dbPath = "certichain-back\db.sqlite3"
    if (Test-Path $dbPath) {
        Remove-Item $dbPath -Force
        Write-Host "- db.sqlite3 supprime" -ForegroundColor DarkYellow
    }

    $mediaFolders = @(
        "certichain-back\media\diplomas",
        "certichain-back\media\photos"
    )

    foreach ($folder in $mediaFolders) {
        if (Test-Path $folder) {
            Get-ChildItem -Path $folder -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "- contenu vide : $folder" -ForegroundColor DarkYellow
        } else {
            New-Item -ItemType Directory -Path $folder -Force | Out-Null
            Write-Host "- dossier cree : $folder" -ForegroundColor DarkYellow
        }
    }

    Write-Host ">>> Reset local termine (DB + medias)." -ForegroundColor Green
}

# 1. BLOCKCHAIN (Hardhat)
Write-Host "[1/3] Preparation Hardhat" -ForegroundColor Yellow
Set-Location "certichain-blockchain"
npm install
# Ouvre le process dans un nouveau shell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx hardhat node --hostname 0.0.0.0"
Start-Sleep -Seconds 5

# Deploiement
Write-Host ">>> Deploiement du contrat..." -ForegroundColor Yellow
$deployOutput = npx hardhat run scripts/deploy.js --network localhost 2>&1 | Out-String
$contractAddress = [regex]::Match($deployOutput, "0x[a-fA-F0-9]{40}").Value
Write-Host ">>> ADRESSE : $contractAddress" -ForegroundColor Green

# 2. BACKEND (Django)
Set-Location ".."
Write-Host "[2/3] Preparation Backend" -ForegroundColor Yellow
Set-Location "certichain-back"

# Copie ABI
$abiPath = "diplomas"
if (!(Test-Path $abiPath)) { New-Item -ItemType Directory -Path $abiPath }
Copy-Item "..\certichain-blockchain\artifacts\contracts\CertiChainSBT.sol\CertiChainSBT.json" -Destination "$abiPath\" -Force

# Mise a jour de l'adresse du contrat dans .env (plus dans web3_service.py)
if ($contractAddress -ne "") {
    $envFile = ".env"
    $envContent = Get-Content $envFile -Raw
    $envContent = $envContent -replace 'BLOCKCHAIN_CONTRACT_ADDRESS=.*', "BLOCKCHAIN_CONTRACT_ADDRESS=$contractAddress"
    Set-Content $envFile $envContent
    Write-Host ">>> .env mis a jour avec l'adresse $contractAddress" -ForegroundColor Green
} else {
    Write-Host ">>> ATTENTION : adresse du contrat non detectee, .env inchange" -ForegroundColor Red
}

# Lancement Django avec le venv racine (evite les problemes de pydantic_core)
$rootVenvPython = "C:\Users\psgma\Documents\Blockchain_ESGI\.venv\Scripts\python.exe"
$rootVenvPip    = "C:\Users\psgma\Documents\Blockchain_ESGI\.venv\Scripts\pip.exe"
$backendDir     = "C:\Users\psgma\Documents\Blockchain_ESGI\Certichain\certichain-back"
$djangoCmd = "Set-Location '$backendDir'; " +
             "& '$rootVenvPip' install -r requirements.txt web3 --no-cache-dir -q; " +
             "& '$rootVenvPython' manage.py makemigrations; " +
             "& '$rootVenvPython' manage.py migrate; " +
             "& '$rootVenvPython' manage.py runserver 0.0.0.0:8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $djangoCmd

# 3. FRONTEND (React)
Set-Location ".."
Write-Host "[3/3] Preparation Frontend" -ForegroundColor Yellow
Set-Location "certichain-front"
npm install
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Set-Location "../.."

Write-Host "--- Lancement termine ---" -ForegroundColor Cyan
