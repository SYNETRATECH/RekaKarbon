# Dokumentasi Infrastruktur Blockchain RekaKarbon

Dokumen ini menjelaskan batas runtime, pengembangan kontrak, jaringan QBFT, deployment
terkontrol, dan integrasi backend. Genesis, ledger, dan private key produksi tidak pernah
disimpan di repository.

## 1. Arsitektur

- Smart contract: Solidity `^0.8.24` dengan OpenZeppelin `5.0.0`.
- Tooling: Hardhat + TypeScript untuk compile, test, preflight, dan deployment client.
- Runtime: Hyperledger Besu QBFT, image dipin pada `hyperledger/besu:26.8.1`.
- Backend: NestJS + `ethers` v6.
- Chain ID target: `1338`.

Hardhat bukan node konsensus produksi. Runtime QBFT terdiri dari bootnode, empat validator,
dan satu RPC node. QBFT memakai minimal empat validator untuk toleransi satu validator
Byzantine.

## 2. Pengembangan lokal

Dari root repository:

```bash
pnpm install --frozen-lockfile
pnpm blockchain:typecheck
pnpm blockchain:compile
pnpm blockchain:test
```

Preflight terhadap node QBFT aktif memeriksa chain ID, jumlah validator, pertumbuhan block,
dan bytecode contract:

```bash
QBFT_BLOCK_SAMPLE_MS=5000 \
  pnpm --filter @rekakarbon/blockchain qbft:preflight
```

`blockchain/besu-config/genesis.json` adalah konfigurasi Clique lama untuk referensi saja.
Jangan gunakan file itu untuk runtime QBFT.

## 3. Bootstrap server QBFT

Ikuti [runbook server](scripts/README.md). Bootstrap satu kali membuat genesis dan identitas
node di direktori server yang kosong. Script menolak overwrite otomatis. Simpan backup terenkripsi
atas `generated/`, dan jangan menghapus volume ledger ketika melakukan release update.

Compose runtime berada di `docker-compose.qbft.yml`. RPC host hanya bind ke loopback
(`127.0.0.1:8545`/`8546`), sedangkan port P2P berada di jaringan Docker internal.

Validasi minimum:

```bash
curl -fsS -X POST http://127.0.0.1:8545 \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

curl -fsS -X POST http://127.0.0.1:8545 \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}'
```

## 4. Contract deployment

`blockchain/scripts/deploy.ts` aman secara default:

- `DEPLOYMENT_MODE=verify-existing` hanya memverifikasi chain, bytecode, dan role jika signer
  tersedia.
- `DEPLOYMENT_MODE=configure-existing` hanya mengirim role/revenue configuration yang belum ada.
- `DEPLOYMENT_MODE=deploy-new` adalah operasi eksplisit untuk deployment contract baru.

Manifest ditulis atomik ke `DEPLOYMENT_MANIFEST_PATH`. Gas price mengikuti provider Besu,
kecuali `BESU_GAS_PRICE_WEI` diisi eksplisit. Tidak ada hardcode `gasPrice: 0`.

## 5. GitHub Actions deployment

Workflow `.github/workflows/deploy-blockchain.yml` hanya berjalan melalui `workflow_dispatch`
dan protected GitHub Environment (`staging` atau `production`). Urutannya:

1. Install, typecheck, compile, test, compose validation, dan private-key source scan.
2. Buat archive release tanpa genesis/key/ledger.
3. Upload archive ke server melalui SSH.
4. Verifikasi shared QBFT genesis dan environment yang sudah diprovision.
5. Jalankan Compose tanpa menghapus volume, cek chain ID `1338`, validator, dan block progression.
6. Jika health check gagal, coba aktifkan release sebelumnya.
7. Jalankan contract operation hanya bila `deploy_contracts=true` dipilih eksplisit.

Secret environment yang diperlukan: `BLOCKCHAIN_SSH_HOST`, `BLOCKCHAIN_SSH_USERNAME`,
`BLOCKCHAIN_SSH_PASSWORD` (atau migrasikan action ke SSH key), `BLOCKCHAIN_PROJECT_DIR`,
`BLOCKCHAIN_PRIVATE_KEY`, dan address contract existing untuk mode verifikasi/konfigurasi.

## 6. Backend

Isi `server/.env` dengan RPC dan address contract yang sama dengan manifest deployment:

```env
BESU_RPC_URL=http://127.0.0.1:8545
BESU_CHAIN_ID=1338
CARBON_TOKEN_CONTRACT_ADDRESS=<address dari manifest>
EMISSION_REGISTRY_CONTRACT_ADDRESS=<address dari manifest>
PRIVATE_KEY=<secret signer backend dari secret manager>
```

Backend memverifikasi chain ID dan bytecode sebelum write transaction. Endpoint health tidak lagi
menampilkan block/chain statis; nilainya dibaca dari Besu aktif.

## 7. Troubleshooting dan rollback

- `chain ID mismatch`: hentikan aktivasi backend dan periksa `BESU_CHAIN_ID`, genesis, serta RPC.
- validator kurang dari empat atau block tidak bertambah: periksa log bootnode/validator dan
  konektivitas jaringan internal.
- contract address tidak memiliki bytecode: gunakan manifest dari chain yang sama; jangan deploy
  ulang tanpa approval.
- release gagal health check: workflow mencoba rollback ke symlink `current` sebelumnya. Jangan
  menghapus volume ledger sebagai langkah pemulihan.

Rencana implementasi dan timeline rinci tersedia di
`qbft_server_deployment_implementation_plan.md`.
