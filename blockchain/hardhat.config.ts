import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-ethers';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_DEV_KEY = '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3';
const PRIVATE_KEY = process.env.PRIVATE_KEY || DEFAULT_DEV_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      evmVersion: 'paris',
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    besu_local: {
      url: process.env.RPC_URL || 'http://127.0.0.1:8545',
      chainId: 1337,
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;
