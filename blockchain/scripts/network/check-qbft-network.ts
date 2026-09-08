import fs from 'node:fs';
import path from 'node:path';
import { JsonRpcProvider } from 'ethers';
import dotenv from 'dotenv';

dotenv.config({
  path: path.join(process.cwd(), 'networks', 'local-qbft', 'generated', '.env'),
});
dotenv.config();

const EXPECTED_CHAIN_ID = Number(process.env.QBFT_CHAIN_ID ?? '1338');
const RPC_URL = process.env.QBFT_RPC_URL ?? 'http://127.0.0.1:8545';

type JsonRecord = Record<string, unknown>;

interface NetworkInfo {
  chainId: number;
  validatorCount: number;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNetworkInfo(): NetworkInfo {
  const networkInfoPath = path.join(
    process.cwd(),
    'networks',
    'local-qbft',
    'generated',
    'network-info.json'
  );
  const rawValue = JSON.parse(fs.readFileSync(networkInfoPath, 'utf8')) as unknown;
  if (!isRecord(rawValue)) throw new Error('network-info.json tidak valid.');

  const { chainId, validatorCount } = rawValue;
  if (
    typeof chainId !== 'number' ||
    !Number.isInteger(chainId) ||
    typeof validatorCount !== 'number' ||
    !Number.isInteger(validatorCount) ||
    validatorCount < 1
  ) {
    throw new Error('network-info.json tidak memuat chainId dan validatorCount yang valid.');
  }

  return { chainId, validatorCount };
}

function readString(value: unknown): string {
  if (typeof value !== 'string') throw new Error('RPC mengembalikan nilai non-string.');
  return value;
}

async function main(): Promise<void> {
  if (!Number.isInteger(EXPECTED_CHAIN_ID)) throw new Error('QBFT_CHAIN_ID harus bilangan bulat.');
  const networkInfo = readNetworkInfo();
  if (networkInfo.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Chain ID metadata tidak sesuai: ${networkInfo.chainId} != ${EXPECTED_CHAIN_ID}.`
    );
  }

  const provider = new JsonRpcProvider(RPC_URL);
  const network = await provider.getNetwork();
  const blockNumber = await provider.getBlockNumber();
  const peerCountHex = readString(await provider.send('net_peerCount', []));
  const peerCount = Number.parseInt(peerCountHex, 16);

  console.log(`RPC URL: ${RPC_URL}`);
  console.log(`Chain ID: ${network.chainId.toString()}`);
  console.log(`Block height: ${blockNumber}`);
  console.log(`Peer count: ${peerCount}`);
  console.log(`Validator count (configured): ${networkInfo.validatorCount}`);

  if (network.chainId !== BigInt(EXPECTED_CHAIN_ID)) {
    throw new Error(`Chain ID tidak sesuai: ${network.chainId} != ${EXPECTED_CHAIN_ID}.`);
  }
  if (networkInfo.validatorCount !== 4) {
    throw new Error(
      `Konfigurasi jaringan harus memiliki 4 validator, ditemukan ${networkInfo.validatorCount}.`
    );
  }
  if (!Number.isInteger(peerCount) || peerCount < 1) {
    throw new Error('RPC node belum memiliki peer aktif ke jaringan QBFT.');
  }

  console.log('✅ QBFT network check lulus.');
}

main().catch((error: unknown) => {
  console.error('❌ QBFT network check gagal:', error);
  process.exitCode = 1;
});
