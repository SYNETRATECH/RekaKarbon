import { ContractTransactionResponse } from 'ethers';
import hardhat from 'hardhat';

const { ethers } = hardhat;
const CREDIT_TOKEN_ID = 3n;
const EXPECTED_CHAIN_ID = Number(process.env.QBFT_CHAIN_ID ?? '1338');

type FeeOverrides = { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } | { gasPrice: bigint };

interface RekaKarbonContract {
  balanceOf(account: string, tokenId: bigint): Promise<bigint>;
  mintWalletCredit(
    account: string,
    amount: bigint,
    overrides?: FeeOverrides
  ): Promise<ContractTransactionResponse>;
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variabel lingkungan ${name} wajib diisi.`);
  }
  return value;
}

function readPositiveAmount(): bigint {
  const rawAmount = requireEnvironmentVariable('WALLET_CREDIT_AMOUNT_IDR');
  let amount: bigint;
  try {
    amount = BigInt(rawAmount);
  } catch (error: unknown) {
    throw new Error('WALLET_CREDIT_AMOUNT_IDR harus berupa bilangan bulat positif.', {
      cause: error,
    });
  }

  if (amount <= 0n) {
    throw new Error('WALLET_CREDIT_AMOUNT_IDR harus lebih besar dari nol.');
  }
  return amount;
}

async function getFeeOverrides(): Promise<FeeOverrides> {
  const feeData = await ethers.provider.getFeeData();
  if (
    feeData.maxFeePerGas !== null &&
    feeData.maxPriorityFeePerGas !== null &&
    feeData.maxFeePerGas > 0n &&
    feeData.maxPriorityFeePerGas > 0n
  ) {
    return {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };
  }

  if (feeData.gasPrice !== null && feeData.gasPrice > 0n) {
    return { gasPrice: feeData.gasPrice };
  }

  throw new Error('Node tidak mengembalikan fee non-zero yang valid. Top-up dibatalkan.');
}

async function main(): Promise<void> {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== BigInt(EXPECTED_CHAIN_ID)) {
    throw new Error(
      `Chain ID tidak sesuai: ${network.chainId.toString()} != ${EXPECTED_CHAIN_ID}. ` +
        'Pastikan menjalankan network besu_qbft_local.'
    );
  }

  const contractAddress = ethers.getAddress(
    requireEnvironmentVariable('CARBON_TOKEN_CONTRACT_ADDRESS')
  );
  const walletAddress = ethers.getAddress(requireEnvironmentVariable('WALLET_ADDRESS'));
  const amount = readPositiveAmount();
  const feeOverrides = await getFeeOverrides();
  const [deployer] = await ethers.getSigners();

  const contract = (await ethers.getContractAt(
    'RekaKarbon',
    contractAddress
  )) as unknown as RekaKarbonContract;
  const balanceBefore = await contract.balanceOf(walletAddress, CREDIT_TOKEN_ID);

  console.log(`Network chain ID: ${network.chainId.toString()}`);
  console.log(`Kontrak RekaKarbon: ${contractAddress}`);
  console.log(`Deployer/relayer: ${deployer.address}`);
  console.log(`Wallet penerima: ${walletAddress}`);
  console.log(`Saldo sebelum top-up: Rp ${balanceBefore.toString()}`);
  console.log(`Nominal top-up: Rp ${amount.toString()}`);
  console.log('Mengirim mintWalletCredit ke blockchain...');

  const transaction = await contract.mintWalletCredit(walletAddress, amount, feeOverrides);
  const receipt = await transaction.wait();
  if (!receipt) {
    throw new Error('Receipt transaksi top-up tidak tersedia.');
  }

  const balanceAfter = await contract.balanceOf(walletAddress, CREDIT_TOKEN_ID);
  console.log('Top-up berhasil.');
  console.log(`Transaction hash: ${transaction.hash}`);
  console.log(`Block number: ${receipt.blockNumber}`);
  console.log(`Saldo sesudah top-up: Rp ${balanceAfter.toString()}`);
  console.log(
    'Transaksi ini menerbitkan event TransferSingle token ID 3, sehingga akan tampil di riwayat dompet.'
  );
}

main().catch((error: unknown) => {
  console.error('Top-up wallet gagal:', error);
  process.exitCode = 1;
});
