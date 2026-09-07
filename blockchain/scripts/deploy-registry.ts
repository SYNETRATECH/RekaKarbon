import hardhat from 'hardhat';

const { ethers } = hardhat;

async function main(): Promise<void> {
  console.log('Memulai deployment EmissionReportRegistry...');

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error('PRIVATE_KEY wajib diisi untuk deployment registry.');
  }

  const network = await ethers.provider.getNetwork();
  const expectedChainId = BigInt(process.env.BESU_CHAIN_ID || '1338');
  if (network.chainId !== expectedChainId) {
    throw new Error(
      `Chain ID tidak sesuai: ${network.chainId.toString()} != ${expectedChainId.toString()}.`
    );
  }

  const backendAddress = process.env.BACKEND_ADDRESS || (await deployer.getAddress());
  const configuredGasPrice = process.env.BESU_GAS_PRICE_WEI?.trim();
  const transactionOverrides = configuredGasPrice ? { gasPrice: BigInt(configuredGasPrice) } : {};

  const EmissionReportRegistry = await ethers.getContractFactory('EmissionReportRegistry');
  const registry = await EmissionReportRegistry.deploy(transactionOverrides);

  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  const auditorRole: string = await registry.AUDITOR_ROLE();
  const reporterRole: string = await registry.REPORTER_ROLE();

  const auditorTransaction = await registry.grantRole(
    auditorRole,
    backendAddress,
    transactionOverrides
  );
  await auditorTransaction.wait();
  const reporterTransaction = await registry.grantRole(
    reporterRole,
    backendAddress,
    transactionOverrides
  );
  await reporterTransaction.wait();

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
