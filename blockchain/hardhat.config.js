import '@nomicfoundation/hardhat-ethers';
/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: '0.8.24', // Versi solidity yang stabil dan disupport openzeppelin
    settings: {
      evmVersion: 'paris', // Menggunakan Paris untuk menghindari error opcode 0x5f (PUSH0) di Besu dev network
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    besu_local: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337, // Chain ID standar untuk jaringan lokal Hardhat / Besu Dev
      // Ini adalah private key default untuk node 'dev' di Besu yang memiliki saldo ETH berlimpah
      accounts: ['0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3'],
    },
  },
};
