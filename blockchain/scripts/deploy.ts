import hardhat from 'hardhat';
import fs from 'fs';
import path from 'path';

const { ethers } = hardhat;

async function main(): Promise<void> {
  console.log('Memulai proses deployment RekaKarbon...');

  const [deployer] = await ethers.getSigners();

  console.log('Deploying contract menggunakan akun:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Saldo ETH Akun Deployer:', ethers.formatEther(balance));
  const transactionOverrides = { gasPrice: 0 };

  const RekaKarbon = await ethers.getContractFactory('RekaKarbon');
  const rekaKarbon = await RekaKarbon.deploy(transactionOverrides);

  const EmissionReportRegistry = await ethers.getContractFactory('EmissionReportRegistry');
  const registry = await EmissionReportRegistry.deploy(transactionOverrides);

  console.log('Menunggu proses deployment ke blockchain...');
  await rekaKarbon.waitForDeployment();
  await registry.waitForDeployment();

  const rekaKarbonAddress = await rekaKarbon.getAddress();
  const registryAddress = await registry.getAddress();

  console.log('\n=======================================================');
  console.log('✅ DEPLOYMENT BERHASIL!');
  console.log('✅ RekaKarbon Contract Address:', rekaKarbonAddress);
  console.log('✅ EmissionReportRegistry Address:', registryAddress);

  // 1. SETUP ROLES UNTUK BACKEND
  console.log('\nMemproses pengaturan otorisasi (Roles)...');
  const ORACLE_ROLE: string = await rekaKarbon.ORACLE_ROLE();
  const DEPOSIT_ROLE: string = await rekaKarbon.DEPOSIT_ROLE();
  const AUDITOR_ROLE: string = await registry.AUDITOR_ROLE();

  await rekaKarbon.grantRole(ORACLE_ROLE, deployer.address, transactionOverrides);
  console.log('✅ ORACLE_ROLE (RekaKarbon) diberikan kepada Backend.');

  await rekaKarbon.grantRole(DEPOSIT_ROLE, deployer.address, transactionOverrides);
  console.log('✅ DEPOSIT_ROLE (RekaKarbon) diberikan kepada Backend.');

  await registry.grantRole(AUDITOR_ROLE, deployer.address, transactionOverrides);
  console.log('✅ AUDITOR_ROLE (EmissionReportRegistry) diberikan kepada Backend.');

  // 2. SIMPAN CONTRACT ADDRESS KE FILE JSON
  const deploymentInfo = {
    rekaKarbonAddress: rekaKarbonAddress,
    emissionReportRegistryAddress: registryAddress,
    network: 'besu_dev',
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const filePath = path.join(process.cwd(), 'deployment-info.json');
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Informasi deployment disimpan ke: ${filePath}`);
  console.log('=======================================================\n');
}

main().catch((error: unknown) => {
  console.error('❌ Terjadi kesalahan saat deployment:');
  console.error(error);
  process.exitCode = 1;
});
