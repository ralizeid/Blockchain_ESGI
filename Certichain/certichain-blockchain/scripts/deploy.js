const hre = require("hardhat");

async function main() {
  console.log("🚀 Début du déploiement...");

  // 1. Récupération du contrat
  const CertiChain = await hre.ethers.getContractFactory("CertiChainSBT");

  // 2. Déploiement
  const certichain = await CertiChain.deploy();
  await certichain.waitForDeployment();

  // 3. Affichage des infos pour le rapport
  const address = await certichain.getAddress();
  console.log("----------------------------------------------------");
  console.log("✅ CertiChain déployé avec succès !");
  console.log("📍 Adresse du contrat :", address);
  console.log("----------------------------------------------------");
  console.log("Pour vérifier sur PolygonScan, garde cette adresse précieusement.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
