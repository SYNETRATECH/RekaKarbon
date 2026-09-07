# Legacy chain 1337

Direktori ini menandai konfigurasi Clique chain `1337` sebagai arsip read-only.
Sumber konfigurasi historis tetap berada di:

- `besu-config/genesis.json`
- `docker-compose.yml`
- `deployment-info.json` jika tersedia

Buat atau perbarui manifest checksum dengan perintah berikut dari direktori
`blockchain/`:

```powershell
pnpm network:archive:legacy
```

Manifest tidak menyalin private key atau data directory Besu. Nilai final block
dan hash jaringan harus dicatat dari node legacy yang masih tersedia. Jangan
menjalankan `docker compose down -v` pada project legacy dan jangan memakai
resource legacy untuk jaringan QBFT aktif.
