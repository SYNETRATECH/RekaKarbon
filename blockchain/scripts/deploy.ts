import fs from 'node:fs';
import path from 'node:path';
import { ContractTransactionResponse, keccak256, toUtf8Bytes } from 'ethers';
import hardhat from 'hardhat';

const { ethers } = hardhat;
const EXPECTED_CHAIN_ID = Number(process.env.QBFT_CHAIN_ID ?? '1338');
const DEFAULT_MIN_DEPLOYER_BALANCE_WEI = 1_000_000_000_000_000n;

type FeeOverrides = { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } | { gasPrice: bigint };

interface TransactionRecord {
  hash: string;
  blockNumber: number;
}

interface JsonRecord {
  [key: string]: unknown;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Nilai konfigurasi harus bilangan bulat positif: ${value ?? fallback}.`);
  }
  return parsed;
}

function readPositiveBigInt(value: string | undefined, fallback: bigint): bigint {
  try {
    const parsed = value === undefined ? fallback : BigInt(value);
    if (parsed <= 0n) throw new Error('value must be positive');
    return parsed;
  } catch (error: unknown) {
    throw new Error('Konfigurasi saldo minimum deployer harus bilangan bulat positif dalam wei.', {
      cause: error,
    });
  }
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

  throw new Error('Node tidak mengembalikan fee non-zero yang valid. Deployment dibatalkan.');
}

async function waitForReceipt(
  transaction: ContractTransactionResponse,
  label: string
): Promise<TransactionRecord> {
  const receipt = await transaction.wait();
  if (!receipt) throw new Error(`Receipt transaksi ${label} tidak tersedia.`);
  return { hash: transaction.hash, blockNumber: receipt.blockNumber };
}

function getManifestPath(): string {
  const configuredPath = process.env.DEPLOYMENT_INFO_PATH ?? 'deployment-info-qbft-local.json';
  return path.resolve(process.cwd(), configuredPath);
}

function assertDeploymentAllowed(manifestPath: string): void {
  if (fs.existsSync(manifestPath) && process.env.ALLOW_QBFT_REDEPLOY !== 'true') {
    throw new Error(
      `Manifest deployment sudah ada di ${manifestPath}. ` +
        'Gunakan alamat manifest yang berbeda atau set ALLOW_QBFT_REDEPLOY=true secara eksplisit untuk jaringan disposable.'
    );
  }
}

function getArtifactAbiHash(contractName: string): string {
  const artifactPath = path.join(
    process.cwd(),
    'artifacts',
    'contracts',
    `${contractName}.sol`,
    `${contractName}.json`
  );
  if (!fs.existsSync(artifactPath)) throw new Error(`Artifact ${contractName} tidak ditemukan.`);

  const artifact: unknown = JSON.parse(fs.readFileSync(artifactPath, 'utf8')) as unknown;
  if (!isRecord(artifact) || !Array.isArray(artifact.abi)) {
    throw new Error(`Artifact ${contractName} tidak memiliki ABI yang valid.`);
  }
  return keccak256(toUtf8Bytes(JSON.stringify(artifact.abi)));
}

async function main(): Promise<void> {
  if (!Number.isInteger(EXPECTED_CHAIN_ID) || EXPECTED_CHAIN_ID !== 1338) {
    throw new Error(
      `QBFT_CHAIN_ID harus 1338 untuk deployment local QBFT, bukan ${EXPECTED_CHAIN_ID}.`
    );
  }

  const manifestPath = getManifestPath();
  assertDeploymentAllowed(manifestPath);

  console.log('Memulai deployment RekaKarbon ke local QBFT...');
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== BigInt(EXPECTED_CHAIN_ID)) {
    throw new Error(`Chain ID salah: ${network.chainId} (diharapkan ${EXPECTED_CHAIN_ID}).`);
  }

  const latestBlock = await ethers.provider.getBlock('latest');
  if (!latestBlock) throw new Error('Node belum menyediakan blok terbaru.');

  const [deployer] = await ethers.getSigners();
  if (deployer.address === ethers.ZeroAddress) throw new Error('Alamat deployer tidak valid.');
  const balance = await ethers.provider.getBalance(deployer.address);
  const minimumBalance = readPositiveBigInt(
    process.env.QBFT_MIN_DEPLOYER_BALANCE_WEI,
    DEFAULT_MIN_DEPLOYER_BALANCE_WEI
  );
  if (balance < minimumBalance) {
    throw new Error(
      `Saldo deployer terlalu kecil: ${balance.toString()} wei; minimum ${minimumBalance.toString()} wei.`
    );
  }

  const transactionOverrides = await getFeeOverrides();
  console.log('Deploying contract menggunakan akun:', deployer.address);
  console.log('Saldo deployer:', ethers.formatEther(balance));
  console.log('Blok awal:', latestBlock.number);
  console.log('Fee policy:', transactionOverrides);

  const RekaKarbon = await ethers.getContractFactory('RekaKarbon');
  const rekaKarbon = await RekaKarbon.deploy(transactionOverrides);
  const rekaDeploymentTransaction = rekaKarbon.deploymentTransaction();
  if (!rekaDeploymentTransaction)
    throw new Error('Transaksi deployment RekaKarbon tidak tersedia.');
  const rekaDeployment = await waitForReceipt(rekaDeploymentTransaction, 'RekaKarbon deployment');
  await rekaKarbon.waitForDeployment();

  const EmissionReportRegistry = await ethers.getContractFactory('EmissionReportRegistry');
  const registry = await EmissionReportRegistry.deploy(transactionOverrides);
  const registryDeploymentTransaction = registry.deploymentTransaction();
  if (!registryDeploymentTransaction)
    throw new Error('Transaksi deployment registry tidak tersedia.');
  const registryDeployment = await waitForReceipt(
    registryDeploymentTransaction,
    'EmissionReportRegistry deployment'
  );
  await registry.waitForDeployment();

  const rekaKarbonAddress = await rekaKarbon.getAddress();
  const registryAddress = await registry.getAddress();
  const rekaCode = await ethers.provider.getCode(rekaKarbonAddress);
  const registryCode = await ethers.provider.getCode(registryAddress);
  if (rekaCode === '0x' || registryCode === '0x') {
    throw new Error('Runtime bytecode contract tidak ditemukan setelah deployment.');
  }

  console.log('\n=======================================================');
  console.log('✅ DEPLOYMENT BERHASIL!');
  console.log('✅ RekaKarbon Contract Address:', rekaKarbonAddress);
  console.log('✅ EmissionReportRegistry Address:', registryAddress);

  console.log('\nMemproses pengaturan otorisasi (Roles)...');
  const oracleRole: string = await rekaKarbon.ORACLE_ROLE();
  const depositRole: string = await rekaKarbon.DEPOSIT_ROLE();
  const marketOperatorRole: string = await rekaKarbon.MARKET_OPERATOR_ROLE();
  const auditorRole: string = await registry.AUDITOR_ROLE();
  const reporterRole: string = await registry.REPORTER_ROLE();

  const roleTransactions: Record<string, TransactionRecord> = {};
  roleTransactions.oracle = await waitForReceipt(
    await rekaKarbon.grantRole(oracleRole, deployer.address, transactionOverrides),
    'grant ORACLE_ROLE'
  );
  console.log('✅ ORACLE_ROLE diberikan kepada relayer lokal.');

  roleTransactions.deposit = await waitForReceipt(
    await rekaKarbon.grantRole(depositRole, deployer.address, transactionOverrides),
    'grant DEPOSIT_ROLE'
  );
  console.log('✅ DEPOSIT_ROLE diberikan kepada relayer lokal.');

  roleTransactions.marketOperator = await waitForReceipt(
    await rekaKarbon.grantRole(marketOperatorRole, deployer.address, transactionOverrides),
    'grant MARKET_OPERATOR_ROLE'
  );
  console.log('✅ MARKET_OPERATOR_ROLE diberikan kepada relayer lokal.');

  roleTransactions.revenueRecipients = await waitForReceipt(
    await rekaKarbon.setBursaRevenueRecipients(
      deployer.address,
      deployer.address,
      deployer.address,
      deployer.address,
      deployer.address,
      deployer.address,
      transactionOverrides
    ),
    'configure bursa revenue recipients'
  );
  console.log('✅ Penerima settlement bursa dikonfigurasi untuk jaringan lokal.');

  roleTransactions.auditor = await waitForReceipt(
    await registry.grantRole(auditorRole, deployer.address, transactionOverrides),
    'grant AUDITOR_ROLE'
  );
  console.log('✅ AUDITOR_ROLE diberikan kepada relayer lokal.');

  roleTransactions.reporter = await waitForReceipt(
    await registry.grantRole(reporterRole, deployer.address, transactionOverrides),
    'grant REPORTER_ROLE'
  );
  console.log('✅ REPORTER_ROLE diberikan kepada relayer lokal.');

  const roleChecks = {
    oracle: await rekaKarbon.hasRole(oracleRole, deployer.address),
    deposit: await rekaKarbon.hasRole(depositRole, deployer.address),
    marketOperator: await rekaKarbon.hasRole(marketOperatorRole, deployer.address),
    auditor: await registry.hasRole(auditorRole, deployer.address),
    reporter: await registry.hasRole(reporterRole, deployer.address),
  };
  if (Object.values(roleChecks).some((isGranted) => !isGranted)) {
    throw new Error('Role verification gagal setelah deployment.');
  }

  const deploymentInfo = {
    schemaVersion: 1,
    network: 'besu_qbft_local',
    chainId: EXPECTED_CHAIN_ID,
    rpcUrl: process.env.QBFT_RPC_URL ?? 'http://127.0.0.1:8545',
    deployer: deployer.address,
    contracts: {
      rekaKarbon: rekaKarbonAddress,
      emissionReportRegistry: registryAddress,
    },
    deploymentTransactions: {
      rekaKarbon: rekaDeployment,
      emissionReportRegistry: registryDeployment,
    },
    roleTransactions,
    deploymentBlocks: {
      rekaKarbon: rekaDeployment.blockNumber,
      emissionReportRegistry: registryDeployment.blockNumber,
    },
    roleChecks,
    artifactHashes: {
      rekaKarbonAbi: getArtifactAbiHash('RekaKarbon'),
      emissionReportRegistryAbi: getArtifactAbiHash('EmissionReportRegistry'),
      rekaKarbonRuntimeBytecode: keccak256(rekaCode),
      emissionReportRegistryRuntimeBytecode: keccak256(registryCode),
    },
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(deploymentInfo, null, 2)}\n`, 'utf8');
  console.log(`✅ Deployment manifest disimpan ke: ${manifestPath}`);
  console.log('=======================================================\n');
}

main().catch((error: unknown) => {
  console.error('❌ Terjadi kesalahan saat deployment:');
  console.error(error);
  process.exitCode = 1;
});
