# Rencana Implementasi Integrasi `main` dan QBFT

## Status Eksekusi (checkpoint 8 September 2026)

Branch kerja: `integration/qbft-main-sync` berbasis `origin/main@1d77cee`.

- **Selesai:** baseline/security cleanup, migration widening yang reversible, tooling
  QBFT/preflight/deployment manifest, guard backend chain/bytecode/role, rekonsiliasi
  listing Bursa, deduplikasi history wallet, health probe dinamis, perbaikan frontend
  selektif, dan workflow deploy manual-only berbasis Tailscale + SSH key.
- **Terverifikasi lokal:** blockchain typecheck/compile, 34 smart-contract tests, Prisma
  schema validate, Prettier, YAML workflow parse, dan syntax transpile file TS/TSX yang
  diubah.
- **Tertunda karena lingkungan:** server lint/typecheck/Jest dan client build/typecheck
  penuh menunggu dependency workspace dapat dipasang tanpa mengganggu proses `server:dev`
  yang sedang aktif.
- **Belum dieksekusi:** bootstrap/cutover VM QBFT, deployment kontrak staging/produksi,
  restart backend di VM, dan top-up Rp700.000.000.000. Semua memerlukan approval
  environment, secret runtime, alamat kontrak/wallet, serta bukti health staging.

Checkpoint ini tidak mengubah `main`, `dev/blockchain(V2)`, database, atau VM remote.

## 1. Tujuan

Dokumen ini menjadi urutan kerja resmi untuk menggabungkan perubahan QBFT dari
`dev/blockchain(V2)` dengan aplikasi terbaru di `main`, tanpa mengembalikan tampilan
Regulator ke versi lama, tanpa merusak kontrak API, dan tanpa memutus keterhubungan
database, backend, frontend, serta blockchain.

Hasil akhir yang dituju:

1. Tampilan dan alur Regulator/Auditor terbaru dari `main` tetap utuh, termasuk
   **Timeline Pemeriksaan Auditor**.
2. Runtime blockchain menggunakan jaringan private Hyperledger Besu QBFT dengan
   chain ID `1338`.
3. Hardhat hanya digunakan sebagai compiler, test runner, dan deployment tooling;
   Hardhat bukan node/runtime produksi.
4. Transaksi Bursa, penerbitan/pensiun sertifikat, audit laporan, dan penambahan saldo
   mempunyai status database serta bukti transaksi on-chain yang konsisten.
5. Deployment hanya berjalan secara manual melalui tombol GitHub Actions
   `workflow_dispatch`, dilengkapi preflight, verifikasi, dan rollback yang jelas.
6. Tidak ada secret, private key, password, atau berkas `.env` aktual yang masuk ke Git.

## 2. Baseline yang Dikunci

| Komponen                    | Referensi                    | Fungsi                                                                 |
| --------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| Sumber aplikasi terbaru     | `origin/main@1d77cee`        | Basis branch integrasi dan sumber utama UI/fitur terbaru               |
| Sumber perubahan QBFT       | `dev/blockchain(V2)@37f77aa` | Sumber perubahan blockchain, backend settlement, dan perbaikan terkait |
| Merge base                  | `20b225b`                    | Referensi untuk membedakan perubahan kedua jalur                       |
| Runtime lokal terverifikasi | Besu QBFT, chain ID `1338`   | Target perilaku blockchain                                             |
| Runtime server lama         | Legacy chain ID `1337`       | Hanya sumber data/backup; bukan target akhir                           |

Baseline di atas harus dicatat kembali tepat sebelum eksekusi. Jika SHA berubah,
integrasi dihentikan sementara dan dampak commit baru diperiksa lebih dahulu.

## 3. Ruang Lingkup

### 3.1 Termasuk

- Rekonsiliasi source code `main` dengan perubahan QBFT.
- Rekonsiliasi migrasi Prisma dan schema PostgreSQL.
- Infrastruktur Besu QBFT, deployment kontrak, role, manifest alamat, dan health check.
- Integrasi backend untuk blockchain, Bursa, audit laporan emisi, proyek, dan wallet.
- Integrasi frontend untuk perbaikan Bursa, wallet, retire token, profil, dan popup
  sertifikat tanpa menimpa UI Regulator terbaru.
- CI/CD GitHub Actions untuk deployment manual melalui server Tailscale.
- Pengujian unit, kontrak API, integrasi, E2E lokal, staging, dan smoke test produksi.
- Prosedur penambahan saldo Rp700.000.000.000 setelah sistem dinyatakan sehat.

### 3.2 Tidak termasuk

- Force push ke `main`.
- Deploy produksi langsung sebelum seluruh quality gate lulus.
- Menghapus ledger, volume Docker, database, atau container lama sebelum backup dan
  rollback tervalidasi.
- Menyalin seluruh file konflik dari salah satu branch tanpa rekonsiliasi isi.
- Mengubah desain Regulator terbaru kecuali untuk memperbaiki integrasi yang terukur.
- Memasukkan credential produksi ke repository.

## 4. Aturan Sumber Kebenaran

| Area                                | Sumber kebenaran                                             | Aturan integrasi                                                      |
| ----------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| UI Regulator/Auditor                | `origin/main`                                                | Jangan diganti oleh versi `dev/blockchain(V2)`                        |
| Timeline pemeriksaan                | `origin/main` beserta vertical slice client/server/migration | Harus dipindahkan sebagai satu kesatuan bila diperlukan               |
| Infrastruktur/runtime QBFT          | Direkonsiliasi dari kedua branch                             | Pilih hasil akhir melalui review per file, bukan `ours/theirs` massal |
| Perbaikan Bursa/wallet/retire/popup | `37f77aa`, diverifikasi terhadap API terbaru `main`          | Ambil selektif dan sesuaikan dengan tipe terbaru                      |
| API contract                        | Controller/DTO/schema terbaru hasil rekonsiliasi             | Server dan client wajib diuji bersama                                 |
| Database                            | Urutan seluruh migrasi di `main` + migrasi QBFT yang valid   | Tidak boleh mengedit migrasi yang sudah pernah dipakai                |
| Kontrak ter-deploy                  | Receipt + bytecode + address manifest                        | Nilai `.env` bukan bukti deployment                                   |
| Produksi                            | Hasil staging yang telah disetujui                           | Tidak boleh berbeda secara tidak terdokumentasi                       |

## 5. Strategi Branch dan Commit

Integrasi tidak dilakukan dengan `git merge origin/main` pada branch QBFT. Urutan yang
digunakan setelah rencana disetujui:

```text
origin/main@1d77cee
        |
        +-- integration/qbft-main-sync
                 |
                 +-- security cleanup
                 +-- database reconciliation
                 +-- QBFT infrastructure
                 +-- backend integration
                 +-- frontend integration
                 +-- tests and documentation
```

Aturan branch:

1. Buat branch baru dari `origin/main`, bukan dari branch QBFT.
2. Pertahankan `dev/blockchain(V2)@37f77aa` sebagai checkpoint baca-saja.
3. Pindahkan perubahan per kelompok melalui patch/cherry-pick selektif atau implementasi
   ulang terkontrol.
4. Satu commit hanya memuat satu perhatian utama dan harus dapat direview mandiri.
5. Setiap commit wajib lulus pemeriksaan yang relevan sebelum masuk ke fase berikutnya.
6. Jangan memakai `git reset --hard`, force push, atau menyelesaikan semua konflik dengan
   pilihan global `ours`/`theirs`.

Rencana urutan commit:

1. `security: remove tracked local secrets and harden ignores`
2. `db: reconcile inspection and QBFT-related migrations`
3. `blockchain: reconcile QBFT runtime and deployment tooling`
4. `server: integrate QBFT validation and durable settlement`
5. `client: integrate blockchain fixes without regulator regression`
6. `test: cover QBFT API contracts and critical business flows`
7. `ci: harden manual Tailscale deployment and verification`
8. `docs: document operations cutover and rollback`

## 6. Tahapan Implementasi Berurutan

### Fase 0 — Freeze, inventarisasi, dan keputusan arsitektur

**Estimasi:** 2–3 jam
**Tujuan:** memastikan tidak ada target bergerak selama integrasi.

Tindakan:

1. Catat SHA `origin/main`, `dev/blockchain(V2)`, dan merge base.
2. Pastikan kedua branch telah dipush dan working tree bersih.
3. Buat daftar perubahan 49 file dari commit QBFT berdasarkan domain.
4. Bekukan sementara perubahan pada file konflik atau koordinasikan pemiliknya.
5. Putuskan nilai kanonis berikut:
   - domain API produksi;
   - port backend internal dan eksternal;
   - systemd atau container sebagai process manager backend;
   - pola networking backend–Besu;
   - strategi alamat kontrak: deploy baru atau verifikasi address existing;
   - perlakuan ledger chain ID `1337`: arsip saja atau migrasi bisnis off-chain.
6. Buat branch integrasi dari `origin/main`.

**Output:** baseline log, decision record, dan branch integrasi bersih.
**Gate keluar:** seluruh keputusan yang memengaruhi deployment sudah eksplisit.

### Fase 1 — Remediasi keamanan repository

**Estimasi:** 1–2 jam
**Tujuan:** mencegah secret ikut ke branch integrasi atau artefak CI.

Tindakan:

1. Hapus `.gemini/.env` dari tracking Git tanpa menghapus kebutuhan konfigurasi lokal.
2. Tambahkan pola ignore yang tepat untuk `.gemini/.env` dan secret lokal lain.
3. Rotasi/revoke `GEMINI_API_KEY` apabila nilai yang pernah tercatat adalah key aktif.
4. Pindai repository dan diff untuk password, private key, token, IP credential, serta
   mnemonic.
5. Pastikan contoh konfigurasi hanya berisi placeholder di `.env.example`.
6. Tetapkan GitHub Environments/Secrets untuk akses Tailscale, SSH, backend, dan signer.

**Output:** repository bebas secret aktif dan inventaris secret eksternal.
**Gate keluar:** secret scan bersih; key terpapar sudah tidak berlaku.

### Fase 2 — Rekonsiliasi schema dan migrasi database

**Estimasi:** 3–5 jam
**Tujuan:** menghasilkan urutan schema yang mencakup fitur terbaru `main` dan kebutuhan
QBFT tanpa kehilangan data.

Tindakan:

1. Pertahankan seluruh migrasi yang sudah berada di `main`, termasuk Timeline
   Pemeriksaan Auditor dan outbox/operasi blockchain bila tersedia.
2. Review migrasi
   `20260907231000_widen_company_offset_cost` untuk perubahan
   `Decimal(16,2)` menjadi `Decimal(20,2)`.
3. Pastikan setiap migration timestamp unik dan urutannya konsisten.
4. Jangan mengedit migration yang sudah pernah diterapkan; buat migration koreksi baru
   bila ada ketidaksesuaian.
5. Pastikan tipe uang menggunakan `NUMERIC/Decimal`, timestamp menggunakan timezone,
   foreign key mempunyai index, dan rollback aman.
6. Uji terhadap database kosong dan salinan database berisi data.
7. Jalankan Prisma validate, generate, migration status, dan diff schema.

**Output:** schema final, migration forward/rollback, dan bukti uji data.
**Gate keluar:** tidak ada drift, destructive change tak terencana, atau migration gagal.

### Fase 3 — Konfirmasi vertical slice Regulator dan Auditor

**Estimasi:** 3–4 jam
**Tujuan:** memastikan fitur terbaru `main` tidak mengalami regresi ketika backend dan
schema direkonsiliasi.

Area yang diperiksa sebagai satu vertical slice:

- `client/src/routes/regulator/project-editor.tsx`
- tipe, schema, repository, dan mock repository Regulator
- route proyek Auditor dan alur inspeksi
- DTO pembuatan forest project
- inspection mapper dan inspection types
- project service, audit controller/service, dan regulator service
- migration Timeline Pemeriksaan Auditor

Tindakan:

1. Jadikan file UI dari `main` sebagai baseline.
2. Cocokkan setiap field UI dengan schema client, DTO server, mapper, dan kolom database.
3. Pastikan checkpoint, metode, jadwal, batas pengiriman KTH, dan indikator tersimpan dan
   terbaca kembali.
4. Uji create, edit, detail, validasi error, dan tampilan Auditor.
5. Larang perubahan yang menghapus Timeline Pemeriksaan Auditor.

**Output:** fitur Regulator/Auditor terbaru tetap berfungsi end-to-end.
**Gate keluar:** snapshot/manual UI check dan contract test lulus.

### Fase 4 — Rekonsiliasi infrastruktur QBFT

**Estimasi:** 5–7 jam
**Tujuan:** membentuk satu konfigurasi QBFT kanonis yang reproducible untuk lokal,
staging, dan produksi.

File konflik utama yang direview manual:

- `blockchain/.env.example`
- `blockchain/docker-compose.qbft.yml`
- `blockchain/hardhat.config.ts`
- `blockchain/package.json`
- `blockchain/scripts/deploy.ts`
- `blockchain/scripts/deploy-registry.ts`
- dokumentasi dan panduan integrasi blockchain

Tindakan:

1. Tetapkan chain ID `1338`, consensus QBFT, dan jumlah validator target.
2. Satukan strategi generator network dari `main` dengan bootstrap, preflight, dan
   pemeriksaan dari branch QBFT berdasarkan kemampuan, bukan nama file.
3. Pastikan genesis dan validator material dibangkitkan secara deterministik atau
   melalui prosedur terdokumentasi, tetapi private key validator tidak masuk Git.
4. Pisahkan network runtime dari tooling Hardhat.
5. Tetapkan `evmVersion: paris`, ethers v6, Solidity dan OpenZeppelin sesuai governance.
6. Tambahkan readiness/retry untuk RPC dan pemeriksaan block progression.
7. Pastikan deployer memiliki native balance yang cukup sebelum deployment.
8. Deploy/verify kedua kontrak, simpan address manifest, receipt, block number, chain ID,
   dan bytecode hash.
9. Verifikasi seluruh role operasional: `MINISTRY`, `DEPOSIT`, `ORACLE`,
   `MARKET_OPERATOR`, serta role registry `AUDITOR` dan `REPORTER`.
10. Sinkronkan ABI/artifact yang benar ke consumer backend.

**Output:** konfigurasi QBFT tunggal, manifest kontrak, dan preflight idempotent.
**Gate keluar:** empat validator aktif, block bertambah, bytecode cocok, dan role lengkap.

### Fase 5 — Integrasi backend dan konsistensi transaksi

**Estimasi:** 1–1,5 hari
**Tujuan:** memastikan database dan blockchain tidak menghasilkan status palsu atau
setengah selesai.

Area utama:

- `server/src/blockchain/blockchain.service.ts`
- tipe blockchain terpusat
- `server/src/bursa/bursa.service.ts`
- audit laporan emisi
- projects service
- health service
- script audit dan rekonsiliasi settlement

Tindakan:

1. Rekonsiliasi API terbaru `main` dengan validasi chain ID, bytecode, contract address,
   dan role dari branch QBFT.
2. Semua write on-chain harus melewati `assertWriteTarget` atau guard setara.
3. Health check harus memeriksa:
   - RPC terhubung;
   - chain ID `1338`;
   - block bergerak;
   - bytecode kontrak carbon dan registry tersedia;
   - role operasional signer lengkap.
4. Pertahankan error domain yang informatif; jangan mengubah semua chain revert menjadi
   HTTP 400 generik.
5. Validasi dan rekonsiliasi `blockchainListingId` lama agar listing dari chain `1337`
   tidak digunakan di chain `1338`.
6. Gunakan transaksi/outbox/idempotency key untuk proses lintas database–blockchain.
7. Pastikan restart backend tidak menghilangkan status deposit atau settlement pending.
8. Hilangkan fallback wallet/private key Hardhat di environment produksi; konfigurasi
   invalid harus fail-fast.
9. Pastikan seluruh data eksternal diperlakukan sebagai `unknown` lalu diparse ke tipe
   eksplisit; tidak menambah `any` baru.
10. Uji duplicate request, RPC timeout, revert, receipt tertunda, dan retry setelah
    restart.

**Output:** backend type-safe dengan failure semantics dan recovery yang jelas.
**Gate keluar:** unit/integration/API contract tests lulus, termasuk failure simulation.

### Fase 6 — Integrasi frontend tanpa regresi UI

**Estimasi:** 4–6 jam
**Tujuan:** mengambil perbaikan dari QBFT branch tanpa mengembalikan tampilan terbaru
`main` ke versi lama.

Perubahan yang diperiksa selektif:

- `BursaPurchaseModal.tsx`
- `RetireTokenModal.tsx`
- halaman Bursa dan wallet emitter
- profile dan auth store
- popup bukti sertifikat
- schema umum serta utility geodetik

Tindakan:

1. Terapkan hanya perubahan perilaku yang masih relevan terhadap tipe/API terbaru.
2. Pertahankan komponen, route, dan styling Regulator milik `main`.
3. Perbaiki key list wallet agar unik dan stabil meskipun tx hash sama muncul lebih dari
   sekali.
4. Pastikan popup sertifikat responsif, QR terlihat, URL tidak meluber, dan tombol dapat
   digunakan pada viewport desktop/mobile.
5. Tampilkan pesan Bursa berdasarkan error server yang aman, termasuk quote gagal,
   saldo kurang, listing stale, dan settlement on-chain gagal.
6. Terapkan repository pattern; komponen tidak memanggil mock atau fetch langsung.
7. Gunakan tipe terpusat dan formatter IDR/tanggal/tonase yang berlaku.

**Output:** perbaikan frontend terintegrasi tanpa regresi Regulator.
**Gate keluar:** lint, typecheck, unit test, build, dan visual smoke test lulus.

### Fase 7 — Rekonsiliasi CI/CD dan deployment manual

**Estimasi:** 4–6 jam
**Tujuan:** membuat deployment dapat dipicu saat dipilih pengguna dan gagal secara aman.

Tindakan untuk `.github/workflows/deploy-blockchain.yml`:

1. Pertahankan `workflow_dispatch` sebagai trigger utama; jangan auto-deploy setiap push
   ke `main`.
2. Jika `workflow_run` tetap diperlukan, batasi sebagai gate verifikasi dan jangan
   menjalankan deployment tanpa pilihan/approval environment yang eksplisit.
3. Gunakan GitHub Environment protection untuk approval produksi.
4. Sambungkan runner ke Tailscale sebelum SSH ke VM.
5. Gunakan GitHub Secrets/Variables untuk host, user, SSH key, paths, RPC, signer, dan
   konfigurasi; password tidak ditulis di YAML.
6. Tambahkan langkah preflight VM:
   - versi Docker dan Compose;
   - ruang disk dan permission;
   - port yang digunakan;
   - backup dan target directory;
   - ketersediaan network/volume;
   - kompatibilitas compose command pada VM.
7. Tambahkan retry/backoff untuk RPC, block progression, deploy, dan health endpoint.
8. Sinkronkan manifest address kontrak ke konfigurasi backend secara atomik.
9. Restart backend dengan process manager yang diputuskan, kemudian verifikasi health.
10. Simpan deployment summary dan receipt sebagai artifact tanpa secret.

**Output:** workflow manual, auditable, dan mempunyai approval produksi.
**Gate keluar:** dry-run/staging workflow berhasil dari awal hingga smoke test.

### Fase 8 — Quality gate lokal dan staging

**Estimasi:** 0,5–1 hari
**Tujuan:** membuktikan seluruh lapisan kompatibel sebelum PR dan produksi.

Urutan pemeriksaan wajib:

```powershell
pnpm install --frozen-lockfile
pnpm format:check
pnpm client:lint
pnpm server:lint
pnpm client:typecheck
pnpm server:typecheck
pnpm blockchain:typecheck
pnpm client:test
pnpm server:test
pnpm blockchain:test
pnpm test:contracts
pnpm client:build
pnpm server:build
pnpm blockchain:compile
```

Pemeriksaan Prisma:

```powershell
pnpm --filter ./server exec prisma validate
pnpm --filter ./server exec prisma generate
pnpm --filter ./server exec prisma migrate status
```

Skenario E2E minimum:

1. Login setiap role utama.
2. Regulator membuat proyek dengan Timeline Pemeriksaan Auditor.
3. Auditor melihat checkpoint dan memberi keputusan.
4. Emitter mengirim laporan emisi dan keputusan audit tercatat.
5. Listing Bursa dibuat, quote dibaca, dan pembelian diselesaikan on-chain.
6. Wallet menampilkan history unik setelah reload/restart.
7. Token diretirasi dan popup sertifikat serta verifikasi publik bekerja.
8. Simulasi RPC mati, signer salah, contract address salah, duplicate request, dan restart
   backend menghasilkan error/recovery yang diharapkan.

**Output:** laporan test lokal/staging dan daftar anomali nol untuk blocker.
**Gate keluar:** tidak ada test wajib gagal dan tidak ada TypeScript `any` baru.

### Fase 9 — Pull request dan review terkontrol

**Estimasi:** 3–5 jam, di luar waktu tunggu reviewer
**Tujuan:** memastikan hasil integrasi dapat diaudit sebelum masuk `main`.

Tindakan:

1. Buka PR dari branch integrasi ke `main`.
2. Lampirkan source-of-truth matrix, daftar konflik yang diselesaikan, test evidence,
   screenshot UI kritis, schema diff, dan deployment dry-run.
3. Minta review terpisah untuk frontend, backend/database, dan blockchain/DevOps.
4. Seluruh komentar blocker harus selesai; rerun CI setelah perubahan terakhir.
5. Merge menggunakan strategi repository yang disepakati tanpa force push.

**Output:** commit integrasi yang telah direview masuk `main`.
**Gate keluar:** CI hijau dan seluruh approval wajib tersedia.

### Fase 10 — Persiapan dan cutover server

**Estimasi:** 0,5–1 hari dengan maintenance window
**Tujuan:** mengganti runtime legacy secara terukur tanpa kehilangan jalur pemulihan.

Tindakan sebelum cutover:

1. Backup PostgreSQL, konfigurasi backend, address manifest, volume/data Besu lama,
   log, dan daftar container/port.
2. Verifikasi backup dapat dibaca dan catat checksum/lokasi.
3. Siapkan Compose/plugin versi yang dipakai workflow atau sesuaikan workflow dengan
   kemampuan VM yang tervalidasi.
4. Selesaikan konflik port `8545/8546`, tetapi jangan hapus container/volume lama.
5. Deploy QBFT ke path/version directory baru.
6. Verifikasi empat validator, chain ID `1338`, peer connectivity, block progression,
   signer funding, contract bytecode, dan role.
7. Terapkan migration menggunakan `prisma migrate deploy` setelah backup.
8. Update backend secara atomik, restart, lalu periksa `/health` dan endpoint kritis.
9. Deploy frontend dengan URL API produksi yang benar dan verifikasi CORS.

**Output:** aplikasi produksi menggunakan QBFT `1338` dan konfigurasi konsisten.
**Gate keluar:** smoke test lintas frontend–backend–database–QBFT lulus.

### Fase 11 — Penambahan saldo Rp700 miliar

**Estimasi:** 1–2 jam setelah cutover stabil
**Tujuan:** menambah saldo akun yang telah disetujui dengan jejak database dan on-chain.

Prasyarat wajib:

1. Alamat akun target ditetapkan penuh, bukan alamat terpotong dari UI.
2. Otorisasi bisnis untuk nominal Rp700.000.000.000 terdokumentasi.
3. Chain ID, contract address, signer, bytecode, role, gas balance, dan block progression
   sudah lolos preflight.
4. Saldo awal database dan on-chain telah disnapshot.
5. Tidak ada operasi settlement/reconciliation yang masih pending untuk akun tersebut.

Eksekusi:

1. Gunakan script pendanaan terkontrol `fund-wallet-credit.ts` atau service resmi yang
   memberikan idempotency key.
2. Jalankan dry-run/quote dan tampilkan target, nominal, token ID, contract, chain ID,
   serta signer untuk pemeriksaan terakhir.
3. Kirim satu transaksi dan tunggu receipt final; jangan mengulang hanya karena UI belum
   berubah.
4. Rekam tx hash, block number, event, actor, reason, timestamp, dan status database.
5. Verifikasi event `TransferSingle` untuk token/saldo yang benar dan saldo akhir akun.
6. Reload API dan UI; pastikan satu entri history muncul dan tidak terjadi duplicate key.
7. Jalankan audit konsistensi database–blockchain.

**Output:** saldo bertambah tepat Rp700.000.000.000, history tercatat, dan tx dapat
diverifikasi pada private chain.
**Gate keluar:** nilai sebelum + mutasi = nilai sesudah pada database, API, UI, dan chain.

### Fase 12 — Observasi dan penutupan

**Estimasi:** observasi intensif 2–4 jam, dilanjutkan 24 jam
**Tujuan:** memastikan tidak ada kegagalan tertunda.

Pantauan:

- block progression dan validator health;
- error rate backend dan RPC latency;
- operation/outbox yang pending atau failed;
- mismatch listing/saldo/sertifikat;
- konsumsi disk, memory, dan log;
- error CORS, 400/500 Bursa, serta duplicate UI history.

Setelah masa observasi, dokumentasikan versi, SHA, address manifest, migration status,
hasil smoke test, dan keputusan apakah aset legacy dapat dipindahkan ke arsip dingin.

## 7. Timeline Rekomendasi

Estimasi berikut adalah waktu kerja efektif, bukan janji kalender. Waktu dapat bertambah
jika ditemukan drift database, incompatibility VM, atau data legacy yang harus
direkonsiliasi.

| Hari     | Fokus                                        | Hasil yang harus selesai sebelum lanjut                       |
| -------- | -------------------------------------------- | ------------------------------------------------------------- |
| Hari 0   | Persetujuan rencana dan keputusan arsitektur | Domain, port, process manager, dan strategi ledger disepakati |
| Hari 1   | Fase 0–2: baseline, security, database       | Branch integrasi, secret bersih, migration tervalidasi        |
| Hari 2   | Fase 3–4: Regulator vertical slice dan QBFT  | Timeline aman, QBFT reproducible, role/address tervalidasi    |
| Hari 3   | Fase 5: backend                              | Health, Bursa, audit, wallet, dan recovery lulus test         |
| Hari 4   | Fase 6–7: frontend dan CI/CD                 | UI tanpa regresi dan deployment manual siap dry-run           |
| Hari 5   | Fase 8–9: E2E, CI, dan PR review             | Semua quality gate hijau dan PR siap merge                    |
| Hari 6   | Fase 10: staging/production cutover          | Server QBFT `1338` dan aplikasi sehat                         |
| Hari 6–7 | Fase 11–12: saldo dan observasi              | Rp700 miliar tercatat konsisten dan monitoring stabil         |

Total rekomendasi: **5–7 hari kerja efektif**, ditambah waktu review/approval dan
maintenance window. Penambahan saldo tidak boleh dipercepat mendahului cutover dan
quality gate.

## 8. Matriks Verifikasi

| Area       | Bukti minimum                                | Status lulus                         |
| ---------- | -------------------------------------------- | ------------------------------------ |
| Git        | diff terkelompok, tidak ada secret           | Hanya perubahan yang disetujui       |
| Regulator  | screenshot + E2E Timeline Auditor            | Create/read/edit berhasil            |
| Prisma     | validate, status, test DB kosong dan berisi  | Tidak ada drift/data loss            |
| QBFT       | chain ID, validator list, block progression  | `1338`, validator aktif, block maju  |
| Contract   | address manifest, bytecode hash, role matrix | Kedua kontrak dan seluruh role valid |
| Backend    | lint/typecheck/test/build + failure tests    | Semua hijau, error semantics jelas   |
| Frontend   | lint/typecheck/test/build + visual smoke     | Semua hijau, tidak ada regresi UI    |
| API        | contract test client–server                  | Envelope/schema konsisten            |
| Bursa      | quote, buy, receipt, history                 | Satu transaksi konsisten end-to-end  |
| Wallet     | reload/restart test                          | History durable dan key unik         |
| Sertifikat | retire, popup, public verify                 | Receipt dan UI dapat diverifikasi    |
| Deployment | manual workflow + environment approval       | Tidak auto-deploy dari push          |
| Saldo      | before/after + receipt + audit               | Mutasi tepat dan tidak duplikat      |

## 9. Risiko dan Mitigasi

| Risiko                             | Dampak | Mitigasi                                               | Pemicu berhenti                          |
| ---------------------------------- | ------ | ------------------------------------------------------ | ---------------------------------------- |
| UI Regulator tertimpa versi lama   | Tinggi | Branch dari `main`; UI `main` sebagai sumber kebenaran | Timeline hilang atau contract test gagal |
| Migration bertabrakan              | Tinggi | Urutkan migration, test DB clone, backup               | Drift/destructive diff tak terjelaskan   |
| Address/chain salah                | Kritis | Fail-fast chain ID, bytecode, role, manifest           | Chain bukan `1338` atau bytecode kosong  |
| Saldo atau Bursa dobel             | Kritis | Idempotency, receipt lookup, reconciliation            | Request sama menghasilkan dua mutasi     |
| Runtime server tidak kompatibel    | Tinggi | Preflight Docker/Compose/port/process manager          | Tooling wajib tidak tersedia             |
| Secret bocor                       | Kritis | Remove tracking, rotate, scan, GitHub Secrets          | Secret aktif terdeteksi dalam diff/log   |
| Backend sehat semu                 | Tinggi | Health memeriksa registry, role, dan block movement    | Health hijau tetapi write gagal          |
| Ledger lama terhapus               | Kritis | Backup dan side-by-side cutover                        | Backup belum terverifikasi               |
| CORS/API URL salah                 | Sedang | Satu domain kanonis dan smoke browser produksi         | Client memanggil localhost/domain salah  |
| Error generik menyulitkan recovery | Sedang | Domain error dan correlation/idempotency ID            | Penyebab on-chain tidak dapat ditelusuri |

## 10. Strategi Rollback

### 10.1 Source code

- Revert commit integrasi per lapisan; jangan mengubah history bersama.
- Karena commit dipisahkan per domain, frontend/backend/blockchain dapat direvert tanpa
  membatalkan seluruh pekerjaan.

### 10.2 Database

- Ambil backup sebelum migration.
- Gunakan rollback SQL hanya jika telah diuji dan tidak membuang data baru.
- Jika rollback destruktif, pulihkan backup ke instance terpisah lalu lakukan cutover.

### 10.3 Blockchain

- Kontrak yang sudah ter-deploy tidak dihapus; address manifest diarahkan kembali hanya
  ke deployment yang telah diverifikasi.
- Data chain tidak di-rollback seperti database. Untuk transaksi salah, gunakan operasi
  kompensasi yang diotorisasi dan diaudit.
- Container/volume legacy disimpan sampai masa observasi dan persetujuan arsip selesai.

### 10.4 Backend dan frontend

- Simpan release artifact/config versi sebelumnya.
- Rollback backend dan frontend harus tetap menunjuk ke pasangan API/schema yang
  kompatibel.
- Jangan rollback frontend saja bila kontrak API sudah berubah incompatibly.

### 10.5 Penambahan saldo

- Jangan mengirim transaksi kedua untuk “membatalkan”.
- Jika nominal/target salah, hentikan proses, pertahankan seluruh bukti, dan jalankan
  transaksi kompensasi hanya setelah otorisasi bisnis serta verifikasi role.

## 11. Kondisi Stop-the-Line

Pengerjaan wajib berhenti dan tidak masuk fase berikutnya bila salah satu kondisi ini
terjadi:

1. Working tree tidak diketahui sumber perubahannya.
2. SHA baseline berubah tanpa review.
3. Secret aktif ditemukan dalam Git atau log CI.
4. Migration menunjukkan potensi kehilangan data tanpa backup teruji.
5. Chain ID bukan `1338`, block tidak bergerak, validator kurang, atau bytecode tidak
   cocok.
6. Role signer tidak lengkap.
7. UI Timeline Pemeriksaan Auditor hilang atau payload tidak tersimpan.
8. Test wajib, lint, typecheck, build, atau API contract gagal.
9. VM belum mempunyai tooling/networking yang diperlukan workflow.
10. Saldo awal atau alamat akun target belum dapat dipastikan secara penuh.

## 12. Definition of Done

Integrasi dinyatakan selesai hanya jika:

- branch integrasi berbasis `origin/main` dan seluruh perubahan QBFT yang dipilih dapat
  ditelusuri;
- Regulator/Auditor versi terbaru, termasuk Timeline Pemeriksaan Auditor, berjalan;
- tidak ada secret aktif atau fallback private key development di produksi;
- Prisma schema/migration tervalidasi pada database kosong dan salinan data;
- QBFT `1338` mempunyai validator aktif, block bergerak, kontrak valid, dan role lengkap;
- backend, frontend, blockchain, API contract, serta build lulus;
- Bursa, wallet, audit, retire, sertifikat, dan public verification lulus E2E;
- workflow deployment bersifat manual, memakai approval environment, Tailscale, secret,
  preflight, retry, dan post-deploy verification;
- backup dan rollback telah diuji sebelum cutover;
- penambahan saldo Rp700.000.000.000 tercatat satu kali pada database, history, dan
  blockchain;
- observasi pascadeploy tidak menunjukkan mismatch atau operasi tertunda kritis;
- runbook, manifest, hasil test, dan deployment summary telah disimpan.

## 13. Urutan yang Tidak Boleh Dilanggar

```text
Setujui rencana dan keputusan
  -> Kunci baseline
  -> Buat branch dari main
  -> Bersihkan security
  -> Rekonsiliasi database
  -> Lindungi vertical slice Regulator/Auditor
  -> Rekonsiliasi QBFT
  -> Integrasikan backend
  -> Integrasikan frontend
  -> Rekonsiliasi CI/CD
  -> Jalankan seluruh quality gate
  -> Review dan merge PR
  -> Backup server
  -> Staging/cutover QBFT
  -> Deploy backend/frontend
  -> Smoke test
  -> Tambahkan saldo Rp700 miliar
  -> Audit konsistensi
  -> Observasi dan tutup pekerjaan
```

Tidak ada implementasi atau deployment yang boleh melompati gate pada urutan tersebut.
