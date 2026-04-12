const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertiChain – Registre de certification pseudonymisé", function () {
  let certichain, admin, other;

  // Helper : simule le hash SHA-256 que le backend calcule
  const makeHash = (str) => ethers.keccak256(ethers.toUtf8Bytes(str));

  beforeEach(async function () {
    [admin, other] = await ethers.getSigners();
    const CertiChain = await ethers.getContractFactory("CertiChainSBT");
    certichain = await CertiChain.deploy();
  });

  it("Doit certifier un hash et vérifier son état", async function () {
    const hash = makeHash("jean|dupont|master informatique|550e8400-uuid-secret");
    await certichain.certify(hash, admin.address, other.address);

    const [certified, revoked, schoolAddr, rectorateAddr, issuedAt] = await certichain.verify(hash);
    expect(certified).to.be.true;
    expect(revoked).to.be.false;
    expect(schoolAddr).to.equal(admin.address);
    expect(rectorateAddr).to.equal(other.address);
    expect(issuedAt).to.be.gt(0);
    console.log("✅ Certification réussie – hash ancré");
  });

  it("Doit rejeter une double certification du même hash", async function () {
    const hash = makeHash("alice|martin|licence droit|uuid-2");
    await certichain.certify(hash, admin.address, other.address);
    await expect(certichain.certify(hash, admin.address, other.address))
      .to.be.revertedWith("Ce hash est deja certifie.");
    console.log("✅ Protection double certification OK");
  });

  it("Doit révoquer un diplôme et refléter le drapeau", async function () {
    const hash = makeHash("bob|durand|bts|uuid-3");
    await certichain.certify(hash, admin.address, other.address);
    await certichain.revoke(hash);

    const [certified, revoked] = await certichain.verify(hash);
    expect(certified).to.be.true;   // toujours certifié (preuve d'historique)
    expect(revoked).to.be.true;     // mais marqué révoqué
    console.log("✅ Révocation enregistrée – diplôme invalidé");
  });

  it("Doit interdire la révocation d'un hash non certifié", async function () {
    const hash = makeHash("fantome|inconnu|rien|uuid-4");
    await expect(certichain.revoke(hash))
      .to.be.revertedWith("Ce hash n'est pas certifie.");
    console.log("✅ Révocation fantôme bloquée");
  });

  it("Doit retourner uncertified pour un hash inconnu", async function () {
    const hash = makeHash("inconnu|total|absent|uuid-5");
    const [certified] = await certichain.verify(hash);
    expect(certified).to.be.false;
    console.log("✅ Hash inexistant correctement signalé");
  });

  it("Doit interdire la certification par un non-propriétaire", async function () {
    const hash = makeHash("attaque|injection|hack|uuid-6");
    await expect(certichain.connect(other).certify(hash, admin.address, other.address)).to.be.reverted;
    console.log("✅ Sécurité onlyOwner validée");
  });
});

