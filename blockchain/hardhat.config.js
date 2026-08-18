import '@nomicfoundation/hardhat-ethers';
/** @type import('hardhat/config').HardhatUserConfig */
import dotenv from 'dotenv';
dotenv.config();

// Mengambil private key dari .env
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Validasi ketat ala Production: Jika .env kosong, gagalkan prosesnya!
if (!PRIVATE_KEY) {
  console.error('❌ ERROR FATAL: PRIVATE_KEY tidak ditemukan di file .env!');
  console.error('Silakan copy .env.example menjadi .env dan masukkan kunci rahasia Anda.');
  process.exit(1);
}

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
      // Membaca private key dari .env untuk keamanan standar Production!
      accounts: [PRIVATE_KEY],
    },
  },
};
