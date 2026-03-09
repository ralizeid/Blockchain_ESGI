require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Important pour lire le .env

module.exports = {
  solidity: "0.8.20",
  networks: {
    // Configuration pour le test local
    localhost: {
      url: process.env.POLYGON_RPC,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
