# RekaKarbon Besu networks

`local-qbft/` contains only the tracked QBFT template. Generated genesis files,
node keys, and local `.env` files are written to `local-qbft/generated/` and are
ignored by Git because they contain private node material.

## Local QBFT lifecycle

From the `blockchain/` directory:

```powershell
pnpm network:generate
pnpm network:up
pnpm network:check
pnpm network:down
```

`network:down` stops containers without removing named volumes. Do not use
`docker compose down -v` unless the disposable local network is intentionally
being reset. The legacy Clique/chain `1337` network uses separate configuration
and data and must not share these volumes. Its read-only reference and checksum
manifest are documented in `legacy-chain-1337/`.

The generated RPC endpoint is `http://127.0.0.1:8545`; validators do not expose
RPC ports to the host.
