#!/usr/bin/env bash
set -Eeuo pipefail

RELEASE_ROOT="$PROJECT_DIR/releases/$RELEASE_ID"
QBFT_DIR="$RELEASE_ROOT/blockchain"
QBFT_ARCHIVE="/tmp/qbft-release-${RELEASE_ID}.tar.gz"
NETWORK_ENV="${NETWORK_ENV_FILE:-$PROJECT_DIR/qbft/shared/generated/.env}"
BLOCKCHAIN_ENV_SOURCE="${BLOCKCHAIN_ENV_FILE:-$PROJECT_DIR/shared/.env}"
NETWORK_DIR="$(dirname "$NETWORK_ENV")"

mkdir -p "$PROJECT_DIR/releases"
if [ -e "$RELEASE_ROOT" ]; then
  echo "Release target already exists: $RELEASE_ROOT" >&2
  exit 1
fi
mkdir -p "$RELEASE_ROOT"
tar -xzf "$QBFT_ARCHIVE" -C "$RELEASE_ROOT"
rm -f "$QBFT_ARCHIVE"

command -v docker >/dev/null 2>&1 || { echo 'Docker tidak tersedia.' >&2; exit 1; }

# Ensure Docker Compose v2 is available (Compose v1 is incompatible with Docker Engine 26+)
if ! docker compose version >/dev/null 2>&1; then
  echo 'Docker Compose v2 plugin tidak ditemukan. Mengunduh Compose v2 plugin...'
  mkdir -p "$HOME/.docker/cli-plugins"
  COMPOSE_ARCH="$(uname -m)"
  case "$COMPOSE_ARCH" in
    x86_64) COMPOSE_ARCH="x86_64" ;;
    aarch64) COMPOSE_ARCH="aarch64" ;;
    *) COMPOSE_ARCH="x86_64" ;;
  esac
  curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${COMPOSE_ARCH}" -o "$HOME/.docker/cli-plugins/docker-compose"
  chmod +x "$HOME/.docker/cli-plugins/docker-compose"
fi

if docker compose version >/dev/null 2>&1; then
  compose() { docker compose "$@"; }
else
  echo 'Gagal menginisialisasi Docker Compose v2.' >&2
  exit 1
fi
docker version --format '{{.Server.Version}}'
compose version

test -r "$NETWORK_ENV" || {
  echo "QBFT generated .env tidak ditemukan: $NETWORK_ENV" >&2
  echo 'Bootstrap QBFT harus dilakukan satu kali secara terpisah; workflow tidak membuat ulang ledger produksi.' >&2
  exit 1
}
test -r "$BLOCKCHAIN_ENV_SOURCE" || {
  echo "Environment blockchain tidak ditemukan: $BLOCKCHAIN_ENV_SOURCE" >&2
  exit 1
}
test -n "${BLOCKCHAIN_PRIVATE_KEY:-}" || {
  echo 'Secret BLOCKCHAIN_PRIVATE_KEY belum dikonfigurasi.' >&2
  exit 1
}
test -f "$NETWORK_DIR/genesis.json" || {
  echo 'genesis.json QBFT tidak ditemukan.' >&2
  exit 1
}
test -f "$NETWORK_DIR/nodes/bootnode-1/key" || {
  echo 'Kunci bootnode QBFT tidak ditemukan.' >&2
  exit 1
}

# Remove leftover transient/renamed containers from aborted previous runs
docker ps -a --filter "name=rekakarbon-qbft" --format '{{.ID}} {{.Names}}' | while read -r cid cname; do
  if [[ "$cname" =~ ^[0-9a-f]+_rekakarbon-qbft ]]; then
    echo "Cleaning up leftover transient container: $cname ($cid)"
    docker rm -f "$cid" || true
  fi
done

# Compose receives only the generated network environment.
compose --project-name blockchain --env-file "$NETWORK_ENV" -f "$QBFT_DIR/docker-compose.qbft.yml" config --quiet
compose --project-name blockchain --env-file "$NETWORK_ENV" -f "$QBFT_DIR/docker-compose.qbft.yml" up -d --remove-orphans

echo 'Menunggu RPC QBFT dan block progression...'
for attempt in $(seq 1 30); do
  echo "Checking RPC connection (attempt $attempt/30)..."
  chain_id="$(curl -fsS --max-time 5 -X POST -H 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    http://127.0.0.1:8545 | tr -d '\n' || true)"
  if [ -n "$chain_id" ]; then
    break
  fi
  sleep 5
done
test -n "${chain_id:-}" || { echo 'RPC QBFT tidak merespons.' >&2; exit 1; }

block_before="$(curl -fsS --max-time 5 -X POST -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":2}' \
  http://127.0.0.1:8545 | tr -d '\n')"
sleep 8
block_after="$(curl -fsS --max-time 5 -X POST -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":3}' \
  http://127.0.0.1:8545 | tr -d '\n')"
test "$block_before" != "$block_after" || {
  echo "Block QBFT tidak bertambah: $block_before -> $block_after" >&2
  exit 1
}

# Locate existing deployment-info.json across shared, current, or earlier releases
if [ ! -f "$QBFT_DIR/deployment-info.json" ]; then
  if [ -f "$PROJECT_DIR/shared/deployment-info.json" ]; then
    echo "Reusing existing deployment-info.json from $PROJECT_DIR/shared/deployment-info.json"
    cp "$PROJECT_DIR/shared/deployment-info.json" "$QBFT_DIR/deployment-info.json"
  elif [ -f "$PROJECT_DIR/current/blockchain/deployment-info.json" ]; then
    echo "Reusing existing deployment-info.json from $PROJECT_DIR/current/blockchain/deployment-info.json"
    cp "$PROJECT_DIR/current/blockchain/deployment-info.json" "$QBFT_DIR/deployment-info.json"
  else
    # Search previous release directories in reverse chronological order
    LATEST_PREVIOUS_MANIFEST="$(find "$PROJECT_DIR/releases" -mindepth 3 -maxdepth 3 -name "deployment-info.json" 2>/dev/null | grep -v "$RELEASE_ID" | sort -r | head -n 1 || true)"
    if [ -n "$LATEST_PREVIOUS_MANIFEST" ] && [ -f "$LATEST_PREVIOUS_MANIFEST" ]; then
      echo "Discovered earlier deployment-info.json at $LATEST_PREVIOUS_MANIFEST"
      cp "$LATEST_PREVIOUS_MANIFEST" "$QBFT_DIR/deployment-info.json"
    fi
  fi
fi

# The deployer key is written only into this release's temporary .env
# and removed by the EXIT trap after Hardhat finishes.
cp "$BLOCKCHAIN_ENV_SOURCE" "$QBFT_DIR/.env"
chmod 600 "$QBFT_DIR/.env"
{
  printf '\nPRIVATE_KEY=%s\n' "$BLOCKCHAIN_PRIVATE_KEY"
  printf 'DEPLOYMENT_MODE=%s\n' "$DEPLOYMENT_MODE"
  printf 'ALLOW_DEPLOY_NEW=%s\n' "$ALLOW_DEPLOY_NEW"
  printf 'DEPLOYMENT_MANIFEST_PATH=/workspace/blockchain/deployment-info.json\n'

  if [ -n "${CARBON_TOKEN_ADDRESS_OVERRIDE:-}" ]; then
    printf 'CARBON_TOKEN_CONTRACT_ADDRESS=%s\n' "$CARBON_TOKEN_ADDRESS_OVERRIDE"
  fi
  if [ -n "${EMISSION_REGISTRY_ADDRESS_OVERRIDE:-}" ]; then
    printf 'EMISSION_REGISTRY_CONTRACT_ADDRESS=%s\n' "$EMISSION_REGISTRY_ADDRESS_OVERRIDE"
  fi
} >> "$QBFT_DIR/.env"
trap 'rm -f "$QBFT_DIR/.env"' EXIT

# Run deployment container
docker run --rm \
  --network host \
  --user "$(id -u):$(id -g)" \
  --env HOME=/tmp/rekakarbon-home \
  --env COREPACK_HOME=/tmp/rekakarbon-corepack \
  --volume "$RELEASE_ROOT:/workspace" \
  --workdir /workspace \
  node:24.15.0-bookworm \
  bash -Eeuo pipefail -c '
    corepack pnpm --version
    corepack pnpm install --frozen-lockfile --filter ./blockchain... --ignore-scripts
    corepack pnpm --filter ./blockchain qbft:preflight
    corepack pnpm --filter ./blockchain exec hardhat run scripts/deploy.ts --network besu_qbft
  '

MANIFEST="$QBFT_DIR/deployment-info.json"
test -s "$MANIFEST" || { echo 'Manifest deployment tidak dibuat.' >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo 'jq diperlukan untuk sinkronisasi manifest.' >&2; exit 1; }
CARBON_ADDRESS="$(jq -r '.contracts.rekaKarbon.address' "$MANIFEST")"
REGISTRY_ADDRESS="$(jq -r '.contracts.emissionReportRegistry.address' "$MANIFEST")"
CHAIN_ID="$(jq -r '.chainId' "$MANIFEST")"
if [ "$CARBON_ADDRESS" = 'null' ] || [ "$REGISTRY_ADDRESS" = 'null' ]; then
  echo 'Alamat kontrak pada manifest tidak lengkap.' >&2
  exit 1
fi

# Persist manifest to shared so future releases can automatically find existing addresses
mkdir -p "$PROJECT_DIR/shared"
cp "$MANIFEST" "$PROJECT_DIR/shared/deployment-info.json"

echo "QBFT deployment berhasil. Release: $RELEASE_ID"
echo "Chain ID: $CHAIN_ID"
echo "RekaKarbon: $CARBON_ADDRESS"
echo "EmissionReportRegistry: $REGISTRY_ADDRESS"
