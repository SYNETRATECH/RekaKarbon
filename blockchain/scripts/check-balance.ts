import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.CARBON_TOKEN_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const RekaKarbon = await ethers.getContractFactory("RekaKarbon");
  const contract = RekaKarbon.attach(contractAddress);

  // Alamat dompet admin/pengguna lokal yang dipakai di backend
  const address = "0x7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B";

  console.log("=================================================");
  console.log("🔍 MENCARI DATA ASLI DI BLOCKCHAIN (LOCAL NODE)");
  console.log("=================================================\n");

  try {
    const balance = await contract.balanceOf(address, 3);
    console.log("💰 SALDO SAAT INI (STATE KONTRAK):");
    console.log("   Alamat Dompet  :", address);
    console.log("   Token ID       : 3 (RKB_CREDIT)");
    console.log("   Jumlah         :", balance.toString(), "tCO2e / IDR\n");

    console.log("📜 RIWAYAT TRANSAKSI (EVENTS):");
    const filter = contract.filters.TransferSingle(null, ethers.ZeroAddress, address);
    
    // @ts-ignore
    const events = await contract.queryFilter(filter, 0, "latest");

    if (events.length === 0) {
      console.log("   Tidak ada riwayat transaksi ditemukan.");
    }

    for (const event of events) {
      const block = await ethers.provider.getBlock(event.blockNumber);
      const tx = await ethers.provider.getTransaction(event.transactionHash);

      console.log("   📦 Blok Ke-       :", event.blockNumber);
      console.log("   🔗 Hash Transaksi :", event.transactionHash);
      console.log("   👤 Dari (Sender)  :", tx?.from);
      console.log("   ⏰ Waktu (Time)   :", new Date(Number(block?.timestamp) * 1000).toLocaleString("id-ID"));
      console.log("   -------------------------------------------------");
    }
  } catch (error: any) {
    console.error("❌ Gagal membaca blockchain:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
