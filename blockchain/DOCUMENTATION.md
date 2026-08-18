# Dokumentasi Infrastruktur Blockchain - RekaKarbon

Dokumen ini menjelaskan arsitektur, proses pengembangan, pengujian, *deployment* otomatis (CI/CD), hingga panduan integrasi ke sistem *backend* (NestJS) untuk ekosistem *Smart Contract* RekaKarbon.

---

## 1. Arsitektur Sistem

Ekosistem *Blockchain* ini dibangun menggunakan komponen-komponen *Enterprise-Grade* berikut:
- **Smart Contract**: Solidity (menggunakan standar `OpenZeppelin v5.0.0`).
- **Development Environment**: Hardhat & Node.js.
- **Blockchain Node**: Hyperledger Besu (`v23.4.4` - LTS).
- **CI/CD Automation**: GitHub Actions.
- **Backend Integration**: NestJS (via `ethers.js` v6).

---

## 2. Setup & Pengembangan Lokal (Hardhat)

### Prasyarat
- Node.js versi 20 atau lebih baru.
- `npm` terinstal di mesin Anda.

### Instalasi
1. Buka terminal pada *root* repositori blockchain.
2. Instal semua dependensi:
   ```bash
   npm ci
   ```

### Kompilasi Smart Contract
Kompilasi kontrak Solidity menjadi bytecode dan menghasilkan file ABI:
```bash
npx hardhat compile
```
> [!NOTE] 
> Kontrak RekaKarbon diatur untuk menargetkan `evmVersion: "paris"` di `hardhat.config.js` untuk memastikan kompatibilitas penuh dengan Hyperledger Besu dev network. Oleh karena itu, kita memaku (*pinning*) OpenZeppelin di `v5.0.0` (versi sebelum instruksi `PUSH0`/`mcopy` yang hanya ada di `cancun`).

---

## 3. Pengujian (Testing)

Sebelum mendeploy ke server, kode wajib diuji secara lokal menggunakan Hardhat Network.
Jalankan perintah pengujian:
```bash
npx hardhat test
```
Ini akan mengeksekusi semua *test-case* (Mocha/Chai) yang berada di dalam folder `test/`.

---

## 4. Konfigurasi Jaringan Hyperledger Besu

Kita menggunakan mode `--network=dev` dari Hyperledger Besu sebagai jaringan privat untuk tahap pengujian dan *staging*.

### Konfigurasi Kritis Besu:
- **Versi Docker**: Menggunakan `hyperledger/besu:23.4.4` (jangan gunakan `latest` untuk menghindari penghapusan fitur *miner* secara sepihak).
- **Chain ID**: `1337`. Hardhat Network dan Besu secara *default* akan tersinkronisasi pada Chain ID ini.
- **Miner Enabled**: `--miner-enabled=true`. Tanpa ini, transaksi akan menyangkut di dalam *mempool* dan tidak pernah dicetak menjadi blok.
- **Gas Price**: `--min-gas-price=0`. Menghindari transaksi gagal karena Hardhat mengirimkan transaksi dengan biaya gas lokal ($0).

---

## 5. Deployment Server & CI/CD Pipeline (GitHub Actions)

Proses *deployment* ke server jarak jauh (VM Ubuntu) sepenuhnya otomatis menggunakan **GitHub Actions**.

### Alur Kerja (Workflow)
Alur kerja terbagi menjadi dua *file* YAML utama:
1. **`ci.yml`**: Berjalan otomatis saat ada perubahan di `main` atau saat *Pull Request*. Mengeksekusi instalasi dan `npx hardhat test`.
2. **`deploy.yml`**: Hanya berjalan **jika `ci.yml` sukses**. Melakukan *deployment* aktual ke server via SSH.

### Teknik Bypass & Optimasi di `deploy.yml`
Untuk menghindari kelumpuhan sistem akibat server GitHub (*codeload*) yang sedang *down* (`Error 429 / 503`), skrip *deployment* dimodifikasi dari penggunaan *plugin action* pihak ketiga menjadi **Native Linux Commands**:
- Menggunakan `sshpass` dan `scp` bawaan Ubuntu/Linux.
- *Environment Variables* dirender dengan baik tanpa terjebak *heredoc quotes* (`<< EOF`).

Proses pada Server saat *Pipeline* Berjalan:
1. Kontainer Besu lama dihapus (beserta volumenya untuk *clean state*).
2. Kontainer Besu baru dijalankan.
3. *Health-check loop* selama maksimal 60 detik memastikan RPC aktif sebelum *deploy* berjalan.
4. Menjalankan *ephemeral* Docker berbasis Node:20 untuk mengeksekusi `npx hardhat run scripts/deploy.js`.

---

## 6. Panduan Integrasi Backend (NestJS)

Setelah kontrak ter-deploy, ia menghasilkan **Contract Address**. Address ini, bersama dengan file **ABI**, akan menjadi "jembatan" bagi *backend* NestJS Anda untuk berinteraksi dengan Blockchain.

### A. Persiapan di NestJS
Instal pustaka Ethers.js di repositori NestJS:
```bash
npm install ethers
```

Tambahkan di `.env` NestJS Anda:
```env
RPC_URL=http://<IP_SERVER_BESU>:8545
CONTRACT_ADDRESS=0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0
PRIVATE_KEY=c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
```

> [!WARNING]
> *Private key* di atas adalah akun dev bawaan Besu (hanya untuk *development*). Di produksi, selalu gunakan *Private Key* dompet perusahaan/admin Anda yang dilindungi kerahasiaannya.

### B. Menyalin ABI
Kopi file JSON yang berada pada `artifacts/contracts/RekaKarbon.sol/RekaKarbon.json` (dari repositori Blockchain) ke dalam proyek NestJS Anda (misal ke direktori `src/blockchain/abi/`).

### C. Implementasi Service Blockchain (TypeScript)

Contoh `blockchain.service.ts` di NestJS:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import * as RekaKarbonABI from './abi/RekaKarbon.json'; // Sesuaikan path

@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  onModuleInit() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      RekaKarbonABI.abi, // Harus menunjuk ke array .abi
      this.wallet,
    );
    console.log('✅ Node terhubung ke Hyperledger Besu');
  }

  // --- Fungsi Membaca Data (View/Pure) ---
  async getTotalSertifikat(): Promise<number> {
    try {
      // Ganti dengan nama fungsi spesifik di RekaKarbon.sol
      const total = await this.contract.totalSertifikat();
      return Number(total);
    } catch (error) {
      console.error("Gagal membaca total sertifikat:", error);
      throw error;
    }
  }

  // --- Fungsi Menulis Data (Transaksi yang Mengubah State) ---
  async terbitkanSertifikat(penerima: string, jumlah: number) {
    try {
      // gasPrice 0 agar tidak ditolak di dev network
      const tx = await this.contract.mint(penerima, jumlah, {
        gasPrice: 0 
      });
      
      // Tunggu transaksi dimasukkan ke blok (konfirmasi)
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Gagal menerbitkan sertifikat:", error);
      throw error;
    }
  }
}
```

### Tips Integrasi Lanjutan:
- **Event Listeners**: Anda dapat menggunakan `this.contract.on("NamaEvent", (arg1, arg2) => {...})` untuk membuat NestJS bereaksi secara *real-time* setiap kali sebuah transaksi selesai diproses oleh Blockchain (berguna untuk memberikan notifikasi WebSockets ke Frontend).
- **Error Handling**: Tangkap *revert message* dari *smart contract* agar dapat dikirim ke *frontend* sebagai HTTP Error 400 (Bad Request).

---
*Dokumentasi ini otomatis dibuat pada: 17 Agustus 2026.*
