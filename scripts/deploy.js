import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
    console.log("Memulai proses deployment RekaKarbon...");

    // Mendapatkan daftar akun (signer) dari provider
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contract menggunakan akun:", deployer.address);
    
    // Mendapatkan balance deployer
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Saldo ETH Akun Deployer:", ethers.formatEther(balance));

    // Mengambil Contract Factory untuk RekaKarbon
    const RekaKarbon = await ethers.getContractFactory("RekaKarbon");
    
    // Melakukan proses deploy
    const rekaKarbon = await RekaKarbon.deploy();
    
    console.log("Menunggu proses deployment ke blockchain...");
    await rekaKarbon.waitForDeployment();
    
    // Mendapatkan alamat contract setelah deploy selesai
    const contractAddress = await rekaKarbon.getAddress();
    console.log("\n=======================================================");
    console.log("✅ DEPLOYMENT BERHASIL!");
    console.log("✅ RekaKarbon Contract Address:", contractAddress);
    console.log("=======================================================\n");
}

// Menjalankan fungsi utama
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Terjadi kesalahan saat deployment:");
        console.error(error);
        process.exit(1);
    });
