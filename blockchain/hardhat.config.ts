import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-ethers';
import dotenv from 'dotenv';

dotenv.config();

// Mengambil private key dari .env
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BESU_RPC_URL =
  process.env.BESU_RPC_URL ?? process.env.QBFT_RPC_URL ?? 'http://127.0.0.1:8545';
const BESU_CHAIN_ID = Number(process.env.BESU_CHAIN_ID ?? process.env.QBFT_CHAIN_ID ?? '1338');

if (!Number.isInteger(BESU_CHAIN_ID) || BESU_CHAIN_ID <= 0) {
  console.error('❌ ERROR FATAL: BESU_CHAIN_ID/QBFT_CHAIN_ID harus berupa bilangan bulat positif.');
  process.exit(1);
}

const qbftNetwork = {
  url: BESU_RPC_URL,
  chainId: BESU_CHAIN_ID,
  // Compile and read-only preflight must work without a deployer key.
  accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
};

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24', // Versi Solidity yang dipin bersama OpenZeppelin 5.0.0
    settings: {
      evmVersion: 'paris', // Kompatibilitas kontrak dipertahankan selama migrasi ke QBFT
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    besu_local: qbftNetwork,
    besu_qbft_local: qbftNetwork,
    besu_qbft: qbftNetwork,
  },
};

export default config;
