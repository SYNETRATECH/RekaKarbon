import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-ethers';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '../server/.env' });

// Mengambil private key dari .env
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BESU_RPC_URL = process.env.BESU_RPC_URL || 'http://127.0.0.1:8545';
const BESU_CHAIN_ID = Number(process.env.BESU_CHAIN_ID || '1338');

if (!Number.isInteger(BESU_CHAIN_ID) || BESU_CHAIN_ID <= 0) {
  console.error('❌ ERROR FATAL: BESU_CHAIN_ID harus berupa bilangan bulat positif!');
  process.exit(1);
}

const config: HardhatUserConfig = {
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
    besu_qbft: {
      url: BESU_RPC_URL,
      chainId: BESU_CHAIN_ID,
      // Read-only commands (compile/preflight) do not need a deployer key.
      // Deployment scripts validate PRIVATE_KEY before sending transactions.
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};

export default config;
