import hardhat from 'hardhat';
import dotenv from 'dotenv';

dotenv.config({ path: '../server/.env' });

const { ethers } = hardhat;

const expectedChainId = BigInt(process.env.BESU_CHAIN_ID || '1338');
const expectedValidatorCount = Number(process.env.EXPECTED_VALIDATOR_COUNT || '4');
const sampleDelayMs = Number(process.env.QBFT_BLOCK_SAMPLE_MS || '5000');
const sampleAttempts = Number(process.env.QBFT_BLOCK_SAMPLE_ATTEMPTS || '3');

function requirePositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} harus berupa bilangan bulat positif.`);
  }
}

function parseOptionalAddresses(): string[] {
  const configured = [
    process.env.CARBON_TOKEN_CONTRACT_ADDRESS,
    process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS,
  ].filter((value): value is string => Boolean(value?.trim()));

  return configured.map((address) => {
    if (!ethers.isAddress(address)) {
      throw new Error(`Alamat contract tidak valid: ${address}`);
    }
    return ethers.getAddress(address);
  });
}

async function main(): Promise<void> {
  requirePositiveInteger(expectedValidatorCount, 'EXPECTED_VALIDATOR_COUNT');
  requirePositiveInteger(sampleDelayMs, 'QBFT_BLOCK_SAMPLE_MS');
  requirePositiveInteger(sampleAttempts, 'QBFT_BLOCK_SAMPLE_ATTEMPTS');

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== expectedChainId) {
    throw new Error(
      `Chain ID tidak sesuai: ${network.chainId.toString()} != ${expectedChainId.toString()}.`
    );
  }

  const blockBefore = await ethers.provider.getBlockNumber();
  const validators = (await ethers.provider.send('qbft_getValidatorsByBlockNumber', [
    'latest',
  ])) as unknown;

  if (!Array.isArray(validators) || validators.length !== expectedValidatorCount) {
    throw new Error(
      `Validator QBFT tidak sesuai: ${Array.isArray(validators) ? validators.length : 'invalid'} != ${expectedValidatorCount}.`
    );
  }

  let blockAfter = blockBefore;
  for (let attempt = 1; attempt <= sampleAttempts; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, sampleDelayMs));
    blockAfter = await ethers.provider.getBlockNumber();
    if (blockAfter > blockBefore) break;
  }

  if (blockAfter <= blockBefore) {
    throw new Error(
      `Block tidak bertambah selama preflight setelah ${sampleAttempts} percobaan: ${blockBefore} -> ${blockAfter}.`
    );
  }

  const contractAddresses = parseOptionalAddresses();
  for (const address of contractAddresses) {
    const code = await ethers.provider.getCode(address);
    if (code === '0x') {
      throw new Error(`Bytecode contract tidak ditemukan pada ${address}.`);
    }
  }

  console.log('QBFT preflight passed.');
  console.log(`Chain ID: ${network.chainId.toString()}`);
  console.log(`Block progression: ${blockBefore} -> ${blockAfter}`);
  console.log(`Validators: ${validators.join(', ')}`);
  if (contractAddresses.length > 0) {
    console.log(`Contracts verified: ${contractAddresses.join(', ')}`);
  } else {
    console.log('Contracts: skipped (contract addresses belum dikonfigurasi).');
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Kesalahan tidak diketahui.';
  console.error(`QBFT preflight gagal: ${message}`);
  process.exitCode = 1;
});
