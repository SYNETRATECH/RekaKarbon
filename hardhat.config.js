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

};
