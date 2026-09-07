# QBFT 1338 Reconciliation — Implementation Plan & Timeline

## 1. Objective

Menjadikan jaringan Hyperledger Besu QBFT lokal dengan chain ID `1338` sebagai sumber kebenaran untuk seluruh pencatatan blockchain RekaKarbon, kemudian menyelaraskan referensi PostgreSQL tanpa menghapus data bisnis, mereset database, atau kembali ke ledger Hardhat/Besu dev lama.

## 2. Confirmed Baseline

- Runtime aktif: Hyperledger Besu QBFT, chain ID `1338`, RPC `http://127.0.0.1:8545`.
- Kontrak RKB_CREDIT: `0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0`.
- Kontrak EmissionReportRegistry: `0xF12b5dd4EAD5F743C6BaA640B0216200e89B60Da`.
- PostgreSQL menyimpan 7 laporan emisi dengan referensi blockchain:
  - 2 laporan berstatus `SUBMITTED`.
  - 5 laporan berstatus `APPROVED`.
- PostgreSQL menyimpan 33 anchor PTBAE berstatus `CONFIRMED`.
- Minimal dua hash laporan lama tidak ditemukan pada chain aktif.
- Minimal dua laporan database menunjuk `blockchain_report_id = 1`, sedangkan report ID 1 di QBFT aktif dimiliki wallet lain dan sudah berstatus `APPROVED`.
- Konfigurasi server sudah memakai chain ID `1338`, tetapi `blockchain/hardhat.config.ts` masih mengunci chain ID lama `1337`.

## 3. Safety Rules

1. Tidak menjalankan reset, reseed, truncate, atau delete.
2. Membuat backup PostgreSQL sebelum mutasi data.
3. Tool rekonsiliasi selalu default ke `dry-run`; mode apply harus eksplisit.
4. Sebelum apply, tool wajib memverifikasi chain ID, bytecode kontrak, alamat kontrak, dan role signer.
5. Setiap transaksi menunggu receipt sukses dan memverifikasi event sebelum database diperbarui.
6. Pembaruan database dilakukan per-record dalam transaksi Prisma yang pendek setelah receipt tersedia.
7. Tool bersifat idempotent: menjalankan ulang tidak boleh membuat laporan, audit, atau anchor ganda.
8. Konflik root/wallet/tahun tidak diperbaiki otomatis; item dihentikan dan dilaporkan untuk keputusan manual.
9. Saldo dan riwayat RKB_CREDIT tidak disentuh oleh rekonsiliasi laporan emisi/PTBAE.

## 4. Reconciliation Classification

Setiap laporan dan anchor diklasifikasikan sebelum ada write:

- `MATCHED`: ID, wallet, tahun, Merkle root, status, dan receipt cocok.
- `DB_REFERENCE_STALE`: state on-chain cocok, tetapi ID/hash database usang.
- `CHAIN_ENTRY_MISSING`: database memiliki record, tetapi wallet/tahun belum tercatat pada QBFT.
- `STATUS_MISMATCH`: identitas/root cocok, tetapi status database dan chain berbeda.
- `CHAIN_CONFLICT`: wallet/tahun sudah dipakai oleh root atau record berbeda; tidak boleh diperbaiki otomatis.
- `INVALID_REFERENCE`: hash, address, report ID, atau contract metadata tidak valid.

## 5. Ordered Implementation Phases

### Phase 0 — Snapshot and full read-only audit (10–15 minutes)

- Export backup PostgreSQL ke folder backup workspace dengan timestamp.
- Simpan manifest chain: chain ID, block number, contract addresses, runtime bytecode hashes, dan deployment transaction receipts.
- Audit seluruh 7 laporan dan 33 anchor terhadap QBFT.
- Hasil: laporan dry-run awal dan checksum backup.

Checkpoint: lanjut hanya jika backup dapat dibaca dan chain guard lulus.

### Phase 1 — Configuration and startup guards (10–15 minutes)

- Ubah network Hardhat/Besu lokal agar chain ID berasal dari `BESU_CHAIN_ID` dengan default `1338`.
- Gunakan nama network QBFT yang eksplisit agar tidak tertukar dengan jaringan dev lama.
- Tambahkan validasi backend untuk chain ID, bytecode kontrak, dan contract address sebelum operasi write.
- Pertahankan Hardhat hanya sebagai compiler/deployment/test tool; bukan runtime consensus.

Checkpoint: compile/typecheck konfigurasi blockchain harus lulus.

### Phase 2 — Idempotent reconciliation tool and tests (20–30 minutes)

- Buat tool audit/reconciliation dengan mode `--dry-run` dan `--apply`.
- Cocokkan laporan berdasarkan wallet perusahaan + tahun + Merkle root, bukan hanya integer report ID.
- Verifikasi receipt dan event `ReportSubmitted`/`ReportAudited`.
- Untuk `CHAIN_ENTRY_MISSING`, submit ulang Merkle root yang sudah ada; tidak menghitung ulang data bisnis.
- Untuk laporan database `APPROVED`, replay keputusan approval hanya setelah laporan yang tepat berada dalam status on-chain `SUBMITTED`.
- Cocokkan anchor PTBAE berdasarkan application UUID + version + anchor type + Merkle root.
- Tambahkan unit test untuk rerun/idempotency, conflict stop, missing receipt, dan status mismatch.

Checkpoint: dry-run kedua harus menghasilkan tindakan deterministik tanpa konflik tersembunyi.

### Phase 3 — Controlled apply to QBFT and PostgreSQL (10–25 minutes)

- Jalankan apply satu record per transaksi, mulai dari laporan emisi, kemudian audit status, lalu anchor PTBAE.
- Simpan journal hasil: record ID, old reference, new report ID/hash, block number, dan hasil verifikasi.
- Hentikan batch pada konflik; record yang sudah sukses tetap dapat diaudit dan proses aman untuk dilanjutkan ulang.

Checkpoint: seluruh receipt baru harus status sukses dan pembacaan ulang contract harus cocok dengan PostgreSQL.

### Phase 4 — API failure semantics and profile identity (15–20 minutes)

- Tambahkan preflight audit agar ketidakcocokan chain menghasilkan `409 CHAIN_STATE_MISMATCH`, bukan `500` generik.
- Pertahankan duplicate annual report sebagai `409`, bukan server error.
- Kembalikan error `400` yang jelas untuk emitter tanpa relasi perusahaan.
- Ganti wallet/email placeholder halaman Profil dengan data akun autentik dari backend.
- Validasi listing Bursa terhadap status on-chain sebelum ditampilkan atau dibeli, sehingga listing DB yang sudah `FILLED`/`CANCELLED` tidak memicu quote revert.

Checkpoint: contract/API schema tests dan client schema parsing harus lulus.

### Phase 5 — End-to-end verification (15–25 minutes)

- Verifikasi akun Bambang dapat membaca `/ptbae-applications` dan laporan tahunannya.
- Verifikasi audit Suralaya dan Krakatau mencatat receipt QBFT yang benar.
- Verifikasi submit laporan baru, duplicate submission, revision, dan approval menghasilkan status HTTP yang benar.
- Verifikasi saldo Bambang tetap `700000000000` RKB_CREDIT dan riwayat deposit tetap tersedia.
- Jalankan blockchain compile/typecheck/test, server typecheck/test/contracts, dan client typecheck/test/contracts yang relevan.

## 6. Estimated Timeline

| Phase                               |  Estimate | Cumulative |
| ----------------------------------- | --------: | ---------: |
| Baseline, backup, complete audit    | 10–15 min |     15 min |
| Config and startup guards           | 10–15 min |     30 min |
| Reconciliation tool and tests       | 20–30 min |     60 min |
| Dry-run review and controlled apply | 10–25 min |     85 min |
| API/profile corrections             | 15–20 min |    105 min |
| End-to-end validation               | 15–25 min |    130 min |

Expected total: approximately **80–130 minutes**, depending on how many of the 33 PTBAE anchors require a new transaction rather than a database-reference repair.

## 7. Rollback and Recovery

- Database rollback source: timestamped PostgreSQL backup plus per-record reconciliation journal.
- Blockchain transactions are immutable and cannot be rolled back; therefore conflicting entries are never overwritten automatically.
- If apply stops midway, rerun dry-run. Idempotency must classify completed items as `MATCHED` and continue only remaining items.
- Restoring the former Hardhat/Besu dev ledger is not part of this plan; QBFT `1338` remains authoritative.

## 8. Definition of Done

- No report or PTBAE anchor used by the application references a missing transaction on QBFT.
- Database report identity/root/status agrees with `EmissionReportRegistry`.
- Audit actions no longer return `500` for known state conflicts.
- Duplicate report submission returns a stable `409` error envelope.
- Bursa stale listing returns a stable `409 BURSA_CHAIN_STATE_MISMATCH` and is excluded from the buyer market feed.
- Profile shows the authenticated wallet rather than a role-level placeholder.
- RKB_CREDIT balances/history remain unchanged by reconciliation.
- Relevant compile, typecheck, test, and API contract suites pass.

## 9. Execution Result — 7 September 2026

- PostgreSQL backup verified: `rekakarbon-pre-qbft-reconciliation-20260907-215448.dump` (338 restore entries).
- Initial dry-run: 3/7 emission reports and 14/33 PTBAE anchors matched QBFT; no chain conflicts.
- Controlled apply completed with per-record JSONL journals.
- Final reconciliation: 7/7 emission reports and 33/33 PTBAE anchors are `MATCHED`.
- Bambang/Suralaya wallet remains `700000000000` RKB_CREDIT with the original deposit transaction retained in history.
- Default Docker Compose runtime now resolves to the four-validator QBFT stack; the single-node `--network=dev` default was removed.
- Server, client, and blockchain typechecks pass; focused blockchain/audit tests pass.
