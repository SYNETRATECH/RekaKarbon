# Dokumentasi Infrastruktur Blockchain - RekaKarbon

Dokumen ini menjelaskan arsitektur, proses pengembangan, pengujian, _deployment_ otomatis (CI/CD), hingga panduan integrasi ke sistem _backend_ (NestJS) untuk ekosistem _Smart Contract_ RekaKarbon.

---

## 1. Arsitektur Sistem

Ekosistem _Blockchain_ ini dibangun menggunakan komponen-komponen _Enterprise-Grade_ berikut:

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

1. Buka terminal pada _root_ repositori blockchain.
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
> Kontrak RekaKarbon diatur untuk menargetkan `evmVersion: "paris"` di `hardhat.config.js` untuk memastikan kompatibilitas penuh dengan Hyperledger Besu dev network. Oleh karena itu, kita memaku (_pinning_) OpenZeppelin di `v5.0.0` (versi sebelum instruksi `PUSH0`/`mcopy` yang hanya ada di `cancun`).

---

## 3. Pengujian (Testing)

Sebelum mendeploy ke server, kode wajib diuji secara lokal menggunakan Hardhat Network.
Jalankan perintah pengujian:

```bash
npx hardhat test
```

Ini akan mengeksekusi semua _test-case_ (Mocha/Chai) yang berada di dalam folder `test/`.

---

## 4. Konfigurasi Jaringan Hyperledger Besu

Kita menggunakan mode `--network=dev` dari Hyperledger Besu sebagai jaringan privat untuk tahap pengujian dan _staging_.

### Konfigurasi Kritis Besu:

- **Versi Docker**: Menggunakan `hyperledger/besu:23.4.4` (jangan gunakan `latest` untuk menghindari penghapusan fitur _miner_ secara sepihak).
- **Chain ID**: `1337`. Hardhat Network dan Besu secara _default_ akan tersinkronisasi pada Chain ID ini.
- **Miner Enabled**: `--miner-enabled=true`. Tanpa ini, transaksi akan menyangkut di dalam _mempool_ dan tidak pernah dicetak menjadi blok.
- **Gas Price**: `--min-gas-price=0`. Menghindari transaksi gagal karena Hardhat mengirimkan transaksi dengan biaya gas lokal ($0).

---

## 5. Deployment Server & CI/CD Pipeline (GitHub Actions)

Proses _deployment_ ke server jarak jauh (VM Ubuntu) sepenuhnya otomatis menggunakan **GitHub Actions**.

### Alur Kerja (Workflow)

Alur kerja terbagi menjadi dua _file_ YAML utama:

1. **`ci.yml`**: Berjalan otomatis saat ada perubahan di `main` atau saat _Pull Request_. Mengeksekusi instalasi dan `npx hardhat test`.
2. **`deploy.yml`**: Hanya berjalan **jika `ci.yml` sukses**. Melakukan _deployment_ aktual ke server via SSH.

### Teknik Bypass & Optimasi di `deploy.yml`

Untuk menghindari kelumpuhan sistem akibat server GitHub (_codeload_) yang sedang _down_ (`Error 429 / 503`), skrip _deployment_ dimodifikasi dari penggunaan _plugin action_ pihak ketiga menjadi **Native Linux Commands**:

- Menggunakan `sshpass` dan `scp` bawaan Ubuntu/Linux.
- _Environment Variables_ dirender dengan baik tanpa terjebak _heredoc quotes_ (`<< EOF`).

Proses pada Server saat _Pipeline_ Berjalan:

1. Kontainer Besu lama dihapus (beserta volumenya untuk _clean state_).
2. Kontainer Besu baru dijalankan.
3. _Health-check loop_ selama maksimal 60 detik memastikan RPC aktif sebelum _deploy_ berjalan.
4. Menjalankan _ephemeral_ Docker berbasis Node:20 untuk mengeksekusi `npx hardhat run scripts/deploy.js`.

---

## 6. Panduan Integrasi Backend (NestJS)

Setelah kontrak ter-deploy, ia menghasilkan **Contract Address**. Address ini, bersama dengan file **ABI**, akan menjadi "jembatan" bagi _backend_ NestJS Anda untuk berinteraksi dengan Blockchain.

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
> _Private key_ di atas adalah akun dev bawaan Besu (hanya untuk _development_). Di produksi, selalu gunakan _Private Key_ dompet perusahaan/admin Anda yang dilindungi kerahasiaannya.

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
      this.wallet
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
      console.error('Gagal membaca total sertifikat:', error);
      throw error;
    }
  }

  // --- Fungsi Menulis Data (Transaksi yang Mengubah State) ---
  async terbitkanSertifikat(penerima: string, jumlah: number) {
    try {
      // gasPrice 0 agar tidak ditolak di dev network
      const tx = await this.contract.mint(penerima, jumlah, {
        gasPrice: 0,
      });

      // Tunggu transaksi dimasukkan ke blok (konfirmasi)
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Gagal menerbitkan sertifikat:', error);
      throw error;
    }
  }
}
```

### Tips Integrasi Lanjutan:

- **Event Listeners**: Anda dapat menggunakan `this.contract.on("NamaEvent", (arg1, arg2) => {...})` untuk membuat NestJS bereaksi secara _real-time_ setiap kali sebuah transaksi selesai diproses oleh Blockchain (berguna untuk memberikan notifikasi WebSockets ke Frontend).
- **Error Handling**: Tangkap _revert message_ dari _smart contract_ agar dapat dikirim ke _frontend_ sebagai HTTP Error 400 (Bad Request).

---

_Dokumentasi ini otomatis dibuat pada: 17 Agustus 2026._
