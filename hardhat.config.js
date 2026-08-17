import "@nomicfoundation/hardhat-ethers";
/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.24", // Versi solidity yang stabil dan disupport openzeppelin
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    besu_local: {
      url: "http://127.0.0.1:8545",
      chainId: 1337 // Default chainId untuk network "dev" di Hyperledger Besu
    }
  }
};
