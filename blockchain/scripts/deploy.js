import hardhat from 'hardhat';
import fs from 'fs';
import path from 'path';
const { ethers } = hardhat;

async function main() {
  console.log('Memulai proses deployment RekaKarbon...');

  // Mendapatkan daftar akun (signer) dari provider
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contract menggunakan akun:', deployer.address);

  // Mendapatkan balance deployer
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Saldo ETH Akun Deployer:', ethers.formatEther(balance));

  // Mengambil Contract Factory untuk RekaKarbon
  const RekaKarbon = await ethers.getContractFactory('RekaKarbon');

  // Melakukan proses deploy
  const rekaKarbon = await RekaKarbon.deploy();

  console.log('Menunggu proses deployment ke blockchain...');
  await rekaKarbon.waitForDeployment();

  // Mendapatkan alamat contract setelah deploy selesai
  const contractAddress = await rekaKarbon.getAddress();
  console.log('\n=======================================================');
  console.log('✅ DEPLOYMENT BERHASIL!');
  console.log('✅ RekaKarbon Contract Address:', contractAddress);

  // 1. SETUP ROLES UNTUK BACKEND
  console.log('\nMemproses pengaturan otorisasi (Roles)...');
  const ORACLE_ROLE = await rekaKarbon.ORACLE_ROLE();
  // Berikan peran ORACLE (AI) kepada akun deployer (Backend) agar bisa mintOffsetCredit
  await rekaKarbon.grantRole(ORACLE_ROLE, deployer.address);
  console.log('✅ ORACLE_ROLE berhasil diberikan kepada akun Backend (Deployer).');

  // 2. SIMPAN CONTRACT ADDRESS KE FILE JSON (AGAR BACKEND MUDAH BACA)
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: 'besu_dev',
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const filePath = path.join(process.cwd(), 'deployment-info.json');
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Informasi deployment disimpan ke: ${filePath}`);
  console.log('=======================================================\n');
  console.log('=======================================================\n');
}

// Menjalankan fungsi utama
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Terjadi kesalahan saat deployment:');
    console.error(error);
    process.exit(1);
  });
