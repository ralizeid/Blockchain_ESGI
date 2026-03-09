const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertiChain SBT", function () {
  it("Doit créer un diplôme mais INTERDIRE le transfert", async function () {
    const [admin, etudiant, voleur] = await ethers.getSigners();
    
    // Déploiement
    const CertiChain = await ethers.getContractFactory("CertiChainSBT");
    const certichain = await CertiChain.deploy();
    
    // Test Mint
    await certichain.safeMint(etudiant.address);
    console.log("✅ Diplôme créé");

    // Test Blocage Transfert
    await expect(
      certichain.connect(etudiant).transferFrom(etudiant.address, voleur.address, 0)
    ).to.be.revertedWith("Action Interdite: Ce diplome est lie a l'etudiant (SBT).");
    
    console.log("✅ Sécurité SBT validée");
  });
});
