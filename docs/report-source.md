# Riset Arsitektur Blockchain Produksi RekaKarbon

Tanggal keputusan: 5 September 2026  
Status: rekomendasi arsitektur sebelum implementasi

## Ringkasan keputusan

Solusi produksi yang direkomendasikan adalah **membangun jaringan permissioned Hyperledger Besu baru berbasis QBFT**, menggunakan **gas native bernilai kecil/non-zero yang dibayar oleh relayer milik platform**, lalu memigrasikan integritas data dari chain lama melalui manifest migrasi dan Merkle root. Chain lama tidak dihapus; chain tersebut dipertahankan dalam mode baca-saja sebagai arsip audit.

Target awal yang disarankan:

- 4 validator QBFT pada domain kegagalan dan kewenangan yang berbeda.
- 2 node RPC non-validator di belakang private load balancer/API gateway.
- 2 bootnode pada availability zone berbeda.
- Backend hanya mengirim transaksi melalui relayer; pengguna aplikasi tidak perlu mempunyai native gas.
- Kunci validator dan relayer disimpan di KMS/HSM/Vault atau Web3Signer, bukan `.env`, source code, atau workflow.
- JSON-RPC validator tidak diekspos ke internet.
- Semua transaksi aplikasi menyimpan `chainId`, alamat kontrak, transaction hash, block number, dan status konfirmasi.

Keputusan ini menggantikan pola lama: Clique, single-node miner, wildcard RPC, dan `{ gasPrice: 0 }` yang ditulis langsung pada banyak pemanggilan kontrak.

## Mengapa deployment sekarang gagal

Error `Gas price below configured minimum gas price` bukan sekadar kekurangan saldo. Transaksi deployment secara eksplisit mengirim `gasPrice: 0`, sedangkan node Besu yang menerima transaksi memberlakukan harga gas minimum atau base fee lebih besar dari nol.

Konfigurasi saat ini juga tidak konsisten:

- Deployment contract memaksa `gasPrice: 0`.
- Banyak transaksi pada backend juga memaksa harga gas nol.
- Genesis mengaktifkan London tetapi tidak menetapkan `zeroBaseFee: true`.
- Compose lokal menggunakan `--network=dev`, sedangkan deployment jarak jauh menggunakan genesis khusus.
- Konfigurasi RPC membuka CORS dan host allowlist dengan wildcard serta mengekspos API administratif/debug.
- Jaringan menggunakan Clique dan Besu 23.4.4. Clique sudah dihapus dari Besu modern, sehingga jalur upgrade jangka panjangnya buruk.

Menghapus `gasPrice: 0` saja dapat membuat deployment lewat, tetapi tidak menyelesaikan perbedaan konfigurasi, keamanan RPC, konsensus usang, pengelolaan kunci, ketahanan node, dan migrasi state. Karena pengguna mengizinkan rebuild, ini saat yang tepat untuk memperbaiki fondasinya.

## Perbandingan empat opsi

| Opsi | Bentuk solusi                                      | Kelebihan                                                                                | Risiko                                                                                          | Keputusan            |
| ---- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------- |
| 1    | Patch chain Clique lama dan samakan gas nol        | Perubahan paling sedikit                                                                 | Konsensus sudah tidak didukung Besu modern, single point of failure, utang keamanan tetap ada   | Ditolak              |
| 2    | Satu node QBFT dengan free gas                     | Lebih mudah untuk demo                                                                   | Bukan jaringan BFT, kehilangan satu node menghentikan layanan, bukan produksi                   | Hanya development    |
| 3    | Empat validator QBFT dengan free gas               | BFT dan pengguna tidak memerlukan gas                                                    | Zero-fee mempermudah spam/DoS dan sangat sensitif terhadap konsistensi konfigurasi seluruh node | Opsi cadangan        |
| 4    | Empat validator QBFT, gas nominal, relayer sponsor | BFT, rate control berbasis gas, UX tetap gasless, fee policy terpusat dan dapat dipantau | Infrastruktur lebih lengkap dan membutuhkan pengelolaan relayer                                 | **Direkomendasikan** |

## Dasar teknis pilihan

### Konsensus QBFT

Dokumentasi Besu merekomendasikan QBFT sebagai konsensus enterprise-grade untuk private network. Blok memerlukan tanda tangan sedikitnya dua pertiga validator. Jaringan berhenti menghasilkan blok jika lebih dari sepertiga validator tidak tersedia. Empat validator merupakan jumlah minimum agar jaringan memiliki Byzantine fault tolerance.

Empat validator awal dapat ditempatkan pada empat trust/failure domain:

1. Infrastruktur Regulator/KLHK.
2. Infrastruktur Kementerian.
3. Infrastruktur auditor/verifikator independen atau konsorsium auditor.
4. Infrastruktur operator RekaKarbon atau pihak independen yang disepakati.

Role bisnis aplikasi tidak harus identik dengan validator. Validator menjaga konsensus jaringan; hak minting, audit, listing, treasury, dan oracle tetap diatur secara terpisah pada smart contract.

### Gas nominal dengan sponsored relayer

Gas native dipakai sebagai kontrol sumber daya jaringan, bukan sebagai harga karbon. Nilainya dapat sangat kecil, tetapi bukan nol. Platform menanggungnya melalui relayer sehingga pengalaman pengguna tetap gasless.

Kebijakan yang disarankan:

- Hilangkan seluruh `gasPrice: 0` yang hardcoded.
- Gunakan transaksi EIP-1559 dan estimasi fee dari provider/relayer.
- Terapkan `maxFeePerGas`, `maxPriorityFeePerGas`, `gasLimit`, alamat tujuan, dan ABI/function allowlist pada relayer.
- Pantau saldo native relayer dan lakukan top-up terkontrol sebelum ambang minimum.
- Pisahkan token native gas, token pembayaran RKB, dan unit SPE-GRK; ketiganya tidak boleh dicampur dalam perhitungan bisnis.
- Terapkan idempotency key dan nonce manager agar retry tidak menghasilkan transaksi ganda.

Jika organisasi benar-benar mewajibkan free gas, seluruh node harus mempunyai `--min-gas-price=0`, genesis London harus memakai `zeroBaseFee: true`, dan balance check tx pool perlu disesuaikan. Besu sendiri mengingatkan bahwa gas non-zero bermanfaat untuk membatasi penggunaan sumber daya. Karena itu free gas menjadi fallback, bukan pilihan utama produksi.

## Arsitektur target

```text
Browser / Mobile
       |
       v
API Gateway + WAF + rate limit
       |
       v
NestJS API ---- PostgreSQL (canonical business state)
       |              |
       |              +--- outbox / blockchain jobs / reconciliation
       v
Relayer cluster + KMS/HSM/Web3Signer
       |
       v
Private RPC load balancer
       |
       +--- RPC node A (non-validator)
       +--- RPC node B (non-validator)
                    |
                    v
       QBFT validator network (4 validators)
       + bootnode A/B + monitoring + backups
```

PostgreSQL tetap menjadi canonical state untuk workflow bisnis. Blockchain menyimpan aset, otorisasi, transaksi finansial, status penting, dan sidik jari data. Proses transaksi menggunakan pola outbox:

1. Perubahan bisnis dan job blockchain ditulis atomik ke PostgreSQL.
2. Worker relayer mengambil job dengan idempotency key.
3. Transaction hash disimpan segera setelah broadcast.
4. Setelah receipt mencapai jumlah konfirmasi yang ditentukan, record ditandai `CONFIRMED`.
5. Reconciler membandingkan event blockchain dengan state PostgreSQL dan menandai perbedaan untuk pemulihan.

Dengan pola ini, kegagalan RPC tidak membuat data bisnis hilang dan retry tidak otomatis menduplikasi minting/listing/pembelian.

## Keamanan dan tata kelola

### Jaringan

- Validator berada pada private subnet/VPC; hanya P2P antar-node dan jalur operasional yang disetujui yang dibuka.
- Aplikasi menggunakan RPC node non-validator, bukan endpoint validator.
- RPC dilindungi JWT dan/atau mTLS, host allowlist eksplisit, CORS origin eksplisit, IP allowlist, dan rate limit.
- API `ADMIN`, `DEBUG`, `MINER`, dan `TXPOOL` tidak tersedia pada endpoint aplikasi publik.
- Terapkan node permissioning dan account permissioning secara konsisten.
- Sebarkan validator dan bootnode lintas availability zone; hindari seluruh validator pada satu host, satu volume, atau satu operator.

### Kunci dan role

- Buat ulang seluruh kunci validator dan akun produksi; jangan membawa private key demo.
- Gunakan KMS/HSM/Vault atau Web3Signer untuk signing.
- Pisahkan akun deployer, contract admin, oracle, auditor, market operator, treasury, dan relayer.
- Akun deployer tidak boleh sekaligus menerima seluruh role operasional dan dana.
- Role admin kontrak menggunakan multisig dan, untuk tindakan berisiko tinggi, timelock.
- Terapkan prinsip least privilege serta prosedur rotasi dan pencabutan kunci.

### Supply chain deployment

- Pin image Besu pada versi dan digest yang sudah diuji.
- Gunakan rilis Besu modern yang masih didukung; saat penelitian ini, 26.8.1 adalah rilis terbaru yang ditemukan, tetapi production harus memilih patch release yang telah lulus staging dan security review.
- Pin GitHub Action pada commit SHA, bukan tag bergerak seperti `master`.
- Build artifact kontrak di CI, simpan checksum/attestation, lalu deploy artifact yang sama; jangan menjalankan `npm install` ad hoc pada server produksi.
- Pisahkan lifecycle infrastruktur chain dari deployment aplikasi. Deployment aplikasi normal tidak boleh menghapus data directory, genesis, validator key, atau volume chain.

## Rebuild dan migrasi chain lama

Rebuild tidak berarti menghapus bukti lama. Migrasi yang benar adalah migrasi state bisnis dan kesinambungan audit, bukan memalsukan transaction hash lama agar terlihat terjadi pada chain baru.

### Fase 1 — inventaris dan freeze

1. Hentikan transaksi tulis ke chain lama pada maintenance window.
2. Catat chain ID, block height final, final block hash, daftar kontrak, bytecode hash, role, saldo, listing, retirement, dan event penting.
3. Ekspor snapshot PostgreSQL konsisten pada waktu yang sama.
4. Simpan backup data directory dan konfigurasi chain lama.
5. Jadikan chain lama read-only dan batasi aksesnya untuk audit.

### Fase 2 — bangun jaringan baru

1. Tentukan chain ID baru yang tidak bertabrakan dengan environment lain.
2. Generate genesis QBFT melalui tooling Besu, bukan mengedit `extraData` manual.
3. Buat kunci validator baru dan simpan menggunakan secret manager.
4. Jalankan empat validator, dua bootnode, dan dua RPC node.
5. Aktifkan permissioning, TLS/JWT, observability, backup, dan compatibility protection.
6. Uji quorum: matikan satu validator; jaringan harus tetap menghasilkan blok. Matikan dua; alarm harus aktif dan perilaku sesuai batas QBFT.

### Fase 3 — deploy kontrak dan manifest migrasi

1. Deploy kontrak versi baru dari artifact CI yang immutable.
2. Verifikasi runtime bytecode hash dan role assignment.
3. Import state aktif yang sah: supply SPE-GRK, kepemilikan, retirement, escrow/listing, dan anchoring yang masih relevan.
4. Buat manifest migrasi yang memuat:
   - chain ID dan final block hash chain lama;
   - hash snapshot PostgreSQL;
   - mapping alamat kontrak lama ke baru;
   - jumlah record dan saldo per kategori;
   - timestamp freeze dan identitas penandatangan manifest.
5. Hitung Merkle root manifest dan anchor sebagai transaksi governance pertama pada chain baru.
6. Simpan referensi chain lama pada setiap data historis; transaction hash lama tidak pernah dicari pada chain baru.

### Fase 4 — rekonsiliasi dan cutover

1. Jalankan shadow validation antara PostgreSQL, chain lama, dan chain baru.
2. Cocokkan total supply, saldo tiap wallet, volume listing terkunci, retirement, dan distribusi dana. Seluruh invariant wajib seimbang.
3. Ubah konfigurasi backend secara atomik ke chain ID dan alamat kontrak baru.
4. Jalankan smoke test transaksi kecil end-to-end.
5. Buka kembali write traffic secara bertahap.
6. Siapkan rollback aplikasi ke maintenance mode; jangan mencoba menulis balik otomatis ke chain lama.

## Perubahan CI/CD yang diperlukan

Workflow produksi sebaiknya dibagi menjadi tiga pipeline:

1. **Build & verify**: compile, test, static analysis, ABI compatibility, bytecode checksum, dan image signing.
2. **Infrastructure**: provisioning node, genesis, validator membership, secrets, firewall, monitoring, backup. Hanya dijalankan melalui approval perubahan infrastruktur.
3. **Contract deployment/upgrade**: deploy artifact yang sudah disetujui, verifikasi chain ID, bytecode, role, dan smoke test. Membutuhkan approval multisig/change management.

Preflight wajib sebelum deployment:

- RPC endpoint merespons chain ID yang diharapkan.
- Block height terus bertambah.
- Jumlah validator dan peer sesuai target.
- Fee policy node dan relayer konsisten.
- Saldo relayer melewati minimum.
- Alamat target kosong atau bytecode-nya sesuai dengan skenario upgrade.
- Deployer memiliki role yang benar dan bukan memakai kunci demo.

Deployment harus gagal cepat dengan pesan yang spesifik jika salah satu preflight tidak terpenuhi. Workflow tidak boleh menghapus container data/volume produksi sebagai langkah awal rutin.

## Observability, backup, dan pemulihan

- Kumpulkan metric Prometheus: peer count, block height, block production delay, validator participation, tx pool, RPC latency/error rate, relayer balance, pending nonce, dan failed transaction.
- Buat alarm untuk quorum risk, block tidak bertambah, peer turun, saldo relayer rendah, retry outbox meningkat, dan perbedaan hasil reconciliation.
- Simpan log terstruktur dengan correlation ID bisnis, tanpa private key atau secret.
- Backup genesis, konfigurasi, permissioning list, manifest migrasi, database, serta data node sesuai recovery objective.
- Uji restore secara berkala; backup yang belum pernah diuji restore belum dapat dianggap siap produksi.
- Gunakan `--version-compatibility-protection=true` dan prosedur rolling/coordinated upgrade yang diuji di staging.

## Kriteria penerimaan produksi

Sistem baru baru boleh menerima transaksi riil setelah seluruh kriteria berikut terpenuhi:

- Empat validator aktif dan tersebar pada domain kegagalan berbeda.
- Satu validator dapat gagal tanpa menghentikan block production.
- RPC validator tidak dapat diakses dari internet.
- Tidak ada wildcard CORS/host allowlist pada endpoint produksi.
- Tidak ada private key produksi di repository, image, log, workflow, atau `.env` server aplikasi.
- Tidak ada `gasPrice: 0` hardcoded di deployment maupun backend.
- Relayer memakai fee cap, destination/function allowlist, nonce manager, idempotency, dan monitoring saldo.
- Seluruh kontrak memiliki bytecode checksum, source/ABI version, role matrix, dan emergency procedure.
- Supply, escrow, listing, retirement, dan distribusi dana lulus rekonsiliasi.
- Manifest migrasi dan Merkle root berhasil diverifikasi.
- Chain lama tersedia read-only untuk pemeriksaan historis.
- Load test, failure test, backup restore, dan incident drill telah berhasil.

## Urutan implementasi yang disarankan

1. Bekukan desain domain dan invariant aset.
2. Bangun staging QBFT empat validator dengan arsitektur target.
3. Refactor fee handling dan implementasikan relayer/outbox/reconciler.
4. Perketat RPC, permissioning, secret management, role, dan multisig.
5. Bangun pipeline artifact-based serta preflight deployment.
6. Jalankan rehearsal migrasi lengkap menggunakan salinan data.
7. Audit smart contract dan pengujian failure/load/restore.
8. Lakukan production cutover menggunakan runbook yang telah dilatih.

## Sumber primer

- [Hyperledger Besu — Configure QBFT consensus](https://docs.besu-eth.org/private-networks/how-to/configure/consensus/qbft)
- [Hyperledger Besu — Configure free gas networks](https://docs.besu-eth.org/private-networks/how-to/configure/free-gas)
- [Hyperledger Besu — Authenticate JSON-RPC requests](https://docs.besu-eth.org/private-networks/how-to/use-besu-api/authenticate)
- [Hyperledger Besu — Configure TLS](https://docs.besu-eth.org/private-networks/how-to/configure/tls)
- [Hyperledger Besu — Local permissioning](https://docs.besu-eth.org/private-networks/how-to/use-local-permissioning)
- [Hyperledger Besu — Deploy to cloud](https://docs.besu-eth.org/private-networks/how-to/deploy/cloud)
- [Hyperledger Besu — Back up private networks](https://docs.besu-eth.org/private-networks/how-to/backup)
- [Hyperledger Besu — Upgrade nodes](https://docs.besu-eth.org/private-networks/how-to/upgrade)
- [Hyperledger Besu — Monitor nodes](https://docs.besu-eth.org/private-networks/how-to/monitor)
- [Besu 26.4.0 release — Clique removed](https://github.com/besu-eth/besu/releases/tag/26.4.0)
- [Besu 26.8.1 release](https://github.com/besu-eth/besu/releases/tag/26.8.1)
- [OpenZeppelin Relayer — EVM integration](https://docs.openzeppelin.com/relayer/1.5.x/evm)
- [OpenZeppelin Relayer — Policies](https://docs.openzeppelin.com/relayer/1.5.x/policies)
- [OpenZeppelin Contracts — Access control](https://docs.openzeppelin.com/contracts/5.x/access-control)
- [Web3Signer documentation](https://docs.web3signer.consensys.io/)
- [ethers v6 — Fee data](https://docs.ethers.org/v6/single-page/)

## Catatan batasan

Ini adalah keputusan arsitektur dan runbook awal, bukan audit keamanan formal. Parameter akhir seperti block period, epoch length, jumlah konfirmasi, gas floor, fee cap, RPO/RTO, serta komposisi validator harus ditetapkan melalui benchmark staging, threat model, dan persetujuan tata kelola organisasi.
