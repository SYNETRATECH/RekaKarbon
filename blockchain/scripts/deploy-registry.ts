import { ContractTransactionResponse } from 'ethers';
import hardhat from 'hardhat';

const { ethers } = hardhat;
const EXPECTED_CHAIN_ID = Number(process.env.QBFT_CHAIN_ID ?? '1338');

type FeeOverrides = { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } | { gasPrice: bigint };

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
  if (feeData.gasPrice !== null && feeData.gasPrice > 0n) return { gasPrice: feeData.gasPrice };
  throw new Error('Node tidak mengembalikan fee non-zero yang valid. Deployment dibatalkan.');
}

async function waitForReceipt(
  transaction: ContractTransactionResponse,
  label: string
): Promise<void> {
  const receipt = await transaction.wait();
  if (!receipt) throw new Error(`Receipt transaksi ${label} tidak tersedia.`);
}

async function main(): Promise<void> {
  if (EXPECTED_CHAIN_ID !== 1338) {
    throw new Error(
      `QBFT_CHAIN_ID harus 1338 untuk deployment local QBFT, bukan ${EXPECTED_CHAIN_ID}.`
    );
  }

  console.log('Memulai deployment EmissionReportRegistry ke local QBFT...');
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== BigInt(EXPECTED_CHAIN_ID)) {
    throw new Error(`Chain ID salah: ${network.chainId} (diharapkan ${EXPECTED_CHAIN_ID}).`);
  }

  const [deployer] = await ethers.getSigners();
  const backendAddress = process.env.BACKEND_ADDRESS?.trim() || deployer.address;
  if (!ethers.isAddress(backendAddress) || backendAddress === ethers.ZeroAddress) {
    throw new Error('BACKEND_ADDRESS bukan alamat EVM yang valid.');
  }
  const transactionOverrides = await getFeeOverrides();
  const EmissionReportRegistry = await ethers.getContractFactory('EmissionReportRegistry');
  const registry = await EmissionReportRegistry.deploy(transactionOverrides);
  const deploymentTransaction = registry.deploymentTransaction();
  if (!deploymentTransaction) throw new Error('Transaksi deployment registry tidak tersedia.');
  await waitForReceipt(deploymentTransaction, 'EmissionReportRegistry deployment');
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  const auditorRole: string = await registry.AUDITOR_ROLE();
  const reporterRole: string = await registry.REPORTER_ROLE();
  await waitForReceipt(
    await registry.grantRole(auditorRole, backendAddress, transactionOverrides),
    'grant AUDITOR_ROLE'
  );
  await waitForReceipt(
    await registry.grantRole(reporterRole, backendAddress, transactionOverrides),
    'grant REPORTER_ROLE'
  );

  if (!(await registry.hasRole(auditorRole, backendAddress))) {
    throw new Error('AUDITOR_ROLE tidak terverifikasi.');
  }
  if (!(await registry.hasRole(reporterRole, backendAddress))) {
    throw new Error('REPORTER_ROLE tidak terverifikasi.');
  }

  console.log('\n=======================================================');
  console.log('✅ EmissionReportRegistry berhasil di-deploy');
  console.log('✅ EmissionReportRegistry Address:', registryAddress);
  console.log('✅ Backend address:', backendAddress);
  console.log('✅ AUDITOR_ROLE dan REPORTER_ROLE diberikan kepada Backend.');
  console.log('=======================================================\n');
}

main().catch((error: unknown) => {
  console.error('❌ Terjadi kesalahan saat deployment registry:');
  console.error(error);
  process.exitCode = 1;
});
