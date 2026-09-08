# Implementasi QBFT dan Deployment RekaKarbon

> **Dokumen sumber aktif.** Dokumen blockchain lama yang masih menyebut Clique, `--network=dev`, chain `1337`, atau gas nol hanya berlaku sebagai arsip dan tidak boleh dijadikan instruksi deployment.

Status: implementasi bertahap — Fase 0–1 dan Fase 4 selesai; Fase 2–3 lulus acceptance gate runtime lokal; Fase 5–6 berjalan dengan outbox PTBAE dan Bursa; listing dan purchase Bursa sudah memiliki persistence/idempotency dasar  
Target pertama: local development, kemudian satu VM VirtualBox sebagai staging  
Target akhir: arsitektur yang dapat dipindahkan ke beberapa VM tanpa mengubah kontrak bisnis

## 1. Sasaran akhir

Membangun jaringan Hyperledger Besu permissioned dengan topologi berikut pada satu mesin untuk development dan satu VM untuk staging:

```text
Docker network privat
├── qbft-bootnode-1
├── qbft-validator-1  ┐
├── qbft-validator-2  │ konsensus QBFT
├── qbft-validator-3  │
├── qbft-validator-4  ┘
├── besu-rpc-1        ← satu-satunya JSON-RPC untuk aplikasi
├── postgres
├── server-api
├── blockchain-worker / relayer
└── client-web        ← opsional; frontend juga boleh berjalan dari Windows
```

Keputusan tetap:

- Konsensus: QBFT.
- Validator: 4 container dengan data volume dan key masing-masing.
- RPC: 1 container non-validator untuk tahap lokal/staging.
- Bootnode: 1 container untuk tahap lokal/staging.
- Chain ID lokal baru: `1338`.
- Chain lama: read-only archive, tidak dihapus.
- Fee: native gas nominal/non-zero.
- UX: pengguna tetap gasless karena transaksi ditandatangani dan dibayar relayer.
- PostgreSQL: canonical business state.
- Blockchain: settlement, ownership, event, serta integrity proof.
- Solidity `0.8.24` dan OpenZeppelin `5.0.0` dipertahankan pada tahap pertama untuk membatasi risiko perubahan.
- Migration Prisma selalu dibuat dengan Prisma CLI, tidak dibuat atau diberi timestamp manual.

## 2. Aturan urutan pengerjaan

1. Satu tahap hanya dimulai setelah acceptance gate tahap sebelumnya lulus.
2. Jangan mencampur perubahan jaringan, kontrak, backend, database, dan CI/CD dalam satu commit besar.
3. Jangan menghapus volume atau data chain lama.
4. Jangan menjalankan migration database sebelum migration tersebut ditinjau.
5. Jangan mengubah alamat kontrak backend sebelum contract deployment dan smoke test berhasil.
6. Jangan mengaktifkan deployment VM sebelum local end-to-end test lulus.
7. Jangan menyebut satu-VM staging sebagai high availability atau production-ready.
8. Semua data API tetap raw; format IDR, tCO2e, tanggal, dan status dilakukan di client.

## 3. Branch dan strategi commit

Gunakan satu branch feature, kemudian pecah pekerjaan menjadi commit yang dapat diuji:

1. `docs: align blockchain governance with qbft architecture`
2. `infra: add local qbft multi-node network`
3. `build: add qbft network generation and verification scripts`
4. `refactor: centralize blockchain fee policy`
5. `feat: add sponsored transaction relayer`
6. `feat: add blockchain outbox and reconciliation persistence`
7. `test: add qbft integration and failure scenarios`
8. `ci: separate blockchain infrastructure and contract deployment`
9. `docs: add vm staging runbook and recovery procedure`

Setiap commit wajib lolos pemeriksaan yang relevan sebelum dilanjutkan. Jangan men-stage perubahan fitur lain yang sedang berada di worktree.

## 4. Tahap implementasi

### Fase 0 — Bekukan keputusan dan selaraskan governance

Tujuan: menghilangkan aturan repository yang bertentangan dengan desain baru.

Pekerjaan:

- Perbarui `blockchain/AGENTS.md`:
  - ganti Besu 23.4.4/Clique dengan Besu modern/QBFT;
  - hapus kewajiban `{ gasPrice: 0 }`;
  - tetapkan bahwa fee berasal dari fee policy atau relayer;
  - bedakan local, staging, dan production;
  - pertahankan OpenZeppelin 5.0.0 terlebih dahulu.
- Tandai `BLOCKCHAIN_IMPLEMENTATION_PLAN.md` lama sebagai historical atau perbarui referensinya agar tidak lagi menjadi petunjuk aktif.
- Catat pilihan Besu image yang dipin menggunakan versi dan digest setelah image diuji.
- Untuk generator konfigurasi lokal, gunakan `QBFT_GENERATOR_IMAGE` yang dipin
  terpisah dari runtime bila release runtime menolak output directory generator.
  Runtime node tetap menggunakan `QBFT_BESU_IMAGE`; kedua image tidak boleh memakai
  tag `latest`.
- Compose lokal memakai IP statis pada network internal (`172.30.0.0/24`) untuk
  `--p2p-host`. Besu modern menolak hostname container sebagai nilai P2P host,
  sementara alamat statis membuat enode bootnode tetap dapat dijangkau oleh semua
  validator.
- Tetapkan environment matrix:

| Environment       |           Chain ID | Topologi                         | Key           | Data                              |
| ----------------- | -----------------: | -------------------------------- | ------------- | --------------------------------- |
| Hardhat unit test |            `31337` | in-process                       | test only     | disposable                        |
| Local QBFT        |             `1338` | 4 validator + 1 RPC + 1 bootnode | dev generated | disposable dengan backup opsional |
| VM staging        | berbeda dari local | topologi sama dalam satu VM      | staging only  | persistent                        |
| Production        |     unik dan final | validator lintas VM              | KMS/HSM       | persistent dan backed up          |

Output:

- Governance baru tidak lagi menyuruh developer memakai chain 1337, Clique, atau gas nol.
- Terdapat satu dokumen sumber kebenaran untuk arsitektur baru.

Acceptance gate:

- Tidak ada instruksi aktif yang saling bertentangan.
- Versi image Besu dan kebijakan fee telah disetujui.

Estimasi: 2–3 jam.

### Fase 1 — Arsipkan chain lama secara aman

Tujuan: menjaga jejak historis sebelum chain ID dan alamat kontrak berubah.

Pekerjaan:

- Catat konfigurasi chain lama:
  - chain ID;
  - block height terakhir;
  - final block hash;
  - genesis hash;
  - daftar alamat kontrak;
  - runtime bytecode hash;
  - daftar role kontrak;
  - saldo dan supply penting.
- Backup:
  - data directory Besu lama;
  - `deployment-info.json` lama;
  - ABI lama;
  - snapshot database yang berkorelasi;
  - konfigurasi environment tanpa menyalin secret ke repository.
- Buat manifest JSON read-only dengan checksum.
- Beri label konfigurasi lama sebagai `legacy-chain-1337`.
- Pastikan compose baru memakai nama project, network, container, dan volume berbeda agar tidak menimpa chain lama.

Larangan:

- Tidak menjalankan `docker compose down -v` pada project lama.
- Tidak menggunakan ulang data directory lama untuk genesis baru.
- Tidak menggunakan transaction hash chain lama pada chain baru tanpa menyimpan legacy chain ID.

Output:

- Arsip chain lama dapat dibuka kembali dalam mode baca-saja.
- Manifest chain lama tersedia untuk migrasi berikutnya.

Acceptance gate:

- Checksum backup tervalidasi.
- Final block dan contract address dapat diverifikasi dari arsip.
- Tidak ada resource baru yang berbagi volume dengan chain lama.

Estimasi: 3–5 jam.

### Fase 2 — Generate jaringan QBFT lokal

Tujuan: menghasilkan genesis dan key jaringan secara deterministik melalui tooling Besu.

Struktur target:

```text
blockchain/
├── networks/
│   ├── local-qbft/
│   │   ├── genesis.json
│   │   ├── static-nodes.json
│   │   ├── permissioned-nodes.json
│   │   ├── bootnode-1/
│   │   ├── validator-1/
│   │   ├── validator-2/
│   │   ├── validator-3/
│   │   ├── validator-4/
│   │   └── rpc-1/
│   └── README.md
├── docker-compose.qbft.yml
└── scripts/network/
```

Catatan keamanan:

- File private key hasil generate tidak boleh di-commit.
- Repository hanya menyimpan template, public key/node ID yang memang dibutuhkan, dan script generator.
- Genesis tidak ditulis manual pada bagian `extraData`; gunakan tooling Besu untuk generate blockchain config.
- Jika hasil generate lokal perlu dibuat ulang, hentikan Compose QBFT terlebih dahulu
  dengan `pnpm network:down`, lalu gunakan `pnpm network:generate:force`. Perintah
  force hanya untuk chain lokal disposable dan mengganti genesis serta key lokal;
  jangan gunakan pada staging atau production.

Parameter awal yang perlu diuji, bukan langsung dianggap final:

- Chain ID: `1338`.
- Consensus: QBFT.
- Validator count: 4.
- Block period awal: 2 detik.
- Request timeout awal: 4 detik.
- Epoch length: mengikuti default/tooling Besu kecuali benchmark menunjukkan kebutuhan lain.
- London aktif.
- Fee market aktif dengan base fee/gas nominal, bukan `zeroBaseFee`.
- Account prefund hanya untuk deployer dan relayer development.

Output:

- Genesis QBFT valid.
- Empat validator memiliki key dan data directory terpisah.
- Bootnode enode dapat dipakai seluruh node.

Acceptance gate:

- Chain ID dari genesis adalah `1338`.
- Empat validator tercantum pada genesis QBFT.
- Tidak ada key lama atau key production di konfigurasi.
- Tidak ada `--network=dev`.

Estimasi: 4–6 jam.

### Fase 3 — Docker Compose multi-node lokal

Tujuan: menjalankan seluruh node dalam satu mesin tanpa membuka validator RPC.

Pekerjaan compose:

- Tambahkan service:
  - `qbft-bootnode-1`;
  - `qbft-validator-1` sampai `qbft-validator-4`;
  - `besu-rpc-1`.
- Buat named volume terpisah untuk setiap node.
- Buat internal Docker network khusus blockchain.
- Hanya `besu-rpc-1` yang memetakan HTTP/WS RPC ke host.
- Validator:
  - RPC HTTP/WS dimatikan atau hanya internal dan tidak dipublikasikan;
  - memakai permissioned peers;
  - mempunyai health check.
- RPC node:
  - bukan validator;
  - API minimal `ETH,NET,WEB3` dan API QBFT yang hanya diperlukan untuk observability;
  - tidak mengekspos `DEBUG`, `ADMIN`, `MINER`, atau `TXPOOL` ke aplikasi;
  - host allowlist dan CORS ditentukan eksplisit.
- Tambahkan startup dependency berbasis health, bukan hanya urutan container.

Script operasional:

- `start-local-qbft`.
- `stop-local-qbft` tanpa menghapus volume.
- `reset-local-qbft` sebagai perintah eksplisit khusus development dengan konfirmasi target.
- `check-network` untuk chain ID, block height, peer count, dan jumlah validator
  yang dikonfigurasi. Validator set final tetap diverifikasi dari genesis/deployment
  manifest karena RPC node non-validator tidak wajib mengekspos namespace QBFT.
- `show-network-status` untuk diagnosis.

Output:

- Satu perintah menjalankan jaringan lokal.
- Aplikasi hanya mengenal URL RPC node.

Acceptance gate:

- Seluruh container healthy.
- Block height terus meningkat.
- Validator set berjumlah empat.
- RPC node memiliki peer ke jaringan.
- Port RPC validator tidak dapat diakses dari host.
- Restart satu container tidak menghapus volume node lain.

Estimasi: 5–8 jam.

### Fase 4 — Perbaiki deployment contract dan fee policy

Tujuan: menghilangkan asumsi free-gas dan membuat deployment dapat diverifikasi.

Pekerjaan:

- Tambahkan network Hardhat baru untuk local QBFT chain `1338`.
- Pertahankan network Hardhat in-process untuk unit test.
- Hilangkan `{ gasPrice: 0 }` dari deployment script.
- Gunakan `provider.getFeeData()` atau fee policy terpusat.
- Tambahkan preflight sebelum deploy:
  - chain ID benar;
  - node tersinkron dan block bertambah;
  - deployer balance cukup;
  - alamat signer benar;
  - contract target belum ada kecuali mode upgrade eksplisit.
- Setelah deploy:
  - tunggu receipt;
  - verifikasi runtime bytecode;
  - grant role dengan transaksi terpisah dan receipt tervalidasi;
  - simpan `chainId`, address, deployment block, tx hash, deployer, ABI hash, dan bytecode hash.
- Artifact deployment per environment tidak boleh saling menimpa.
- Sinkronisasi ABI server dilakukan melalui script yang dapat diverifikasi, bukan copy manual tanpa checksum.

Output:

- Contract dapat dideploy ke QBFT tanpa error minimum gas price.
- Deployment metadata lengkap dan dapat diaudit.

Acceptance gate:

- Semua contract test tetap lulus.
- Deployment dua kali tanpa opsi upgrade ditolak dengan pesan jelas.
- Role matrix hasil deployment sesuai desain.
- Tidak ada `gasPrice: 0` pada folder blockchain aktif.

Estimasi: 5–7 jam.

### Fase 5 — Relayer dan sponsored transaction backend

Tujuan: pengguna tidak membutuhkan native gas, sementara jaringan tetap memakai gas nominal.

Desain:

- Frontend tidak menandatangani transaksi blockchain operasional secara langsung.
- Service bisnis membuat command terverifikasi.
- Blockchain outbox menyimpan command secara atomik.
- Worker/relayer menandatangani, mengirim, dan memantau transaksi.
- Relayer membayar native gas.

Komponen backend:

- `BlockchainFeePolicy`:
  - mengambil fee data;
  - menerapkan max fee cap;
  - menerapkan gas limit cap;
  - memberikan error domain jika fee policy gagal.
- `BlockchainRelayerService`:
  - receiver/contract allowlist;
  - function selector allowlist;
  - chain ID enforcement;
  - nonce serialization;
  - balance threshold;
  - receipt confirmation tracking.
- `BlockchainTransactionWorker`:
  - mengambil outbox job;
  - retry dengan exponential backoff;
  - membedakan retryable dan permanent failure;
  - idempotency key per business action.
- `BlockchainReconciliationService`:
  - membaca receipt/event;
  - mencocokkan state PostgreSQL;
  - menandai mismatch tanpa mengubah saldo secara diam-diam.

Kebijakan transaksi:

- `PENDING`: command tersimpan, belum dibroadcast.
- `SUBMITTED`: tx hash diterima.
- `CONFIRMED`: receipt sukses dan confirmation threshold tercapai.
- `FAILED_RETRYABLE`: RPC timeout, nonce race, atau node unavailable.
- `FAILED_PERMANENT`: revert bisnis, role salah, destination tidak diizinkan.
- `RECONCILIATION_REQUIRED`: state chain dan database berbeda.

API hanya mengekspos status bisnis yang dibutuhkan client dan harus memakai envelope standar:

```json
{
  "success": true,
  "data": {
    "operationId": "uuid",
    "status": "submitted",
    "chainId": 1338,
    "transactionHash": "0x..."
  }
}
```

Output:

- Semua write transaction backend memakai relayer/fee policy yang sama.
- Tidak ada service bisnis yang membuat override gas sendiri.

Acceptance gate:

- User tanpa native balance dapat menyelesaikan workflow melalui backend.
- Relayer dengan saldo di bawah threshold menolak job secara aman dan mengirim alarm.
- Retry tidak menghasilkan dua mint/listing/purchase/retirement.
- Wrong chain ID dan contract address ditolak sebelum broadcast.
- Tidak ada penggunaan TypeScript `any`.

Estimasi: 2–3 hari kerja.

### Fase 6 — Persistence, outbox, dan migration Prisma

Tujuan: memastikan transaksi database dan blockchain dapat dipulihkan.

Model minimum yang perlu dievaluasi:

- `blockchain_operations`:
  - UUID;
  - operation type;
  - aggregate/entity ID;
  - idempotency key unik;
  - chain ID;
  - contract address;
  - function selector/name;
  - payload hash;
  - transaction hash;
  - nonce;
  - block number;
  - status;
  - retry count;
  - last error code/message;
  - submitted/confirmed timestamps.
- `blockchain_reconciliation_findings` jika mismatch membutuhkan audit terpisah.
- Index pada status/next retry, transaction hash, aggregate ID, dan seluruh foreign key.

Standar database:

- UUID untuk primary key.
- `TIMESTAMPTZ` untuk waktu.
- `NUMERIC` untuk unit token/biaya yang memerlukan presisi; jangan gunakan float untuk saldo.
- `TEXT` untuk hash/alamat dengan validasi aplikasi atau check constraint.
- Foreign key wajib memiliki index.
- Migration dibuat dengan:

```powershell
pnpm --filter @rekakarbon/server prisma:migrate:create --name add_blockchain_operation_outbox
```

- Tinjau SQL hasil Prisma sebelum apply.
- Jangan membuat folder migration atau timestamp secara manual.
- Sediakan strategi rollback operasional atau forward-fix yang terdokumentasi sesuai kemampuan Prisma migration.

Output:

- Outbox dapat diproses ulang setelah restart backend.
- Jejak transaksi mencantumkan chain dan contract secara eksplisit.

Acceptance gate:

- `prisma validate`, `prisma generate`, dan migration status lulus.
- Migration dapat diterapkan pada database kosong dan salinan database existing.
- Test membuktikan unique idempotency key mencegah duplicate operation.
- Query worker menggunakan index yang sesuai.

Estimasi: 1–2 hari kerja.

### Fase 7 — Migrasikan seluruh integrasi blockchain bisnis

Tujuan: seluruh workflow RekaKarbon mengikuti jalur relayer yang sama.

Urutan migrasi fitur:

1. Anchoring laporan emisi.
2. Anchoring dan penerbitan PTBAE-PU.
3. Verifikasi proyek dan mint SPE-GRK.
4. Pembuatan/kunci listing.
5. Pembelian dan distribusi dana.
6. Retirement dan penerbitan sertifikat.
7. Freeze/unfreeze dan mekanisme buffer bila digunakan.

Untuk setiap fitur:

- Definisikan command dan idempotency key.
- Definisikan event contract yang menjadi bukti final.
- Simpan operation ID pada entity bisnis.
- Tampilkan status pending/confirmed/failed di client.
- Jangan mengembalikan string UI-formatted dari API.
- Tambahkan unit, integration, dan contract test.
- Pastikan mock repository tetap terpisah dari API repository dan tidak bocor ke production mode.

Output:

- Tidak ada jalur transaksi blockchain legacy di service bisnis.
- UI mampu membedakan proses tersimpan di DB, submitted, dan confirmed.

Acceptance gate:

- Seluruh workflow end-to-end lulus pada local QBFT.
- API schema validation tidak menghasilkan error.
- Restart backend di tengah transaksi dapat dipulihkan oleh worker.
- Contract revert menghasilkan error domain yang dapat dipahami, bukan generic 500.

Estimasi: 2–4 hari kerja, bergantung jumlah jalur legacy yang ditemukan.

### Fase 8 — Pengujian ketahanan dan keamanan lokal

Tujuan: membuktikan jaringan bukan hanya dapat start, tetapi dapat gagal secara terkendali.

Test wajib:

- Matikan validator 1: jaringan tetap membuat blok.
- Restart validator 1: node mengejar block terbaru.
- Matikan dua validator: transaksi berhenti/timeout sesuai QBFT dan alarm aktif.
- Hidupkan kembali quorum: transaksi pulih tanpa duplicate.
- Restart RPC node: backend retry, data outbox tidak hilang.
- Restart backend/worker ketika tx sudah broadcast tetapi receipt belum tersimpan.
- Kirim nonce bersamaan: nonce manager mengurutkan transaksi.
- Kirim destination/function yang tidak diizinkan: relayer menolak sebelum broadcast.
- Habiskan saldo relayer di environment test: sistem berhenti aman dan memberi pesan operasional.
- Uji reorg/finality sesuai karakteristik QBFT.
- Uji backup dan restore satu validator dari data yang benar.
- Uji full workflow audit sampai retirement.

Quality checks:

```powershell
pnpm blockchain:typecheck
pnpm blockchain:compile
pnpm blockchain:test
pnpm server:typecheck
pnpm server:lint
pnpm server:test
pnpm test:contracts
pnpm client:typecheck
pnpm client:lint
pnpm client:test
pnpm format:check
```

Acceptance gate:

- Semua test wajib lulus.
- Tidak ada duplicate financial/token effect.
- Tidak ada secret pada log atau repository.
- Recovery procedure berhasil dijalankan setidaknya sekali.

Estimasi: 1–2 hari kerja.

### Fase 9 — Observability dan operational runbook

Tujuan: operator dapat mengetahui kegagalan sebelum pengguna melaporkannya.

Metric minimum:

- block height dan waktu sejak blok terakhir;
- validator count/participation;
- peer count per node;
- RPC latency dan error rate;
- tx pool dan pending transaction;
- relayer native balance;
- pending nonce;
- jumlah outbox per status;
- retry rate;
- reconciliation mismatch;
- contract revert per function.

Alarm minimum:

- blok tidak bertambah;
- peer validator kurang;
- quorum berisiko;
- RPC unavailable;
- saldo relayer di bawah threshold;
- operation pending terlalu lama;
- retry melonjak;
- reconciliation mismatch ditemukan;
- volume disk node/database mendekati batas.

Runbook minimum:

- start/stop aman;
- restart satu node;
- restore node;
- rotasi relayer key;
- top-up relayer;
- menangani stuck nonce;
- menangani revert;
- menambah/menghapus validator melalui governance;
- upgrade Besu terkoordinasi;
- maintenance mode dan emergency pause.

Acceptance gate:

- Dashboard dan alarm dapat diuji.
- Operator lain dapat mengikuti runbook tanpa penjelasan lisan tambahan.

Estimasi: 1 hari kerja.

### Fase 10 — CI validation

Tujuan: PR memvalidasi code dan artifact tanpa menyentuh chain staging.

Pipeline PR:

- install menggunakan lockfile;
- lint, typecheck, format check;
- compile dan test contract;
- server/client contract tests;
- build artifact kontrak;
- hitung checksum ABI dan bytecode;
- optional integration test dengan ephemeral QBFT network;
- scan image/dependency sesuai kebijakan repository.

Aturan:

- CI PR tidak deploy ke VM.
- CI PR tidak memakai secret staging/production.
- Artifact hasil build diberi version/commit SHA.
- Besu image dan GitHub Actions dipin.

Acceptance gate:

- PR gagal jika ABI backend tidak sinkron.
- PR gagal jika hardcoded gas nol kembali muncul.
- PR gagal jika deployment metadata tidak sesuai schema.

Estimasi: 4–8 jam.

### Fase 11 — CD ke satu VM staging

Tujuan: mempromosikan artifact yang sudah lulus CI ke VM VirtualBox tunggal.

Pisahkan tiga workflow/job:

#### A. Infrastructure deployment

- Manual trigger dan approval.
- Membuat directory persistent yang tervalidasi.
- Menempatkan genesis, public node configuration, dan environment staging.
- Menjalankan bootnode, validator, dan RPC.
- Tidak menghapus volume secara otomatis.
- Hanya digunakan untuk initial provisioning atau perubahan jaringan terencana.

#### B. Contract deployment

- Manual trigger dan approval.
- Menggunakan artifact CI, bukan compile/install ulang ad hoc di VM.
- Menjalankan preflight chain ID, block progression, validator set, RPC, signer balance.
- Deploy/upgrade contract.
- Memverifikasi bytecode dan role.
- Menyimpan deployment manifest sebagai artifact dan secret/config aplikasi.

#### C. Application deployment

- Dapat berjalan setelah merge sesuai kebijakan branch.
- Deploy backend, worker/relayer, dan frontend.
- Menjalankan Prisma migrate deploy.
- Menjalankan health check dan smoke test.
- Tidak membuat ulang genesis, key, validator, volume, atau contract.

Konfigurasi VM:

- Docker volumes persistent dan terpisah.
- Firewall hanya membuka HTTPS aplikasi dan akses administrasi yang diperlukan.
- RPC tidak dibuka ke internet; backend mengakses melalui private Docker network.
- Secret staging berada di secret store atau file host berizin ketat, bukan repository.
- Backup database, node data, genesis, dan deployment manifest dijadwalkan.

Acceptance gate:

- Reboot VM menghidupkan layanan dan mempertahankan state.
- Deploy aplikasi tidak mengubah block history atau contract address.
- Contract deploy membutuhkan approval terpisah.
- Smoke test end-to-end staging lulus.
- Restore rehearsal staging berhasil.

Estimasi: 1–2 hari kerja.

### Fase 12 — Rehearsal dan cutover chain lama

Tujuan: memindahkan state yang disepakati tanpa menghilangkan provenance.

Pekerjaan:

- Tentukan data canonical yang dimigrasikan dari PostgreSQL dan chain lama.
- Buat exporter dan verifier, bukan SQL update manual.
- Buat migration manifest:
  - legacy chain ID/final block hash;
  - database snapshot hash;
  - old/new contract mapping;
  - saldo/supply/listing/retirement totals;
  - record count;
  - Merkle root;
  - signer dan timestamp.
- Jalankan dry run minimal dua kali menggunakan salinan data.
- Cocokkan invariant:
  - total supply;
  - wallet ownership;
  - escrow/listing locked amount;
  - purchased amount;
  - retired amount;
  - reserve/buffer;
  - distribusi dana.
- Freeze write chain lama pada maintenance window.
- Snapshot final, migrasi, anchor manifest, verifikasi, lalu cutover.
- Pertahankan explorer/RPC read-only terbatas untuk chain lama.

Acceptance gate:

- Seluruh invariant seimbang.
- Manifest dapat diverifikasi independen.
- Backend tidak salah mencari hash lama pada chain baru.
- Rollback aplikasi ke maintenance mode telah diuji.

Estimasi: 2–3 hari kerja termasuk dua rehearsal; dilakukan setelah seluruh staging gate lulus.

## 5. Timeline pengerjaan berurutan

Timeline ini berbasis satu developer utama. Jika beberapa orang bekerja paralel, pembagian tetap mengikuti dependency gate.

| Hari/sesi      | Fokus   | Hasil yang wajib selesai               | Boleh lanjut jika                         |
| -------------- | ------- | -------------------------------------- | ----------------------------------------- |
| 1 pagi         | Fase 0  | Governance dan environment matrix      | Tidak ada aturan Clique/gas nol aktif     |
| 1 siang        | Fase 1  | Arsip serta manifest chain lama        | Backup dan checksum valid                 |
| 2              | Fase 2  | Genesis/key QBFT lokal                 | Validator set dan chain ID valid          |
| 3              | Fase 3  | Compose 4 validator + bootnode + RPC   | Semua node healthy dan blok berjalan      |
| 4              | Fase 4  | Deployment contract dan fee policy     | Deploy serta role verification lulus      |
| 5–7            | Fase 5  | Relayer, nonce, fee cap, retry         | Sponsored transaction idempotent          |
| 8              | Fase 6  | Prisma outbox/reconciliation migration | Migration dan persistence test lulus      |
| 9–11           | Fase 7  | Migrasi seluruh workflow bisnis        | E2E audit–mint–listing–buy–retire lulus   |
| 12–13          | Fase 8  | Failure/security test                  | Quorum, restart, retry, restore lulus     |
| 14             | Fase 9  | Monitoring dan runbook                 | Alarm dan recovery dapat didemokan        |
| 15             | Fase 10 | CI validation                          | Artifact reproducible dan PR checks lulus |
| 16–17          | Fase 11 | CD ke satu VM staging                  | Reboot/deploy/smoke/restore lulus         |
| Setelah stabil | Fase 12 | Rehearsal dan cutover                  | Dua dry run dan rekonsiliasi sempurna     |

Estimasi realistis sampai satu VM staging: **sekitar 17 hari kerja untuk satu developer**, belum termasuk security audit eksternal. Waktu dapat lebih singkat jika tidak ada banyak jalur blockchain legacy, tetapi acceptance gate tidak boleh dilewati untuk mengejar jadwal.

## 6. Pembagian kerja jika dikerjakan paralel

Setelah Fase 3 selesai:

- Jalur A — blockchain: deployment script, artifact, contract test.
- Jalur B — backend: relayer, fee policy, outbox, reconciliation.
- Jalur C — DevOps: CI, image, observability, VM runbook.
- Jalur D — frontend: status pending/submitted/confirmed/error melalui repository pattern.

Integrasi jalur hanya dilakukan setelah kontrak data/API dan event contract disepakati. Jangan mengubah ABI dan schema API secara diam-diam pada dua jalur berbeda.

## 7. Definition of done keseluruhan

Implementasi dianggap selesai hanya apabila:

- Local QBFT memiliki empat validator, satu bootnode, dan satu RPC non-validator.
- Chain menggunakan chain ID baru dan tidak memakai `--network=dev`.
- Setiap node memiliki key serta volume terpisah.
- Tidak ada hardcoded `gasPrice: 0`.
- Semua write transaction melewati relayer dan fee policy.
- Outbox, idempotency, retry, receipt tracking, serta reconciliation teruji.
- Contract deployment mempunyai preflight, bytecode verification, role verification, dan manifest.
- Workflow RekaKarbon utama berhasil end-to-end.
- Satu validator dapat mati tanpa menghentikan jaringan.
- VM staging dapat reboot tanpa kehilangan chain/database.
- Deployment aplikasi tidak pernah membangun ulang chain.
- Chain lama dapat diverifikasi read-only.
- Seluruh quality checks monorepo yang relevan lulus.
- Tidak ada `any`, secret, key demo production, atau mock data pada jalur API production.

## 8. Risiko utama dan mitigasi

| Risiko                                        | Mitigasi                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| Worktree saat ini memuat perubahan fitur lain | Gunakan commit kecil, stage berdasarkan path, dan jangan reset perubahan pengguna |
| Governance lama memaksa free gas/Besu lama    | Fase 0 wajib selesai sebelum code berubah                                         |
| Chain baru menimpa volume lama                | Nama project/network/volume baru dan validasi absolute path                       |
| Duplicate mint atau purchase ketika retry     | Outbox, idempotency key, nonce serialization, event reconciliation                |
| Backend tersambung ke chain salah             | Chain ID dan bytecode preflight pada startup dan sebelum write                    |
| Relayer kehabisan gas                         | Min-balance policy, alarm, dan controlled top-up                                  |
| Semua container berada di satu VM             | Nyatakan sebagai staging; backup dan rencana pemisahan validator untuk production |
| Migration database menimbulkan drift          | Prisma CLI, review SQL, test pada salinan database, migration status check        |
| Contract address berubah saat deploy aplikasi | Pisahkan workflow contract dan application; manifest immutable                    |
| RPC disalahgunakan                            | Hanya RPC node, private network, auth, allowlist, dan rate limit                  |

## 9. Status implementasi dan gate berikutnya

Fase 0 dan Fase 1 telah dikerjakan: governance telah diselaraskan, chain lama telah diberi manifest arsip, dan resource chain baru memakai namespace terpisah. Fase 4 juga telah memiliki konfigurasi chain ID `1338`, fee policy non-zero, preflight deployment, serta manifest deployment per environment.

Fase 2–3 telah memiliki generator genesis/key dan compose multi-node, dan acceptance gate runtime local QBFT telah lulus: chain ID `1338`, lima peer terhubung, serta empat validator aktif. Fase 5–6 telah menyediakan outbox `blockchain_operations` dan idempotency untuk anchoring PTBAE, penerbitan kuota PTBAE-PU, konfirmasi KTH, aktivasi listing, pembatalan listing, perubahan harga listing, serta purchase Bursa. Purchase menyimpan order `PENDING_BLOCKCHAIN`, menggunakan request ID yang stabil, mengunci satu operasi blockchain per order, lalu hanya menyelesaikan proyeksi saldo dan alokasi dana setelah transaction hash tersedia. Fase 7 kini memiliki `BlockchainOperationReconciliationService` yang berjalan periodik untuk memeriksa receipt pada operasi `SUBMITTED` yang sudah memiliki transaction hash, memvalidasi chain ID dan contract address, lalu menandai operasi sebagai `CONFIRMED`, `FAILED_PERMANENT`, atau `RECONCILIATION_REQUIRED`. Worker ini tidak mengubah aggregate bisnis secara diam-diam. Test unit service/utilitas outbox dan reconciliation, typecheck, lint server, format, client test, dan contract test lulus. Relayer generik, recovery aggregate untuk transaksi yang broadcast tetapi hash belum tersimpan, event reconciliation, serta outbox retirement masih menjadi pekerjaan berikutnya.

Gate berikutnya:

1. Simpan manifest deployment QBFT `1338` yang saat ini dipakai backend; jangan menggunakan manifest chain lama.
2. Lanjutkan relayer/worker generik dan recovery aggregate berbasis receipt/event; worker receipt saat ini sudah memproses hash yang tersimpan, sedangkan operasi purchase masih dieksekusi melalui service request.
3. Perluas outbox ke retirement, distribusi dana on-chain, dan recovery hasil transaksi yang mengembalikan ID listing/order.
4. Tambahkan failure test dan end-to-end test penuh untuk audit–mint–listing–buy–retire pada local QBFT.
