# Dynamic Wallet History Implementation Plan

Tujuan dari implementasi ini adalah untuk membuat daftar "Riwayat Transaksi Dompet" di halaman Wallet Frontend menjadi 100% dinamis, mengambil data riil dari _event log_ Blockchain (Smart Contract RekaKarbon).

## Proposed Changes

### Backend (Server)

#### [MODIFY] `server/src/blockchain/blockchain.service.ts`

- Menambahkan fungsi `getWalletTransactionHistory(address: string)` yang akan men-query event `TransferSingle` dari Smart Contract RekaKarbon.
- Fungsi ini akan mencari transaksi masuk (_Incoming_, misal dari Minting Top-up) dan transaksi keluar (_Outgoing_, misal pembakaran RKB_CREDIT saat membeli karbon di DEX).
- Mengembalikan array data transaksi yang diurutkan dari yang terbaru (descending).

#### [MODIFY] `server/src/wallet/wallet.service.ts`

- Menambahkan fungsi `getHistory(address: string)` yang memanggil fungsi dari `blockchain.service.ts`.

#### [MODIFY] `server/src/wallet/wallet.controller.ts`

- Menambahkan endpoint `GET /emitter/wallet/history` yang memanggil `WalletService.getHistory(userAddress)`.
- Endpoint ini akan mengembalikan data berupa array transaksi.

---

### Frontend (Client)

#### [NEW] `client/src/types/wallet.types.ts`

- Membuat definisi tipe data TypeScript (Interface) untuk `WalletTransaction` yang berisi id, tipe transaksi (Masuk/Keluar), nominal, tanggal, dan status.

#### [MODIFY] `client/src/repositories/wallet.repository.ts`

- Menambahkan fungsi `getHistory(): Promise<WalletTransaction[]>` yang menembak endpoint `GET /api/v1/emitter/wallet/history`.

#### [MODIFY] `client/src/routes/emitter/wallet.tsx`

- Memperbarui `clientLoader` agar mengambil `balance` sekaligus memanggil `walletRepository.getHistory()`.
- Menghapus HTML Statis (Dummy) di bagian bawah komponen.
- Melakukan _mapping_ array `history` yang dikembalikan dari loader untuk di-render secara dinamis ke layar.
- Mengubah ikon dan warna berdasarkan tipe transaksi (misal: Hijau/Panah Turun untuk pemasukan, Merah/Panah Naik untuk pengeluaran).

## Verification Plan

- Mensimulasikan satu buah transaksi Deposit Xendit baru.
- Membuka halaman Wallet di frontend dan memastikan riwayat transaksi langsung muncul tanpa perlu di-_hardcode_.
- Memastikan format tanggal, angka (Rupiah), dan ikon UI sesuai dengan desain awal.
