# Panduan Integrasi Backend (NestJS) dengan Blockchain RekaKarbon

Dokumen ini ditujukan khusus untuk Tim Backend (NestJS) agar dapat menghubungkan aplikasi dengan *Smart Contract* RekaKarbon yang berjalan di jaringan privat Hyperledger Besu.

---

## 1. Prasyarat & Instalasi
Sistem backend bertindak sebagai *Oracle* (yang berhak mencetak sertifikat karbon) dan berinteraksi langsung dengan Blockchain. Kita menggunakan pustaka **Ethers.js (versi 6)**.

Jalankan perintah ini di root folder proyek NestJS Anda:
```bash
npm install ethers
```

---

## 2. Penyerahan Berkas (Handover)
Mintalah 2 file berikut dari Tim Blockchain, dan letakkan ke dalam folder proyek NestJS Anda (misalnya di `src/blockchain/config/`):
1. **`deployment-info.json`**: Berisi *Contract Address* dan IP server yang aktif.
2. **`RekaKarbon.json`**: Berisi *Application Binary Interface (ABI)*. Ambil dari `artifacts/contracts/RekaKarbon.sol/RekaKarbon.json`.

---

## 3. Konfigurasi Lingkungan (.env)
Tambahkan variabel berikut ke dalam file `.env` di proyek NestJS Anda:
```env
# IP Server Besu (lihat di deployment-info.json)
RPC_URL=http://<IP_SERVER_BESU>:8545

# Alamat Smart Contract yang sudah di-deploy
CONTRACT_ADDRESS=0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0

# Private Key dari akun Deployer (Akun ini sudah memiliki ORACLE_ROLE)
# Jangan gunakan awalan 0x jika tidak diperlukan
PRIVATE_KEY=Dari saya petrus
```

---

## 4. Implementasi `BlockchainService`
Buatlah sebuah *service* di NestJS untuk mengelola koneksi ke RPC dan inisiasi *Smart Contract*.

**File: `src/blockchain/blockchain.service.ts`**
```typescript
import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { ethers } from 'ethers';
import * as RekaKarbonABI from './config/RekaKarbon.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  onModuleInit() {
    try {
      // 1. Konek ke Jaringan Besu
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      
      // 2. Konek ke Wallet (Agar bisa menandatangani transaksi Write)
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      
      // 3. Inisialisasi Contract
      this.contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        RekaKarbonABI.abi, // Menunjuk ke array ABI
        this.wallet,
      );
      
      console.log('✅ [BlockchainService] Berhasil terhubung ke Hyperledger Besu');
    } catch (error) {
      console.error('❌ [BlockchainService] Gagal inisialisasi:', error);
    }
  }

  /**
   * Fungsi READ: Mengecek saldo sertifikat sebuah instansi
   */
  async getCarbonBalance(address: string, tokenId: number): Promise<number> {
    try {
      const balance = await this.contract.balanceOf(address, tokenId);
      return Number(balance);
    } catch (error) {
      throw new InternalServerErrorException(`Gagal membaca saldo: ${error.message}`);
    }
  }

  /**
   * Fungsi WRITE: Mencetak Sertifikat Karbon (Offset Credit)
   * Hanya bisa dipanggil karena backend ini memegang kunci ORACLE_ROLE
   */
  async mintOffsetCredit(toAddress: string, amount: number, coordinates: string): Promise<string> {
    try {
      // Panggil fungsi mintOffsetCredit di Smart Contract
      // Set gasPrice: 0 karena kita di dev network Besu
      const tx = await this.contract.mintOffsetCredit(toAddress, amount, coordinates, {
        gasPrice: 0 
      });
      
      // WAJIB: Tunggu hingga transaksi ditambang ke dalam blok
      const receipt = await tx.wait();
      
      // Mengembalikan Transaction Hash sebagai bukti
      return receipt.hash;
    } catch (error) {
      throw new InternalServerErrorException(`Gagal mencetak sertifikat: ${error.message}`);
    }
  }
}
```

---

## 5. Membuat API Endpoint (Controller)
Gunakan `BlockchainService` di dalam *Controller* agar Frontend bisa mengakses fitur Blockchain melalui HTTP standar.

**File: `src/blockchain/blockchain.controller.ts`**
```typescript
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

@Controller('api/carbon')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('balance/:address/:tokenId')
  async getBalance(
    @Param('address') address: string,
    @Param('tokenId') tokenId: number
  ) {
    const balance = await this.blockchainService.getCarbonBalance(address, tokenId);
    return { success: true, balance };
  }

  @Post('mint')
  async mintCarbon(@Body() body: { targetAddress: string; amount: number; coords: string }) {
    const txHash = await this.blockchainService.mintOffsetCredit(
      body.targetAddress,
      body.amount,
      body.coords
    );
    
    // txHash bisa Anda simpan ke database SQL/MongoDB lokal sebagai log
    return {
      success: true,
      message: 'Sertifikat karbon berhasil diterbitkan di Blockchain!',
      transactionHash: txHash
    };
  }
}
```

---

## 6. Tips Tambahan untuk Tim Backend

1. **Penanganan Waktu (Timeout):** Transaksi *blockchain* (*write*) membutuhkan waktu beberapa detik untuk ditambang (`tx.wait()`). Jika transaksi berat, HTTP Request Anda mungkin terkena *timeout*. Pertimbangkan untuk menggunakan *queue* (misal: Redis/BullMQ) jika antrean pengguna tinggi.
2. **Penyimpanan Transaksi:** *Smart Contract* tidak memiliki *database query* yang fleksibel seperti SQL. Pastikan Anda selalu menyimpan `transactionHash` dan data relevan ke dalam PostgreSQL/MongoDB di backend Anda sebagai catatan sekunder (*indexing*).
3. **Penanganan Revert:** Jika kontrak menolak transaksi (misal: karena status aset sedang di-*freeze*), `ethers.js` akan melempar error. Tangkap error tersebut dan teruskan pesan aslinya ke Frontend.
