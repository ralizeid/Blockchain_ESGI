$ErrorActionPreference = "Continue"

Write-Host "--- DEMARRAGE DU PROJET CERTICHAIN ---" -ForegroundColor Cyan

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
$deployOutput = npx hardhat run scripts/deploy.js --network localhost
$contractAddress = [regex]::Match($deployOutput, "0x[a-fA-F0-9]{40}").Value
Write-Host ">>> ADRESSE : $contractAddress" -ForegroundColor Green

# 2. BACKEND (Django)
Set-Location ".."
Write-Host "[2/3] Preparation Backend" -ForegroundColor Yellow
Set-Location "certichain-back"

# Copie ABI
$abiPath = "diplomas"
if (!(Test-Path $abiPath)) { New-Item -ItemType Directory -Path $abiPath }
Copy-Item "..\certichain-blockchain\artifacts\contracts\CertiChainSBT.sol\CertiChainSBT.json" -Destination "$abiPath\"

$pyFile = "diplomas\web3_service.py"
$content = Get-Content $pyFile
$newContent = $content -replace 'CONTRACT_ADDRESS = .*', "CONTRACT_ADDRESS = `"$contractAddress`""
$newContent | Set-Content $pyFile

# Lancement Django
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt web3; python manage.py migrate; python manage.py runserver 0.0.0.0:8000"

# 3. FRONTEND (React)
Set-Location ".."
Write-Host "[3/3] Preparation Frontend" -ForegroundColor Yellow
Set-Location "certichain-front"
npm install
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host "--- Lancement termine ---" -ForegroundColor Cyan