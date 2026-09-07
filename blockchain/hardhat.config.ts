import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-ethers';
import dotenv from 'dotenv';

dotenv.config();

// Mengambil private key dari .env
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const QBFT_RPC_URL = process.env.QBFT_RPC_URL ?? 'http://127.0.0.1:8545';
const QBFT_CHAIN_ID = Number(process.env.QBFT_CHAIN_ID ?? '1338');

if (!Number.isInteger(QBFT_CHAIN_ID) || QBFT_CHAIN_ID <= 0) {
  console.error('❌ ERROR FATAL: QBFT_CHAIN_ID harus berupa bilangan bulat positif.');
  process.exit(1);
}

// Validasi ketat ala Production: Jika .env kosong, gagalkan prosesnya!
if (!PRIVATE_KEY) {
  console.error('❌ ERROR FATAL: PRIVATE_KEY tidak ditemukan di file .env!');
  console.error('Silakan copy .env.example menjadi .env dan masukkan kunci rahasia Anda.');
  process.exit(1);
}

const qbftNetwork = {
  url: QBFT_RPC_URL,
  chainId: QBFT_CHAIN_ID,
  accounts: [PRIVATE_KEY],
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
  },
};

export default config;
