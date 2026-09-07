# Panduan Pengujian Langsung di Aplikasi: Deteksi Anomali Emisi & Explainable AI (SHAP)

Dokumen ini berisi panduan skenario pengujian langsung (_end-to-end_) pada aplikasi web **RekaKarbon** untuk fitur **Machine Learning GHG Anomaly Detection** dan **Explainable AI (SHAP Feature Attribution)**.

Pengujian dapat dilakukan baik saat aplikasi berjalan dengan **Mock Data** (`VITE_USE_MOCK_DATA=true`) maupun terhubung ke **Backend NestJS + ONNX Engine** (`VITE_USE_MOCK_DATA=false`).

---

## 🚀 Cara Membuka Aplikasi untuk Pengujian

1. **Jalankan Aplikasi:**
   ```bash
   pnpm dev
   ```
2. **Buka Browser:**
   Akses `http://localhost:5173/portal` dan pilih peran **Emiten / Perusahaan Karbon**, atau langsung menuju URL:
   ```text
   http://localhost:5173/emitter/kalkulator
   ```
3. Pilih Sektor Industri (misal: _Manufaktur_, _Semen_, atau _Pulp & Paper_) dan Tahun Pelaporan (misal: _2026_).

---

## 📋 Ringkasan 4 Skenario Pengujian

| Skenario       | Nama Kasus                          | Sektor             | Input Kunci                                                  |    Ekspektasi Status     | Ekspektasi Skor Kepercayaan | Bendera Diagnostik Terpicu                                        |
| :------------- | :---------------------------------- | :----------------- | :----------------------------------------------------------- | :----------------------: | :-------------------------: | :---------------------------------------------------------------- |
| **Skenario 1** | **Laporan Normal / Selaras**        | Manufaktur         | Solar Industri 50.000 L + Listrik PLN 200.000 kWh            | `PASS_VERIFIED` (Hijau)  |       **> 85 / 100**        | _(Tidak ada)_                                                     |
| **Skenario 2** | **Under-reporting & Deviasi Fisik** | Manufaktur         | Solar 500.000 L tapi emisi ditekan/rendah                    | `REJECT_ANOMALY` (Merah) |       **< 60 / 100**        | `UNDER_REPORTING_TERINDIKASI`, `DEVIASI_FISIK_DAN_LAPORAN_TINGGI` |
| **Skenario 3** | **Anomali Indeks Harga Solar DJP**  | Kelapa Sawit (CPO) | Pembelian Solar volume tinggi harga abnormal (< Rp 10.000/L) | `REJECT_ANOMALY` (Merah) |       **< 65 / 100**        | `BIAYA_SOLAR_TIDAK_REALISTIS`                                     |
| **Skenario 4** | **Emisi Proses Dekarbonasi Nihil**  | Semen              | Energi bahan bakar tinggi, tapi emisi klinker tidak dihitung | `REJECT_ANOMALY` (Merah) |       **< 68 / 100**        | `EMISI_PROSES_TIDAK_DILAPORKAN`                                   |

---

## 🔬 Rincian Langkah Tiap Skenario

---

### Skenario 1: Laporan Patuh / Normal (`PASS_VERIFIED`)

Skenario ini memverifikasi bahwa emiten yang melaporkan data pembakaran bahan bakar dan listrik yang wajar sesuai stoikiometri fisik dan harga pasar DJP akan langsung mendapatkan status **Verifikasi Berhasil** (_Pass Verified_).

#### Langkah Input di Halaman Kalkulator:

1. **Sektor Industri**: Pilih `Manufaktur Umum`.
2. **Tahun Pelaporan**: `2026`.
3. **Scope 1 (Pembakaran Stasioner - Bahan Bakar)**:
   - Klik **Tambah Entri Scope 1**.
   - Jenis Aktivitas: `Pembakaran Stasioner (Stationary Combustion)`.
   - Sumber Bahan Bakar: `Minyak Solar / Diesel (BBM Industri)`.
   - Jumlah: `50.000` Liter.
   - _(Emisi terhitung otomatis ~134 tCO2e)_.
4. **Scope 2 (Konsumsi Listrik Tidak Langsung)**:
   - Klik **Tambah Entri Scope 2**.
   - Sumber: `Jaringan Listrik PLN (Jawa-Madura-Bali)`.
   - Jumlah: `200.000` kWh.
   - _(Emisi terhitung otomatis ~156.8 tCO2e)_.
5. Klik tombol **"Hitung & Ajukan Laporan Emisi"** di bagian bawah.

#### Hasil Tampilan UI yang Diharapkan:

- ✅ **Banner Status**: Banner berlatar hijau dengan badge **`PASS VERIFIED (Laporan Selaras)`** dan ikon perisai centang (_ShieldCheck_).
- 📊 **Skor Kepercayaan**: Angka berada di kisaran **88 - 95 / 100** (warna hijau).
- 📉 **Probabilitas Anomali**: Rendah (**< 15%**).
- ⚖️ **Deviasi Stoikiometri**: Deviasi fisik rendah (**< 10%**).
- 📊 **Grafik Batang SHAP (Explainable AI)**:
  - Batang-batang kontribusi berwarna **Hijau Zamrud** (nilai SHAP negatif $\phi < 0$), menandakan faktor bahan bakar dan listrik memperkuat kepatuhan laporan.
- 💬 **Rekomendasi**: Rekomendasi menyatakan laporan telah selaras dengan acuan Panduan Hijau Bank Indonesia dan metodologi ISO 14064-1.
- ⛓️ **Bukti On-Chain**: Merkle Root dan Hash Transaksi Blockchain Ethereum/Besu tercatat.

---

### Skenario 2: Under-reporting & Deviasi Fisik Stoikiometri (`REJECT_ANOMALY`)

Skenario ini menguji kemampuan mesin AI dalam mendeteksi kecurangan pelaporan di mana emiten membakar bahan bakar solar dalam jumlah besar (500.000 Liter), namun menekan angka pelaporan sehingga terjadi jurang pemisah antara hukum kekekalan massa (stoikiometri) dan angka laporan.

#### Langkah Input di Halaman Kalkulator:

1. **Sektor Industri**: Pilih `Manufaktur Umum`.
2. **Scope 1**:
   - Sumber: `Minyak Solar / Diesel (BBM Industri)`.
   - Masukkan Jumlah: `500.000` Liter.
   - _(Secara stoikiometri fisik, 500.000 Liter solar menghasilkan ~1.340 tCO2e)_.
3. **Scope 2**: Kosongkan atau masukkan nilai kecil: `1.000` kWh.
4. **Manipulasi Angka Laporan**: Jika terdapat opsi pengisian total pelaporan, isi nilai yang ditekan drastis (misal `200` tCO2e), atau ajukan entri dengan faktor yang tidak seimbang.
5. Klik **"Hitung & Ajukan Laporan Emisi"**.

#### Hasil Tampilan UI yang Diharapkan:

- ❌ **Banner Status**: Banner berlatar merah lembut dengan badge **`Peringatan Anomali Terdeteksi (REJECT ANOMALY)`** dan ikon perisai peringatan (_ShieldAlert_).
- 📊 **Skor Kepercayaan**: Turun drastis di bawah ambang batas (**< 55 / 100**).
- 📈 **Probabilitas Anomali**: Tinggi (**> 80%**).
- ⚖️ **Deviasi Stoikiometri**: Tinggi (**> 45%**).
- 📊 **Grafik Batang SHAP**:
  - Batang `Rasio Bahan Bakar Scope 1` menonjol berwarna **Merah Mawar** dengan SHAP bernilai positif ($\phi > +0.3$), menandakan faktor inilah pemicu utama anomali.
- 🏷️ **Bendera Diagnostik**: Muncul tag:
  - `UNDER_REPORTING_TERINDIKASI`
  - `DEVIASI_FISIK_DAN_LAPORAN_TINGGI`
- 💬 **Rekomendasi**: Menyuruh emiten memverifikasi dokumen fisik purchase order/delivery order bahan bakar.

---

### Skenario 3: Anomali Harga Solar Pasar DJP e-Faktur (`REJECT_ANOMALY`)

Skenario ini menguji korelasi fiskal AI antara volume BBM dengan indeks harga pasar Direktorat Jenderal Pajak (DJP) (koridor wajar: Rp 16.000 - Rp 25.000/Liter). Pembelian solar industri di luar harga wajar mengindikasikan solar bersubsidi ilegal atau transaksi fiktif.

#### Langkah Input di Halaman Kalkulator:

1. **Sektor Industri**: Pilih `Kelapa Sawit (CPO)` atau `Manufaktur`.
2. **Scope 1**:
   - Sumber: `Minyak Solar / Diesel`.
   - Jumlah: `150.000` Liter.
3. Pada saat simulasi biaya pembelian / faktur pajak, nilai pengeluaran disetel ke harga abnormal (misal e-Faktur mencatat total Rp 375.000.000 yang setara **Rp 2.500/Liter** — jauh di bawah harga keekonomian).
4. Klik **"Hitung & Ajukan Laporan Emisi"**.

#### Hasil Tampilan UI yang Diharapkan:

- ❌ **Banner Status**: `Peringatan Anomali Terdeteksi`.
- 📊 **Skor DJP**: Anjlok di bawah **70.0%**.
- 🏷️ **Bendera Diagnostik**: Muncul tag `BIAYA_SOLAR_TIDAK_REALISTIS`.
- 📊 **Tabel Driver Anomali**: Baris `Indeks Harga Solar DJP` menunjukkan status deviasi `Memicu Anomali` dengan nilai input Rp 2.500/L vs standar benchmark Rp 16.000 - 25.000/L.

---

### Skenario 4: Emisi Proses Klinker Tidak Dilaporkan (`REJECT_ANOMALY`)

Pada industri semen, emisi terbesar berasal dari reaksi kimia kalsinasi batu kapur (dekarbonasi klinker), bukan sekadar pembakaran bahan bakar. AI mendeteksi jika pabrik semen beroperasi tanpa melaporkan emisi proses.

#### Langkah Input di Halaman Kalkulator:

1. **Sektor Industri**: Pilih `Semen (Cement Manufacturing)`.
2. **Scope 1**:
   - Sumber: `Batu Bara (Coal Combustion)`.
   - Jumlah: `30.000.000` kg (30.000 Ton).
3. **Scope 2**:
   - Jumlah: `5.000.000` kWh.
4. **Proses Industri (Kalsinasi Klinker)**: Tidak ada entri emisi proses klinker yang dimasukkan.
5. Klik **"Hitung & Ajukan Laporan Emisi"**.

#### Hasil Tampilan UI yang Diharapkan:

- ❌ **Banner Status**: `Peringatan Anomali Terdeteksi`.
- 🏷️ **Bendera Diagnostik**: Muncul tag `EMISI_PROSES_TIDAK_DILAPORKAN` atau `INTENSITAS_EMISI_TERLALU_RENDAH`.
- 💬 **Rekomendasi**: Rekomendasi menginstruksikan pengisian pos emisi dekarbonasi klinker sesuai SNI/IPCC Guideline untuk industri semen.

---

## 🛠️ Menjalankan Pengujian Otomatis (Automated Testing)

Untuk memvalidasi skenario-skenario di atas secara otomatis dari terminal PowerShell:

```powershell
# 1. Menjalankan pengujian backend laporan & audit ML
pnpm --filter ./server test -- src/reports/reports.service.spec.ts

# 2. Menjalankan pengujian unit XAI AuditResultCard & Repository di frontend
pnpm --filter ./client test -- src/tests/audit-result.test.tsx

# 3. Menjalankan seluruh test suite monorepo
pnpm test:contracts
pnpm server:test
pnpm client:test
```
