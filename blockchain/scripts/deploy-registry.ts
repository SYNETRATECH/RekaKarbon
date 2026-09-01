import hardhat from 'hardhat';

const { ethers } = hardhat;

async function main(): Promise<void> {
  console.log('Memulai deployment EmissionReportRegistry...');

  const [deployer] = await ethers.getSigners();
  const backendAddress = process.env.BACKEND_ADDRESS || deployer.address;
  const transactionOverrides = { gasPrice: 0 };

  const EmissionReportRegistry = await ethers.getContractFactory('EmissionReportRegistry');
  const registry = await EmissionReportRegistry.deploy(transactionOverrides);

  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  const auditorRole: string = await registry.AUDITOR_ROLE();
  const reporterRole: string = await registry.REPORTER_ROLE();

  await registry.grantRole(auditorRole, backendAddress, transactionOverrides);
  await registry.grantRole(reporterRole, backendAddress, transactionOverrides);

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
