import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Baca file .env dari folder server
dotenv.config({ path: '../server/.env' });

async function main() {
  const contractAddress = process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Alamat kontrak EMISSION_REGISTRY_CONTRACT_ADDRESS tidak ditemukan di .env");
  }

  console.log("🔍 Mengecek Blockchain (Hardhat Local Node)...");
  console.log("Alamat Kontrak:", contractAddress);

  // Ambil instance contract dari blockchain
  const EmissionReportRegistry = await ethers.getContractFactory("EmissionReportRegistry");
  const registry = EmissionReportRegistry.attach(contractAddress);

  // Ambil ID terbaru dengan mengecek dari ID 10 ke bawah (karena kita tidak tahu ID terakhir)
  let reportId = 1;
  for (let i = 1; i <= 50; i++) {
    const r = await registry.reports(i);
    if (r.reporter !== ethers.ZeroAddress) {
      reportId = i; // Terus update sampai menemukan yang terakhir
    } else {
      break; // Berhenti jika struct kosong
    }
  }
  
  try {
    const report = await registry.reports(reportId);
    
    // Validasi apakah struct ada isinya (jika reporter address kosong, berarti tidak ada)
    if (report.reporter === ethers.ZeroAddress) {
      console.log(`\n❌ Laporan dengan ID ${reportId} belum ada di blockchain.`);
      return;
    }

    console.log("\n✅ Laporan Ditemukan di Blockchain!");
    console.log("=========================================");
    console.log(`ID Laporan       : ${reportId}`);
    console.log(`Tahun Laporan    : ${report.year.toString()}`);
    console.log(`Merkle Root      : ${report.merkleRoot}`);
    console.log(`Timestamp Blok   : ${new Date(Number(report.submissionTime) * 1000).toLocaleString()}`);
    console.log(`Alamat Pengirim  : ${report.reporter}`);
    console.log("=========================================\n");
    console.log("Ini membuktikan bahwa data emisi Anda sudah terkunci (immutable) di dalam jaringan Web3!");
  } catch (error) {
    console.log(`\n❌ Gagal menemukan laporan dengan ID ${reportId}. Pastikan Anda sudah sukses mengklik tombol 'Submit' di website Anda.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
