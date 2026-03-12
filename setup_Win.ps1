$ErrorActionPreference = "Continue"

Write-Host "--- DEMARRAGE DU PROJET CERTICHAIN ---" -ForegroundColor Cyan

# 0. RESET BASE DE DONNEES
$reset = Read-Host "Reinitialiser la base de donnees ? Cela supprimera les migrations et db.sqlite3 [o/N]"
if ($reset -match '^(o|oui|y|yes)$') {
    Write-Host ">>> Suppression des migrations et de la base de donnees..." -ForegroundColor Red

    $migrationsPath = "Certichain\certichain-back\diplomas\migrations"
    Get-ChildItem -Path $migrationsPath -File |
        Where-Object { $_.Name -ne "__init__.py" } |
        Remove-Item -Force

    $dbPath = "Certichain\certichain-back\db.sqlite3"
    if (Test-Path $dbPath) { Remove-Item $dbPath -Force }

    Write-Host ">>> Base de donnees et migrations supprimees." -ForegroundColor Green
} else {
    Write-Host ">>> Base de donnees conservee." -ForegroundColor DarkGray
}

Set-Location "Certichain"

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
