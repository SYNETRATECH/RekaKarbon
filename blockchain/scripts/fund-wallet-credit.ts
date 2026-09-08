import path from 'node:path';

import dotenv from 'dotenv';
import { Contract, Interface, JsonRpcProvider, Wallet, getAddress, isAddress } from 'ethers';

const RKB_CREDIT_TOKEN_ID = 3n;
const WALLET_CREDIT_ABI = [
  'function mintWalletCredit(address to, uint256 amount)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function DEPOSIT_ROLE() view returns (bytes32)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
] as const;

function loadEnvironment(): void {
  const environmentFiles = [
    path.resolve(process.cwd(), 'networks/local-qbft/generated/.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../server/.env'),
  ];

  for (const environmentFile of environmentFiles) {
    dotenv.config({ path: environmentFile });
  }
}

function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Environment ${name} wajib diisi.`);
  }

  return value;
}

function parsePositiveBigInt(value: string, name: string): bigint {
  if (!/^\d+$/u.test(value)) {
    throw new Error(`${name} harus berupa bilangan bulat tanpa pemisah atau simbol.`);
  }

  const parsedValue = BigInt(value);
  if (parsedValue <= 0n) {
    throw new Error(`${name} harus lebih besar dari nol.`);
  }

  return parsedValue;
}

function normalizeAddress(value: string, name: string): string {
  const normalizedValue = value.toLowerCase();
  if (!isAddress(normalizedValue)) {
    throw new Error(`${name} bukan alamat EVM yang valid.`);
  }

  return getAddress(normalizedValue);
}

async function main(): Promise<void> {
  loadEnvironment();

  const rpcUrl = process.env.BESU_RPC_URL?.trim() || requireEnvironment('QBFT_RPC_URL');
  const configuredChainId = parsePositiveBigInt(
    process.env.BESU_CHAIN_ID?.trim() || requireEnvironment('QBFT_CHAIN_ID'),
    'BESU_CHAIN_ID'
  );
  const privateKey = requireEnvironment('PRIVATE_KEY');
  const contractAddress = normalizeAddress(
    requireEnvironment('CARBON_TOKEN_CONTRACT_ADDRESS'),
    'CARBON_TOKEN_CONTRACT_ADDRESS'
  );
  const recipientAddress = normalizeAddress(
    requireEnvironment('WALLET_CREDIT_RECIPIENT'),
    'WALLET_CREDIT_RECIPIENT'
  );
  const amount = parsePositiveBigInt(
    requireEnvironment('WALLET_CREDIT_AMOUNT_IDR'),
    'WALLET_CREDIT_AMOUNT_IDR'
  );

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== configuredChainId) {
    throw new Error(
      `Chain ID tidak sesuai: ${network.chainId.toString()} != ${configuredChainId.toString()}.`
    );
  }

  const deployedCode = await provider.getCode(contractAddress);
  if (deployedCode === '0x') {
    throw new Error(`Tidak ditemukan bytecode kontrak pada ${contractAddress}.`);
  }

  const signer = new Wallet(privateKey, provider);
  const tokenContract = new Contract(contractAddress, WALLET_CREDIT_ABI, signer);
  const balanceOf = tokenContract.getFunction('balanceOf');
  const depositRole = tokenContract.getFunction('DEPOSIT_ROLE');
  const hasRole = tokenContract.getFunction('hasRole');
  const mintWalletCredit = tokenContract.getFunction('mintWalletCredit');
  const tokenInterface = new Interface(WALLET_CREDIT_ABI);
  const transferSingleEvent = tokenInterface.getEvent('TransferSingle');
  if (!transferSingleEvent) {
    throw new Error('ABI TransferSingle tidak tersedia untuk verifikasi receipt.');
  }
  const transferSingleTopic = transferSingleEvent.topicHash;

  const signerAddress = getAddress(await signer.getAddress());
  const depositRoleValue = await depositRole();
  const isDepositOperator = await hasRole(depositRoleValue, signerAddress);
  if (!isDepositOperator) {
    throw new Error(`Signer ${signerAddress} tidak memiliki DEPOSIT_ROLE.`);
  }

  const balanceBefore = await balanceOf(recipientAddress, RKB_CREDIT_TOKEN_ID);
  const transaction = await mintWalletCredit(recipientAddress, amount);
  const receipt = await transaction.wait();
  if (!receipt) {
    throw new Error('Receipt transaksi tidak tersedia setelah menunggu konfirmasi blockchain.');
  }

  if (receipt.status !== 1) {
    throw new Error(`Transaksi blockchain gagal dengan status ${receipt.status ?? 'unknown'}.`);
  }

  const balanceAfter = await balanceOf(recipientAddress, RKB_CREDIT_TOKEN_ID);
  const expectedBalance = balanceBefore + amount;
  if (balanceAfter !== expectedBalance) {
    throw new Error(
      `Saldo setelah mint tidak sesuai: ${balanceAfter.toString()} != ${expectedBalance.toString()}.`
    );
  }

  const transferEventFound = receipt.logs.some((log: (typeof receipt.logs)[number]) => {
    if (
      log.address.toLowerCase() !== contractAddress.toLowerCase() ||
      log.topics[0] !== transferSingleTopic
    ) {
      return false;
    }

    try {
      const event = tokenInterface.parseLog({ topics: log.topics, data: log.data });
      if (!event || event.name !== 'TransferSingle') return false;

      const eventRecipient = getAddress(String(event.args[2]));
      const eventTokenId = BigInt(String(event.args[3]));
      const eventAmount = BigInt(String(event.args[4]));
      return (
        eventRecipient === recipientAddress &&
        eventTokenId === RKB_CREDIT_TOKEN_ID &&
        eventAmount === amount
      );
    } catch {
      return false;
    }
  });
  if (!transferEventFound) {
    throw new Error('Event TransferSingle RKB_CREDIT tidak ditemukan pada receipt transaksi.');
  }

  console.log(`RPC: ${rpcUrl}`);
  console.log(`Chain ID: ${network.chainId.toString()}`);
  console.log(`Signer: ${signerAddress} (DEPOSIT_ROLE verified)`);
  console.log(`Recipient: ${recipientAddress}`);
  console.log('Asset: RKB_CREDIT (token ID 3)');
  console.log(`Saldo sebelum: ${balanceBefore.toString()}`);
  console.log(`Nominal mint: ${amount.toString()}`);
  console.log(`Saldo sesudah: ${balanceAfter.toString()}`);
  console.log('TransferSingle event: verified');
  console.log(`Transaction hash: ${receipt.hash}`);
  console.log(`Block number: ${receipt.blockNumber}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Kesalahan tidak diketahui.';
  console.error(`❌ Top-up wallet gagal: ${message}`);
  process.exitCode = 1;
});
