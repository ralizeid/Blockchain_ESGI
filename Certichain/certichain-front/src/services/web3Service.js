import { ethers } from 'ethers';

// À mettre dans un fichier .env plus tard
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS; 

// ABI Minimaliste (Interface du Smart Contract) basées sur ton Jalon 1
// On suppose ici les fonctions safeMint(to, hash) et revoke(tokenId) [cite: 32, 47]
const CONTRACT_ABI = [
  "function safeMint(address to, string memory uri) public",
  "function revoke(uint256 tokenId) public",
  "function owner() public view returns (address)"
];

export const getEthereumObject = () => window.ethereum;

export const setupWeb3 = async () => {
  if (!window.ethereum) throw new Error("Pas de wallet détecté");
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // Demander la permission force MetaMask à afficher la popup de sélection de compte
  // Ce qui permet à l'utilisateur de changer de compte s'il vient de se déconnecter
  try {
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }]
    });
  } catch (err) {
    // Si l'utilisateur clique sur "Annuler"
    if (err.code === 4001) {
      throw new Error("Connexion MetaMask annulée");
    }
  }

  // Demande la permission de se connecter
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  
  return { provider, signer };
};

export const getContract = async (signer) => {
  if (!CONTRACT_ADDRESS) console.error("Adresse du contrat manquante !");
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

export const formatError = (error) => {
  // Aide pour le debug des erreurs Polygon/Metamask
  return error?.reason || error?.message || "Erreur inconnue";
};