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

Release workflow menempatkan compose file di `$PROJECT_DIR/current`. Untuk smoke test
manual, gunakan shared environment yang dibuat bootstrap:

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
  up -d --remove-orphans
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

Workflow menyimpan maksimal tiga release dan mempertahankan symlink `current`. Jika
health check release baru gagal, workflow mencoba mengaktifkan compose file release
sebelumnya tanpa menyentuh volume ledger. Jika rollback otomatis gagal, hentikan
perubahan lanjutan dan investigasi log container sebelum tindakan manual.
