import hardhat from 'hardhat';
import fs from 'node:fs';
import path from 'node:path';

const { ethers } = hardhat;

type DeploymentMode = 'verify-existing' | 'configure-existing' | 'deploy-new';

interface TransactionRecord {
  label: string;
  hash: string;
  blockNumber: number;
}

interface DeploymentManifest {
  schemaVersion: 2;
  mode: DeploymentMode;
  network: 'besu_qbft';
  chainId: number;
  deployer: string | null;
  commitSha: string | null;
  blockNumber: number;
  contracts: {
    rekaKarbon: { address: string; deployment?: TransactionRecord };
    emissionReportRegistry: { address: string; deployment?: TransactionRecord };
  };
  roleChecks: Record<string, boolean> | null;
  configurationTransactions: TransactionRecord[];
  generatedAt: string;
}

const expectedChainId = parsePositiveBigInt(
  process.env.BESU_CHAIN_ID?.trim() || '1338',
  'BESU_CHAIN_ID'
);
const deploymentMode = parseDeploymentMode(process.env.DEPLOYMENT_MODE || 'verify-existing');
const allowDeployNew = process.env.ALLOW_DEPLOY_NEW === 'true';
const manifestPath = path.resolve(
  process.env.DEPLOYMENT_MANIFEST_PATH?.trim() || 'deployment-info.json'
);
const gasPrice = parseOptionalBigInt(process.env.BESU_GAS_PRICE_WEI, 'BESU_GAS_PRICE_WEI');
const transactionOverrides = gasPrice === undefined ? {} : { gasPrice };

function parsePositiveBigInt(value: string, name: string): bigint {
  if (!/^\d+$/u.test(value)) {
    throw new Error(`${name} harus berupa bilangan bulat positif.`);
  }

  const parsed = BigInt(value);
  if (parsed <= 0n) {
    throw new Error(`${name} harus lebih besar dari nol.`);
  }

  return parsed;
}

function parseOptionalBigInt(value: string | undefined, name: string): bigint | undefined {
  if (!value?.trim()) return undefined;
  return parsePositiveBigInt(value.trim(), name);
}

function parseDeploymentMode(value: string): DeploymentMode {
  if (value === 'verify-existing' || value === 'configure-existing' || value === 'deploy-new') {
    return value;
  }

  throw new Error(
    `DEPLOYMENT_MODE tidak valid: ${value}. Gunakan verify-existing, configure-existing, atau deploy-new.`
  );
}

function requireAddress(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || !ethers.isAddress(value)) {
    throw new Error(`${name} wajib berisi alamat EVM yang valid.`);
  }

  return ethers.getAddress(value);
}

function optionalAddress(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  if (!ethers.isAddress(value)) {
    throw new Error(`${name} bukan alamat EVM yang valid.`);
  }

  return ethers.getAddress(value);
}

async function waitForTransaction(
  label: string,
  transaction: Promise<{ wait: () => Promise<import('ethers').TransactionReceipt | null> }>
): Promise<TransactionRecord> {
  const sent = await transaction;
  const receipt = await sent.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error(`Transaksi ${label} gagal atau receipt tidak tersedia.`);
  }

  return {
    label,
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}

async function verifyBytecode(address: string): Promise<void> {
  const code = await ethers.provider.getCode(address);
  if (code === '0x') {
    throw new Error(`Bytecode contract tidak ditemukan pada ${address}.`);
  }
}

async function getDeployerAddress(): Promise<string | null> {
  if (!process.env.PRIVATE_KEY?.trim()) return null;
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error('PRIVATE_KEY tersedia tetapi signer tidak dapat dibuat.');
  }

  return ethers.getAddress(await deployer.getAddress());
}

async function requireDeployer(): Promise<{
  signer: Awaited<ReturnType<typeof ethers.getSigners>>[number];
  address: string;
}> {
  const [signer] = await ethers.getSigners();
  if (!signer) {
    throw new Error(
      'PRIVATE_KEY wajib diisi untuk mode configure-existing atau deploy-new. Preflight/compile tidak membutuhkannya.'
    );
  }

  return { signer, address: ethers.getAddress(await signer.getAddress()) };
}

async function verifyRoles(
  rekaKarbon: any,
  registry: any,
  actorAddress: string | null
): Promise<Record<string, boolean> | null> {
  if (!actorAddress) return null;

  const [oracleRole, depositRole, marketOperatorRole, auditorRole, reporterRole] =
    await Promise.all([
      rekaKarbon.ORACLE_ROLE(),
      rekaKarbon.DEPOSIT_ROLE(),
      rekaKarbon.MARKET_OPERATOR_ROLE(),
      registry.AUDITOR_ROLE(),
      registry.REPORTER_ROLE(),
    ]);

  return {
    oracle: await rekaKarbon.hasRole(oracleRole, actorAddress),
    deposit: await rekaKarbon.hasRole(depositRole, actorAddress),
    marketOperator: await rekaKarbon.hasRole(marketOperatorRole, actorAddress),
    auditor: await registry.hasRole(auditorRole, actorAddress),
    reporter: await registry.hasRole(reporterRole, actorAddress),
  };
}

async function grantRoleIfMissing(
  contract: any,
  roleName: string,
  role: string,
  actorAddress: string,
  transactions: TransactionRecord[]
): Promise<void> {
  if (await contract.hasRole(role, actorAddress)) return;
  transactions.push(
    await waitForTransaction(
      `grant ${roleName}`,
      contract.grantRole(role, actorAddress, transactionOverrides)
    )
  );
}

async function configureExisting(
  rekaKarbon: any,
  registry: any,
  actorAddress: string
): Promise<TransactionRecord[]> {
  const transactions: TransactionRecord[] = [];
  const [oracleRole, depositRole, marketOperatorRole, auditorRole, reporterRole] =
    await Promise.all([
      rekaKarbon.ORACLE_ROLE(),
      rekaKarbon.DEPOSIT_ROLE(),
      rekaKarbon.MARKET_OPERATOR_ROLE(),
      registry.AUDITOR_ROLE(),
      registry.REPORTER_ROLE(),
    ]);

  await grantRoleIfMissing(rekaKarbon, 'ORACLE_ROLE', oracleRole, actorAddress, transactions);
  await grantRoleIfMissing(rekaKarbon, 'DEPOSIT_ROLE', depositRole, actorAddress, transactions);
  await grantRoleIfMissing(
    rekaKarbon,
    'MARKET_OPERATOR_ROLE',
    marketOperatorRole,
    actorAddress,
    transactions
  );
  await grantRoleIfMissing(registry, 'AUDITOR_ROLE', auditorRole, actorAddress, transactions);
  await grantRoleIfMissing(registry, 'REPORTER_ROLE', reporterRole, actorAddress, transactions);

  const recipients = [
    optionalAddress('BURSA_PLATFORM_RECIPIENT') || actorAddress,
    optionalAddress('BURSA_RESTORATION_RECIPIENT') || actorAddress,
    optionalAddress('BURSA_MAINTENANCE_RECIPIENT') || actorAddress,
    optionalAddress('BURSA_MONITORING_RECIPIENT') || actorAddress,
    optionalAddress('BURSA_BUFFER_RECIPIENT') || actorAddress,
    optionalAddress('BURSA_ENVIRONMENTAL_INTELLIGENCE_RECIPIENT') || actorAddress,
  ];

  const currentRecipients = await Promise.all([
    rekaKarbon.platformRecipient(),
    rekaKarbon.restorationRecipient(),
    rekaKarbon.maintenanceRecipient(),
    rekaKarbon.monitoringRecipient(),
    rekaKarbon.bufferRecipient(),
    rekaKarbon.environmentalIntelligenceRecipient(),
  ]);

  if (
    recipients.some((recipient, index) => recipient !== ethers.getAddress(currentRecipients[index]))
  ) {
    transactions.push(
      await waitForTransaction(
        'configure Bursa revenue recipients',
        rekaKarbon.setBursaRevenueRecipients(...recipients, transactionOverrides)
      )
    );
  }

  return transactions;
}

async function writeManifest(manifest: DeploymentManifest): Promise<void> {
  const directory = path.dirname(manifestPath);
  fs.mkdirSync(directory, { recursive: true });
  const temporaryPath = `${manifestPath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporaryPath, manifestPath);
}

async function main(): Promise<void> {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== expectedChainId) {
    throw new Error(
      `Chain ID tidak sesuai: ${network.chainId.toString()} != ${expectedChainId.toString()}.`
    );
  }

  const deployerAddress = await getDeployerAddress();
  const transactionRecords: TransactionRecord[] = [];
  let rekaKarbonAddress: string;
  let emissionReportRegistryAddress: string;
  let rekaKarbonDeployment: TransactionRecord | undefined;
  let registryDeployment: TransactionRecord | undefined;

  if (deploymentMode === 'deploy-new') {
    if (fs.existsSync(manifestPath) && !allowDeployNew) {
      throw new Error(
        `Manifest deployment sudah ada di ${manifestPath}. Set ALLOW_DEPLOY_NEW=true setelah approval eksplisit untuk deploy-new.`
      );
    }

    const { address: signerAddress } = await requireDeployer();
    if (deployerAddress !== signerAddress) {
      throw new Error('Alamat deployer tidak konsisten dengan PRIVATE_KEY.');
    }

    const RekaKarbon = await ethers.getContractFactory('RekaKarbon');
    const rekaKarbon = await RekaKarbon.deploy(transactionOverrides);
    await rekaKarbon.waitForDeployment();
    const rekaKarbonTransaction = rekaKarbon.deploymentTransaction();
    if (!rekaKarbonTransaction)
      throw new Error('Deployment transaction RekaKarbon tidak tersedia.');
    rekaKarbonDeployment = await waitForTransaction(
      'deploy RekaKarbon',
      Promise.resolve(rekaKarbonTransaction)
    );
    rekaKarbonAddress = await rekaKarbon.getAddress();

    const EmissionReportRegistry = await ethers.getContractFactory('EmissionReportRegistry');
    const registry = await EmissionReportRegistry.deploy(transactionOverrides);
    await registry.waitForDeployment();
    const registryTransaction = registry.deploymentTransaction();
    if (!registryTransaction) throw new Error('Deployment transaction registry tidak tersedia.');
    registryDeployment = await waitForTransaction(
      'deploy EmissionReportRegistry',
      Promise.resolve(registryTransaction)
    );
    emissionReportRegistryAddress = await registry.getAddress();
  } else {
    rekaKarbonAddress = requireAddress('CARBON_TOKEN_CONTRACT_ADDRESS');
    emissionReportRegistryAddress = requireAddress('EMISSION_REGISTRY_CONTRACT_ADDRESS');
  }

  await verifyBytecode(rekaKarbonAddress);
  await verifyBytecode(emissionReportRegistryAddress);

  const rekaKarbon = await ethers.getContractAt('RekaKarbon', rekaKarbonAddress);
  const registry = await ethers.getContractAt(
    'EmissionReportRegistry',
    emissionReportRegistryAddress
  );

  if (deploymentMode === 'configure-existing' || deploymentMode === 'deploy-new') {
    const { address: signerAddress } = await requireDeployer();
    transactionRecords.push(...(await configureExisting(rekaKarbon, registry, signerAddress)));
  }

  const roleChecks = await verifyRoles(rekaKarbon, registry, deployerAddress);
  const roleValues = Object.values(roleChecks || {});
  if (roleValues.some((value) => !value)) {
    throw new Error(`Role verification gagal: ${JSON.stringify(roleChecks)}.`);
  }

  const blockNumber = await ethers.provider.getBlockNumber();
  const manifest: DeploymentManifest = {
    schemaVersion: 2,
    mode: deploymentMode,
    network: 'besu_qbft',
    chainId: Number(network.chainId),
    deployer: deployerAddress,
    commitSha: process.env.GITHUB_SHA?.trim() || null,
    blockNumber,
    contracts: {
      rekaKarbon: {
        address: ethers.getAddress(rekaKarbonAddress),
        deployment: rekaKarbonDeployment,
      },
      emissionReportRegistry: {
        address: ethers.getAddress(emissionReportRegistryAddress),
        deployment: registryDeployment,
      },
    },
    roleChecks,
    configurationTransactions: transactionRecords,
    generatedAt: new Date().toISOString(),
  };

  await writeManifest(manifest);
  console.log('Deployment verification completed.');
  console.log(`Mode: ${deploymentMode}`);
  console.log(`Network: besu_qbft (${network.chainId.toString()})`);
  console.log(`RekaKarbon: ${rekaKarbonAddress}`);
  console.log(`EmissionReportRegistry: ${emissionReportRegistryAddress}`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Configuration transactions: ${transactionRecords.length}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Kesalahan tidak diketahui.';
  console.error(`Deployment gagal: ${message}`);
  process.exitCode = 1;
});
