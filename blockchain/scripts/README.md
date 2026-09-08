# QBFT server runbook

Runbook ini dipakai untuk menyiapkan jaringan QBFT di server Linux sebelum workflow
GitHub Actions mengaktifkan release aplikasi. Genesis dan private key selalu dibuat di
server, di luar checkout Git, dan tidak boleh dimasukkan ke archive release.

## Prasyarat

- Docker Engine dengan `docker compose` plugin.
- Image Besu yang dipakai workflow (`hyperledger/besu:26.8.1`) dapat di-pull.
- `jq`, `openssl`, `sort`, `mktemp`, dan `realpath` tersedia di host.
- Direktori target dapat ditulis oleh user yang menjalankan bootstrap.
- Port P2P internal pada subnet Docker tidak dibuka ke Internet. RPC hanya diakses
  melalui `127.0.0.1:8545`/`8546` atau reverse proxy yang diautentikasi.

## Bootstrap satu kali

Salin script dari release yang sudah direview, lalu jalankan dengan target kosong:

```bash
chmod 700 blockchain/scripts/bootstrap-qbft.sh
QBFT_OUTPUT_DIR=/opt/rekakarbon/qbft/shared/network \
  blockchain/scripts/bootstrap-qbft.sh
```

Script menolak target yang tidak kosong. Hasil pentingnya adalah:

- `generated/genesis.json` dan `generated/.env`;
- empat key validator di `generated/nodes/validator-{1..4}/key`;
- key bootnode dan RPC node di `generated/nodes/{bootnode-1,rpc-1}/key`;
- `generated/network-info.json` tanpa private key.

Backup terenkripsi atas seluruh `generated/` wajib dibuat sebelum menjalankan node.
Jangan menghapus volume ledger atau menjalankan bootstrap ulang pada jaringan yang
sudah memiliki block.

## Menjalankan runtime

Release workflow menempatkan setiap compose file di direktori release immutable. Path
shared network dikonfigurasi melalui GitHub Variable `QBFT_NETWORK_ENV_FILE`; workflow
tidak menghapus release atau volume ledger lama. Untuk smoke test manual, gunakan
shared environment yang dibuat bootstrap:

```bash
docker compose \
  --env-file /opt/rekakarbon/qbft/shared/network/generated/.env \
  -p rekakarbon-qbft \
  -f /opt/rekakarbon/qbft/current/blockchain/docker-compose.qbft.yml \
  config --quiet

docker compose \
  --env-file /opt/rekakarbon/qbft/shared/network/generated/.env \
  -p rekakarbon-qbft \
  -f /opt/rekakarbon/qbft/current/blockchain/docker-compose.qbft.yml \
  up -d
```

Validasi minimum sebelum menyambungkan backend:

```bash
curl -fsS -X POST http://127.0.0.1:8545 \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

curl -fsS -X POST http://127.0.0.1:8545 \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}'
```

Workflow melakukan pemeriksaan yang sama dan juga memastikan block bertambah. Mode
contract default adalah `verify-existing`; `configure-existing` dan `deploy-new` harus
diaktifkan secara eksplisit melalui protected GitHub Environment.

## Rollback

Workflow tidak melakukan rollback otomatis dan tidak menjalankan `docker compose down -v`.
Jika health check gagal, pertahankan container/volume untuk investigasi dan pilih commit
terakhir yang tervalidasi pada workflow manual berikutnya. Jalankan compose file dari
release sebelumnya dengan shared `.env` yang sama; jangan bootstrap ulang genesis atau
menghapus volume ledger.

## Top-up RKB_CREDIT terkontrol

Script `fund-wallet-credit.ts` hanya menulis token ID 3 setelah memverifikasi chain ID,
bytecode, `DEPOSIT_ROLE`, dan receipt `TransferSingle`. Untuk mencegah retry menggandakan
saldo, operator wajib mengisi saldo sebelum transaksi secara persis dan konfirmasi eksplisit:

```bash
WALLET_CREDIT_RECIPIENT=0x... \
WALLET_CREDIT_AMOUNT_IDR=700000000000 \
WALLET_CREDIT_EXPECTED_BALANCE_BEFORE=... \
WALLET_CREDIT_CONFIRM=MINT \
QBFT_ENV_FILE=/opt/rekakarbon/qbft/shared/network/generated/.env \
pnpm qbft:fund-wallet-credit
```

Nominal IDR harus berupa angka mentah tanpa titik/koma. Jika saldo awal berbeda, script
membatalkan transaksi. Simpan tx hash dan receipt sebagai bukti audit sebelum melakukan
operasi berikutnya.
