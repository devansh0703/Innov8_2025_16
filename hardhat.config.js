require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PRIVATE_KEYS = [
  process.env.SEPOLIA_PRIVATE_KEY_1,
  process.env.SEPOLIA_PRIVATE_KEY_2,
  process.env.SEPOLIA_PRIVATE_KEY_3,
  process.env.SEPOLIA_PRIVATE_KEY_4,
];

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEYS,
    },
  },
};

