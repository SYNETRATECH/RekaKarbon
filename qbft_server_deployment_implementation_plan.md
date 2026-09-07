# QBFT Server Deployment — Implementation Plan & Timeline

## 1. Tujuan

Mengubah proses deployment blockchain RekaKarbon dari runtime Besu single-node/legacy menjadi
Hyperledger Besu QBFT chain ID `1338` yang aman, persisten, dapat diverifikasi, dan tidak mereset
ledger pada setiap deployment.

Hardhat tetap digunakan untuk compile, test, dan mengirim transaksi deployment smart contract.
Hardhat tidak digunakan sebagai node, ledger, atau mekanisme konsensus di server.

## Status Implementasi — 7 September 2026

| Fase | Status                                            | Catatan                                                                                                       |
| ---- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 0–1  | Selesai                                           | Baseline node lokal dan konfigurasi repository sudah selaras ke QBFT `1338`.                                  |
| 2    | Implementasi selesai; provisioning server pending | Bootstrap aman tersedia, tetapi harus dijalankan sekali pada server Linux dengan target kosong.               |
| 3    | Implementasi selesai; smoke test server pending   | Compose QBFT memakai shared path, named volume persisten, RPC loopback, dan rollback workflow.                |
| 4    | Selesai lokal                                     | Preflight, compile, test, dan `verify-existing` sudah lulus pada node QBFT aktif.                             |
| 5    | Implementasi selesai; GitHub Environment pending  | Workflow manual/approved sudah divalidasi secara YAML dan statis; belum dijalankan ke server.                 |
| 6    | Selesai pada source                               | Backend chain guard dan endpoint health sudah membaca chain/block aktif; deployment backend menunggu staging. |
| 7    | Pending staging                                   | Membutuhkan server staging, backup, dan simulasi restart/validator failure.                                   |
| 8    | Pending approval                                  | Production cutover tidak dijalankan dalam sesi ini.                                                           |
| 9    | Selesai source docs                               | Runbook bootstrap, deployment, rollback, dan troubleshooting sudah tersedia.                                  |

## 2. Asumsi Awal

1. Target awal adalah satu server yang menjalankan satu bootnode, empat validator QBFT, dan satu
   RPC node melalui Docker Compose.
2. Backend dapat mengakses RPC melalui loopback pada server yang sama atau jaringan privat
   Tailscale. RPC tidak dibuka bebas ke internet.
3. Chain ID produksi/private network yang dipakai adalah `1338` (`0x53a`).
4. Smart contract RekaKarbon dan EmissionReportRegistry tetap dikelola dari package
   `blockchain/`.
5. Validator key dan data ledger harus bertahan lintas deployment.
6. Deployment produksi dijalankan secara manual dengan GitHub Environment approval. Deployment
   otomatis setiap merge hanya menjalankan verifikasi, bukan redeploy contract.

Catatan arsitektur: empat validator pada satu server memberi toleransi terhadap kegagalan proses
validator, tetapi tidak memberi toleransi terhadap kegagalan fisik server. Distribusi validator ke
beberapa server merupakan fase hardening lanjutan dan berada di luar cutover awal ini.

## 3. Temuan Kondisi Saat Ini

| Area                 | Kondisi saat ini                                          | Risiko                                                  |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| Runtime workflow     | Menjalankan satu container `besu-dev-node`                | Bukan QBFT multi-validator                              |
| Consensus/genesis    | Menggunakan genesis Clique chain ID `1337`                | Server dapat membuat ledger yang berbeda                |
| Container lifecycle  | Menghapus container dan volume lama                       | Saldo, transaksi, dan riwayat dapat hilang              |
| Node key             | Private node key tertulis di workflow                     | Kebocoran kredensial dan identitas node                 |
| Hardhat network      | Workflow memakai `besu_local`                             | Network tersebut tidak ada; deploy akan gagal           |
| Hardhat config       | Network aktif bernama `besu_qbft`                         | Sudah sesuai arah target                                |
| Deploy script        | Metadata masih menulis `besu_dev`                         | Manifest deployment menyesatkan                         |
| Gas policy           | Script memaksa `gasPrice: 0`, compose memakai minimum `1` | Transaksi dapat ditolak/berbeda antar-environment       |
| Generated QBFT files | Di-ignore karena mengandung key                           | Tidak akan tersedia dari hasil checkout/SCP             |
| Backend example env  | Masih mencantumkan chain ID `1337`                        | Deployment backend baru dapat menunjuk chain lama       |
| RPC exposure lama    | CORS dan host allowlist `*`                               | RPC berisiko diakses pihak tidak berwenang              |
| Contract deployment  | Selalu deploy ulang                                       | Address berubah dan database/backend bisa tidak sinkron |

## 4. Prinsip Keselamatan Implementasi

1. Tidak menjalankan `docker volume rm`, `docker compose down -v`, truncate, reset, atau reseed.
2. Tidak menyimpan validator key, deployer private key, backend private key, atau `.env` di Git.
3. Memisahkan deployment infrastruktur node dari deployment smart contract.
4. Deployment contract harus eksplisit, manual, dan idempotent.
5. Setiap perubahan melewati validasi chain ID, genesis hash, validator set, block progression,
   contract bytecode, receipt, dan role.
6. Update backend hanya dilakukan setelah deployment manifest tervalidasi.
7. Rollback infrastruktur tidak boleh menghapus named volume.
8. Smart contract yang sudah masuk blockchain tidak dianggap dapat di-rollback; rollback aplikasi
   berarti mengembalikan backend ke manifest contract sebelumnya.

## 5. Arsitektur Target

```text
GitHub Actions
  ├─ CI: typecheck, compile, unit test, compose validation, secret scan
  ├─ Tailscale: jalur privat menuju server
  └─ SSH/SCP: kirim release infrastruktur tanpa private key
           │
           ▼
Server QBFT
  ├─ /opt/rekakarbon/qbft/releases/<release-id>/
  │    ├─ docker-compose.yml
  │    └─ docker-compose.qbft.yml
  ├─ /opt/rekakarbon/qbft/shared/
  │    └─ network/generated/
  │         ├─ .env             (mode 600, tidak dari Git)
  │         ├─ genesis.json     (immutable setelah chain dimulai)
  │         └─ nodes/            (mode 600/700, provisioning sekali)
  ├─ /opt/rekakarbon/qbft/current -> releases/<release-id>
  └─ Docker named volumes       (ledger persisten, tidak dihapus saat deploy)

Docker network
  ├─ qbft-bootnode-1
  ├─ qbft-validator-1
  ├─ qbft-validator-2
  ├─ qbft-validator-3
  ├─ qbft-validator-4
  └─ besu-rpc-1 -> 127.0.0.1:8545 / private interface only

Hardhat deployment client
  └─ mengirim transaksi ke besu-rpc-1 melalui network `besu_qbft`

NestJS backend
  └─ memverifikasi chain ID, contract address, bytecode, dan signer role saat startup
```

## 6. Ruang Lingkup File

### Wajib diubah

- `.github/workflows/deploy-blockchain.yml`
- `blockchain/docker-compose.yml`
- `blockchain/docker-compose.qbft.yml`
- `blockchain/hardhat.config.ts`
- `blockchain/scripts/deploy.ts`
- `blockchain/.env.example`
- `server/.env.example`
- `blockchain/AGENTS.md`

### Wajib ditambahkan

- Script bootstrap QBFT untuk server atau runbook perintah bootstrap yang deterministik.
- Script preflight/health-check QBFT.
- Schema dan validator deployment manifest.
- Runbook deployment, rollback, key recovery, dan incident response.
- Test untuk chain guard dan idempotensi deployment.

### Tidak boleh masuk Git

- Validator/node private key.
- Deployer/backend private key.
- Generated `.env`.
- Database dump.
- Data directory atau Docker volume ledger.
- Deployment manifest lokal yang mengandung state environment sementara.

## 7. Rencana Implementasi Berurutan

### Fase 0 — Konfirmasi keputusan dan baseline

Estimasi: 30–45 menit.

Pekerjaan:

1. Tetapkan nama environment GitHub: `blockchain-staging` dan `blockchain-production`.
2. Konfirmasi alamat/path server, user deployment, jalur Tailscale, dan akses Docker.
3. Konfirmasi bahwa target awal adalah single-host multi-validator.
4. Catat baseline chain lokal: chain ID, block number, validator address, contract address, dan
   runtime bytecode hash.
5. Tentukan apakah chain server merupakan chain baru atau migrasi ledger yang sudah ada.
6. Tetapkan contract manifest yang dianggap aktif oleh backend.

Checkpoint:

- Tidak ada implementasi sebelum chain target dan strategi data disepakati.
- Jika server sudah memiliki ledger bisnis, wajib snapshot sebelum fase berikutnya.

Deliverable:

- Baseline manifest tanpa private key.
- Daftar GitHub secrets dan variables yang dibutuhkan.

### Fase 1 — Selaraskan konfigurasi repository

Estimasi: 45–60 menit.

Pekerjaan:

1. Ubah `server/.env.example` dari `BESU_CHAIN_ID=1337` menjadi `1338`.
2. Perbarui `blockchain/AGENTS.md` agar menyebut Besu/QBFT chain `1338` dan Hardhat sebagai tool,
   bukan runtime.
3. Tandai `blockchain/besu-config/genesis.json` legacy agar tidak digunakan workflow baru, atau
   pindahkan ke folder `legacy/` dalam commit terpisah.
4. Selaraskan nama network menjadi `besu_qbft` di seluruh script dan dokumentasi.
5. Jadikan gas price configurable melalui environment; jangan memaksa nilai yang bertentangan
   dengan node.
6. Pastikan compile dapat berjalan tanpa production private key. Private key hanya diwajibkan saat
   command deployment dijalankan.

Checkpoint:

- `rg` tidak menemukan pemakaian aktif `besu_local`, `besu_dev`, chain `1337`, atau container
  `besu-dev-node` di jalur deployment baru.

Deliverable:

- Konfigurasi repository konsisten dengan QBFT `1338`.

### Fase 2 — Bangun bootstrap QBFT server yang aman

Estimasi: 60–90 menit.

Pekerjaan:

1. Buat script/runbook bootstrap yang hanya boleh dijalankan sekali.
2. Generate genesis QBFT dan empat validator key menggunakan image Besu yang dipin.
3. Generate bootnode dan RPC node key.
4. Verifikasi validator address yang tertanam pada `extraData` genesis.
5. Simpan genesis dan key di `/opt/rekakarbon/qbft/shared/network/generated`, bukan release directory.
6. Terapkan permission:
   - directory key: `700`;
   - private key: `600`;
   - owner: service/deployment user khusus.
7. Buat `.env` server yang memuat `BOOTNODE_ENODE`, versi image, chain ID, dan konfigurasi RPC
   non-rahasia yang relevan.
8. Simpan salinan terenkripsi genesis/key di lokasi recovery di luar repository.

Checkpoint:

- Bootstrap kedua kali harus berhenti jika genesis, key, atau ledger sudah ada.
- Tidak ada private key muncul dalam log GitHub Actions.

Deliverable:

- Persistent shared configuration pada server.
- Recovery package terenkripsi dan checksum.

### Fase 3 — Hardening Docker Compose QBFT

Estimasi: 45–75 menit.

Pekerjaan:

1. Ubah volume mount compose agar membaca genesis/key dari shared server path atau symlink stabil.
2. Pertahankan named volumes untuk setiap node.
3. Tambahkan healthcheck pada RPC node dan validator.
4. Gunakan `restart: unless-stopped` dan dependency condition yang relevan.
5. Batasi RPC ke `127.0.0.1` atau IP Tailscale tertentu.
6. Hilangkan CORS/host allowlist wildcard.
7. Pin versi Besu, jangan mengandalkan `latest`.
8. Samakan gas policy seluruh validator dan RPC node.
9. Tambahkan logging rotation agar disk server tidak penuh.
10. Tambahkan resource limits/reservations sesuai kapasitas server.

Checkpoint:

- `docker compose config` lulus.
- Validator key tidak terdapat dalam release bundle.
- Compose restart tidak mengubah chain ID, genesis hash, atau block history.

Deliverable:

- Compose QBFT production-ready untuk satu host.

### Fase 4 — Refactor script deployment smart contract

Estimasi: 60–90 menit.

Pekerjaan:

1. Verifikasi provider chain ID sama dengan `BESU_CHAIN_ID=1338` sebelum transaksi.
2. Verifikasi signer/deployer address dan saldo native coin.
3. Gunakan `besu_qbft` sebagai nama network.
4. Hilangkan metadata `network: besu_dev`.
5. Buat deployment manifest berisi:
   - schema version;
   - environment;
   - chain ID;
   - RPC fingerprint tanpa credential;
   - deployer address;
   - contract address;
   - deployment transaction hash dan block;
   - runtime bytecode hash;
   - ABI hash;
   - role transaction hash;
   - timestamp dan commit SHA.
6. Tunggu receipt sukses untuk deployment, grant role, dan revenue recipient configuration.
7. Verifikasi ulang semua role menggunakan view call.
8. Tambahkan mode:
   - `verify`: tidak mengirim transaksi;
   - `deploy-new`: eksplisit membuat contract baru;
   - `configure-existing`: hanya mengonfigurasi address yang diberikan.
9. Gagalkan `deploy-new` apabila manifest aktif sudah ada, kecuali flag konfirmasi eksplisit.
10. Tulis manifest secara atomik dan simpan sebagai artifact CI serta file shared server.

Checkpoint:

- Menjalankan mode `verify` berkali-kali tidak mengubah blockchain.
- Menjalankan workflow infrastruktur tidak membuat contract baru.

Deliverable:

- Deployment contract yang dapat diaudit dan tidak mudah terulang tanpa sengaja.

### Fase 5 — Rewrite GitHub Actions workflow

Estimasi: 75–120 menit.

Pekerjaan:

1. Ubah trigger produksi menjadi `workflow_dispatch` dengan GitHub Environment approval.
2. Tambahkan inputs:
   - `environment`: staging/production;
   - `deploy_infrastructure`: boolean;
   - `deploy_contracts`: boolean, default `false`;
   - `expected_chain_id`: default `1338`;
   - `expected_contract_manifest`: opsional untuk verify-only.
3. Tambahkan `concurrency` agar dua deployment blockchain tidak berjalan bersamaan.
4. Tambahkan job `validate`:
   - install `pnpm --frozen-lockfile`;
   - typecheck;
   - compile;
   - test;
   - validate compose;
   - scan repository/bundle untuk private key.
5. Buat release bundle hanya berisi compose, script yang diperlukan, ABI/artifact tervalidasi, dan
   checksum.
6. Hilangkan `rm -rf` target blockchain, `docker volume rm`, dan hardcoded node key.
7. Upload bundle ke release directory baru.
8. Link shared genesis/key/.env tanpa menyalinnya ke release.
9. Jalankan `docker compose pull` dan `docker compose up -d --remove-orphans`; jangan gunakan
   `down -v`.
10. Jalankan preflight dan post-deploy health check.
11. Deployment contract hanya berjalan jika input `deploy_contracts=true` dan approval diberikan.
12. Gunakan command Hardhat dengan network `besu_qbft`.
13. Upload manifest dan diagnostic log yang sudah disanitasi sebagai workflow artifact.
14. Jika health check gagal, kembalikan symlink release compose sebelumnya dan jalankan compose
    lama tanpa menyentuh volume.

Checkpoint:

- Re-run workflow dengan `deploy_contracts=false` tidak mengubah contract address dan block state
  selain block normal jaringan.
- Tidak ada secret tercetak di workflow log.

Deliverable:

- Workflow deployment QBFT yang aman dan repeatable.

### Fase 6 — Sinkronisasi backend

Estimasi: 30–60 menit.

Pekerjaan:

1. Perbarui `BACKEND_ENV`/secret server dengan:
   - `BESU_RPC_URL`;
   - `BESU_CHAIN_ID=1338`;
   - `PRIVATE_KEY` backend;
   - `CARBON_TOKEN_CONTRACT_ADDRESS`;
   - `EMISSION_REGISTRY_CONTRACT_ADDRESS`.
2. Pastikan backend signer memiliki role yang diperlukan.
3. Pastikan contract bytecode hash sama dengan deployment manifest.
4. Deploy backend setelah blockchain health check lulus.
5. Verifikasi endpoint health backend menampilkan target chain yang benar.
6. Jalankan audit konsistensi read-only terhadap PostgreSQL dan QBFT.

Checkpoint:

- Backend menolak startup/write bila chain ID atau bytecode tidak sesuai.
- Tidak ada transaksi bisnis sebelum sinkronisasi manifest selesai.

Deliverable:

- Backend dan QBFT menggunakan sumber kebenaran yang sama.

### Fase 7 — Staging test dan failure simulation

Estimasi: 75–120 menit.

Test wajib:

1. Start jaringan dari kondisi bersih staging.
2. Verifikasi chain ID `1338` dan empat validator.
3. Deploy contract satu kali dan simpan manifest.
4. Restart seluruh container tanpa menghapus volume; saldo dan transaksi harus tetap ada.
5. Matikan satu validator; chain harus tetap menghasilkan block.
6. Hidupkan validator kembali dan pastikan sinkronisasi tercapai.
7. Jalankan ulang workflow infrastruktur; contract address tidak berubah.
8. Jalankan mode verify-only; tidak boleh ada transaksi baru dari deployer.
9. Uji satu top-up, satu pembelian Bursa, dan satu retirement certificate end-to-end.
10. Cocokkan receipt, event, wallet history, database record, dan public certificate verification.
11. Uji health check gagal dengan expected chain ID salah; workflow harus berhenti sebelum deploy.
12. Pastikan RPC tidak dapat diakses dari jaringan publik yang tidak diizinkan.

Checkpoint:

- Seluruh test lulus dua kali berturut-turut.
- Tidak ada data hilang setelah restart/redeploy.

Deliverable:

- Test evidence dan staging sign-off.

### Fase 8 — Production cutover

Estimasi aktif: 45–75 menit. Observation window: 30–60 menit.

Urutan cutover:

1. Aktifkan maintenance window untuk operasi blockchain write.
2. Snapshot database, deployment manifest, shared config, dan Docker volume sesuai prosedur backup.
3. Catat checksum dan uji bahwa backup dapat dibaca.
4. Jalankan preflight server.
5. Deploy release compose QBFT.
6. Tunggu chain health dan block progression.
7. Jalankan verify existing contract atau deploy-new hanya jika memang chain baru.
8. Perbarui backend environment dari manifest tervalidasi.
9. Deploy/restart backend.
10. Jalankan smoke test read-only lalu transaksi nominal kecil.
11. Buka kembali operasi write.
12. Pantau error rate, block production, peer count, pending transactions, dan backend logs selama
    observation window.

Stop condition:

- Chain ID salah.
- Validator kurang dari quorum.
- Block tidak bertambah.
- Genesis hash berubah.
- Contract bytecode/role tidak sesuai.
- Backend menunjuk address lama.
- Ada perbedaan receipt dengan database.

Deliverable:

- Production deployment record dan sign-off.

### Fase 9 — Dokumentasi dan operasional pascadeploy

Estimasi: 30–45 menit.

Pekerjaan:

1. Dokumentasikan start, stop, restart, health check, log inspection, dan disk monitoring.
2. Dokumentasikan penambahan/penggantian validator melalui prosedur governance QBFT.
3. Dokumentasikan backup dan restore key/volume.
4. Dokumentasikan rotasi backend/deployer key tanpa mengganti validator identity.
5. Simpan deployment manifest, commit SHA, dan test evidence.
6. Jadwalkan audit akses RPC dan backup restore berkala.

Deliverable:

- Runbook operasional final.

## 8. Timeline Rekomendasi

| Waktu               | Fase      |   Estimasi | Hasil                           |
| ------------------- | --------- | ---------: | ------------------------------- |
| Hari 1, 09:00–09:45 | Fase 0    |  30–45 mnt | Baseline dan keputusan terkunci |
| Hari 1, 09:45–10:45 | Fase 1    |  45–60 mnt | Konfigurasi repo konsisten      |
| Hari 1, 10:45–12:15 | Fase 2    |  60–90 mnt | Bootstrap aman tersedia         |
| Hari 1, 13:15–14:30 | Fase 3    |  45–75 mnt | Compose production-ready        |
| Hari 1, 14:30–16:00 | Fase 4    |  60–90 mnt | Deploy script idempotent        |
| Hari 2, 09:00–11:00 | Fase 5    | 75–120 mnt | Workflow baru selesai           |
| Hari 2, 11:00–12:00 | Fase 6    |  30–60 mnt | Backend tersinkronisasi         |
| Hari 2, 13:00–15:00 | Fase 7    | 75–120 mnt | Staging sign-off                |
| Hari 2, 15:00–16:15 | Fase 8    |  45–75 mnt | Production cutover              |
| Hari 2, 16:15–17:15 | Observasi |  30–60 mnt | Stabilitas terkonfirmasi        |
| Hari 3, 09:00–09:45 | Fase 9    |  30–45 mnt | Runbook final                   |

Total pekerjaan aktif diperkirakan `8–12 jam`, ditambah observation window. Timeline dapat menjadi
lebih panjang apabila server belum memiliki Docker Compose, Tailscale, firewall rule, disk backup,
atau GitHub Environment approval.

## 9. Strategi Rollback

### Rollback infrastruktur

1. Hentikan release compose yang gagal tanpa opsi `-v`.
2. Arahkan symlink `current` ke release compose sebelumnya.
3. Jalankan `docker compose up -d` dari release sebelumnya.
4. Verifikasi chain ID, genesis hash, block number, validator set, dan contract code.
5. Named volume tidak disentuh.

### Rollback backend

1. Kembalikan symlink backend ke release sebelumnya.
2. Kembalikan shared `.env` ke manifest contract sebelumnya.
3. Restart service dan jalankan health check.

### Deployment contract bermasalah

Transaksi deployment tidak dapat dihapus dari blockchain. Penanganannya:

1. Jangan mengarahkan backend ke address baru.
2. Pertahankan manifest aktif sebelumnya.
3. Investigasi contract baru secara read-only.
4. Jika perlu, deploy versi koreksi melalui approval baru dan manifest baru.

## 10. Secret dan Variable Inventory

| Nama                      | Jenis                     | Lokasi        | Catatan                                      |
| ------------------------- | ------------------------- | ------------- | -------------------------------------------- |
| `BLOCKCHAIN_TS_AUTHKEY`   | GitHub secret             | Actions       | Akses Tailscale CI                           |
| `BLOCKCHAIN_SSH_HOST`     | GitHub secret/variable    | Actions       | Host privat/Tailscale                        |
| `BLOCKCHAIN_SSH_USERNAME` | GitHub secret             | Actions       | User deployment terbatas                     |
| `BLOCKCHAIN_SSH_KEY`      | GitHub secret             | Actions       | Direkomendasikan mengganti password SSH      |
| `BLOCKCHAIN_PRIVATE_KEY`  | GitHub Environment secret | Actions       | Deployer/backend role, tidak untuk validator |
| `BLOCKCHAIN_PROJECT_DIR`  | GitHub variable           | Actions       | Absolute path deployment server              |
| `BESU_RPC_URL`            | Environment variable      | CI/server     | Endpoint privat                              |
| `BESU_CHAIN_ID`           | Environment variable      | CI/server     | Wajib `1338`                                 |
| `QBFT_BESU_IMAGE`         | Server `.env`             | Shared server | Versi image dipin                            |
| `BOOTNODE_ENODE`          | Server `.env`             | Shared server | Bukan private key                            |
| Validator/node key        | File secret               | Server only   | Tidak disimpan di GitHub/Git                 |

Semua secret wajib dimasking. Workflow tidak boleh mencetak `.env`, private key, atau command yang
menyisipkan secret ke log secara eksplisit.

## 11. Verification Matrix

| Gate          | Pemeriksaan                        | Expected result                  |
| ------------- | ---------------------------------- | -------------------------------- |
| Source        | Typecheck, compile, unit test      | Semua lulus                      |
| Compose       | `docker compose config`            | Valid                            |
| Security      | Scan key/secret pada bundle        | Tidak ditemukan                  |
| RPC           | `eth_chainId`                      | `0x53a`                          |
| Consensus     | Validator set                      | Empat validator yang diharapkan  |
| Liveness      | Dua block sample berjarak waktu    | Block number bertambah           |
| Persistence   | Restart tanpa hapus volume         | State tetap                      |
| Contract      | `eth_getCode`                      | Bytecode tersedia                |
| Integrity     | Runtime bytecode hash              | Sama dengan manifest             |
| Authorization | Role view calls                    | Semua role benar                 |
| Backend       | Health target chain                | Chain `1338`, address benar      |
| Business      | Top-up/Bursa/retirement smoke test | Receipt, event, DB, UI konsisten |
| Idempotency   | Re-run infra deploy                | Tidak reset/redeploy contract    |

## 12. Pembagian Commit

Perubahan tidak dibuat dalam satu commit besar. Urutan commit yang disarankan:

1. `docs(blockchain): define qbft server deployment and rollback runbook`
2. `chore(blockchain): align qbft chain configuration and environment examples`
3. `feat(blockchain): add secure qbft bootstrap and health checks`
4. `refactor(blockchain): make contract deployment guarded and idempotent`
5. `ci(blockchain): replace legacy besu deployment with persistent qbft workflow`
6. `chore(server): align backend qbft environment and startup verification`
7. `test(blockchain): add qbft persistence and deployment verification coverage`

Setiap commit harus melewati check yang relevan sebelum lanjut ke fase berikutnya.

## 13. Definition of Done

Implementasi dianggap selesai hanya jika:

1. Workflow tidak lagi menyebut runtime `besu-dev-node`, `besu_local`, `besu_dev`, atau chain
   `1337`.
2. Tidak ada hardcoded private node key di repository/workflow.
3. Deployment tidak pernah menghapus named volume ledger.
4. Server menjalankan bootnode, empat validator, dan satu RPC node QBFT.
5. Chain ID terverifikasi `1338` dan block terus bertambah.
6. Restart serta redeploy compose mempertahankan saldo, transaksi, dan contract address.
7. Contract deployment hanya berjalan melalui approval eksplisit.
8. Deployment manifest tervalidasi dan backend memakai address dari manifest yang sama.
9. RPC hanya tersedia melalui jalur yang diizinkan.
10. Staging test, failure simulation, smoke test bisnis, dan rollback drill lulus.
11. Dokumentasi dan recovery procedure dapat dijalankan oleh operator selain pembuat implementasi.

## 14. Urutan Eksekusi yang Tidak Boleh Dilanggar

```text
Baseline
  -> konfigurasi repository
  -> bootstrap key/genesis server
  -> hardening compose
  -> refactor deploy script
  -> rewrite workflow
  -> staging
  -> snapshot production
  -> deploy infrastructure
  -> verify chain
  -> verify/deploy contract
  -> sync backend
  -> smoke test
  -> observation
  -> documentation/sign-off
```

Tidak boleh melompat langsung ke perubahan workflow sebelum bootstrap, persistent path, secret,
dan rollback strategy tersedia.
