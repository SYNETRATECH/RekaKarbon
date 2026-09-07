#!/usr/bin/env bash

set -Eeuo pipefail

# One-time QBFT bootstrap for a Linux server. This script creates validator,
# bootnode, and RPC node identities outside Git. It must never be run against
# an existing network directory or ledger volume.

QBFT_OUTPUT_DIR="${QBFT_OUTPUT_DIR:-/opt/rekakarbon/qbft/shared/network}"
QBFT_BESU_IMAGE="${QBFT_BESU_IMAGE:-hyperledger/besu:26.8.1}"
QBFT_CHAIN_ID="${QBFT_CHAIN_ID:-1338}"
QBFT_VALIDATOR_COUNT="${QBFT_VALIDATOR_COUNT:-4}"
QBFT_BLOCK_PERIOD_SECONDS="${QBFT_BLOCK_PERIOD_SECONDS:-2}"
QBFT_REQUEST_TIMEOUT_SECONDS="${QBFT_REQUEST_TIMEOUT_SECONDS:-4}"
QBFT_EPOCH_LENGTH="${QBFT_EPOCH_LENGTH:-30000}"
QBFT_BOOTNODE_HOST="${QBFT_BOOTNODE_HOST:-172.30.0.10}"
QBFT_BOOTNODE_PORT="${QBFT_BOOTNODE_PORT:-30303}"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Perintah wajib tidak tersedia: $1"
}

require_positive_integer() {
  local name="$1"
  local value="$2"
  [[ "$value" =~ ^[0-9]+$ ]] || fail "$name harus berupa bilangan bulat positif."
  (( value > 0 )) || fail "$name harus lebih besar dari nol."
}

require_command docker
require_command jq
require_command openssl
require_command sort
require_command mktemp
require_command realpath

require_positive_integer QBFT_CHAIN_ID "$QBFT_CHAIN_ID"
require_positive_integer QBFT_VALIDATOR_COUNT "$QBFT_VALIDATOR_COUNT"
require_positive_integer QBFT_BLOCK_PERIOD_SECONDS "$QBFT_BLOCK_PERIOD_SECONDS"
require_positive_integer QBFT_REQUEST_TIMEOUT_SECONDS "$QBFT_REQUEST_TIMEOUT_SECONDS"
require_positive_integer QBFT_EPOCH_LENGTH "$QBFT_EPOCH_LENGTH"

if (( QBFT_VALIDATOR_COUNT < 4 )); then
  fail "QBFT memerlukan minimal empat validator untuk toleransi Byzantine."
fi

if [[ "$QBFT_CHAIN_ID" != "1338" ]]; then
  fail "Bootstrap ini dikunci untuk chain ID 1338; berikan konfigurasi baru secara eksplisit sebelum mengubahnya."
fi

OUTPUT_DIR="$(realpath -m "$QBFT_OUTPUT_DIR")"
if [[ -e "$OUTPUT_DIR" ]] && find "$OUTPUT_DIR" -mindepth 1 -maxdepth 1 -print -quit | grep -q .; then
  fail "Target bootstrap tidak kosong: $OUTPUT_DIR. Tidak ada overwrite otomatis."
fi

WORK_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

mkdir -p "$WORK_DIR/networkFiles" "$OUTPUT_DIR/generated/nodes/bootnode-1" "$OUTPUT_DIR/generated/nodes/rpc-1"
umask 077

cat > "$WORK_DIR/qbftConfigFile.json" <<EOF
{
  "genesis": {
    "config": {
      "chainId": $QBFT_CHAIN_ID,
      "berlinBlock": 0,
      "londonBlock": 0,
      "qbft": {
        "blockperiodseconds": $QBFT_BLOCK_PERIOD_SECONDS,
        "epochlength": $QBFT_EPOCH_LENGTH,
        "requesttimeoutseconds": $QBFT_REQUEST_TIMEOUT_SECONDS
      }
    },
    "nonce": "0x0",
    "timestamp": "0x58ee40ba",
    "gasLimit": "0x1c9c380",
    "difficulty": "0x1",
    "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",
    "coinbase": "0x0000000000000000000000000000000000000000",
    "alloc": {}
  },
  "blockchain": {
    "nodes": {
      "generate": true,
      "count": $QBFT_VALIDATOR_COUNT
    }
  }
}
EOF

echo "Generating QBFT validator identities with $QBFT_BESU_IMAGE..."
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$WORK_DIR:/work" \
  "$QBFT_BESU_IMAGE" \
  operator generate-blockchain-config \
  --config-file=/work/qbftConfigFile.json \
  --to=/work/networkFiles \
  --genesis-file-name=genesis.json

GENESIS_SOURCE="$WORK_DIR/networkFiles/genesis.json"
KEY_ROOT="$WORK_DIR/networkFiles/keys"
[[ -f "$GENESIS_SOURCE" ]] || fail "Besu tidak menghasilkan genesis.json."
[[ -d "$KEY_ROOT" ]] || fail "Besu tidak menghasilkan direktori validator key."

mapfile -t VALIDATOR_KEY_DIRS < <(find "$KEY_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort)
(( "${#VALIDATOR_KEY_DIRS[@]}" == QBFT_VALIDATOR_COUNT )) || fail "Jumlah validator key tidak sesuai: ${#VALIDATOR_KEY_DIRS[@]} != $QBFT_VALIDATOR_COUNT."

for index in "${!VALIDATOR_KEY_DIRS[@]}"; do
  source_key="$KEY_ROOT/${VALIDATOR_KEY_DIRS[$index]}/key"
  target_dir="$OUTPUT_DIR/generated/nodes/validator-$((index + 1))"
  [[ -f "$source_key" ]] || fail "Key validator tidak ditemukan: $source_key"
  mkdir -p "$target_dir"
  cp --preserve=mode "$source_key" "$target_dir/key"
  chmod 600 "$target_dir/key"
done

cp --preserve=mode "$GENESIS_SOURCE" "$OUTPUT_DIR/generated/genesis.json"
cp --preserve=mode "$WORK_DIR/qbftConfigFile.json" "$OUTPUT_DIR/generated/qbftConfigFile.json"

echo "Generating bootnode and RPC node identities..."
openssl rand -hex 32 > "$OUTPUT_DIR/generated/nodes/bootnode-1/key"
openssl rand -hex 32 > "$OUTPUT_DIR/generated/nodes/rpc-1/key"
chmod 600 "$OUTPUT_DIR/generated/nodes/bootnode-1/key" "$OUTPUT_DIR/generated/nodes/rpc-1/key"

docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$OUTPUT_DIR:/work" \
  "$QBFT_BESU_IMAGE" \
  --node-private-key-file=/work/generated/nodes/bootnode-1/key \
  public-key export \
  --to=/work/generated/nodes/bootnode-1/public-key

docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$OUTPUT_DIR:/work" \
  "$QBFT_BESU_IMAGE" \
  --node-private-key-file=/work/generated/nodes/bootnode-1/key \
  public-key export-address \
  --to=/work/generated/nodes/bootnode-1/address

BOOTNODE_PUBLIC_KEY="$(tr -d '[:space:]' < "$OUTPUT_DIR/generated/nodes/bootnode-1/public-key" | sed 's/^0x//')"
BOOTNODE_ADDRESS="$(tr -d '[:space:]' < "$OUTPUT_DIR/generated/nodes/bootnode-1/address")"
[[ "$BOOTNODE_PUBLIC_KEY" =~ ^[0-9a-fA-F]{128}$ ]] || fail "Public key bootnode tidak valid."
[[ "$BOOTNODE_ADDRESS" =~ ^0x?[0-9a-fA-F]{40}$ ]] || fail "Address bootnode tidak valid."

BOOTNODE_ADDRESS="0x${BOOTNODE_ADDRESS#0x}"
BOOTNODE_ENODE="enode://${BOOTNODE_PUBLIC_KEY}@${QBFT_BOOTNODE_HOST}:${QBFT_BOOTNODE_PORT}"

jq -e \
  --argjson expectedChainId "$QBFT_CHAIN_ID" \
  '.config.chainId == $expectedChainId and (.config.qbft | type == "object") and (.extraData | type == "string")' \
  "$OUTPUT_DIR/generated/genesis.json" >/dev/null || fail "Genesis QBFT gagal divalidasi."

cat > "$OUTPUT_DIR/generated/.env" <<EOF
QBFT_SHARED_DIR=$OUTPUT_DIR/generated
QBFT_BESU_IMAGE=$QBFT_BESU_IMAGE
QBFT_CHAIN_ID=$QBFT_CHAIN_ID
BOOTNODE_ENODE=$BOOTNODE_ENODE
QBFT_RPC_CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
EOF
chmod 600 "$OUTPUT_DIR/generated/.env"

VALIDATOR_ADDRESSES_JSON="$(printf '%s\n' "${VALIDATOR_KEY_DIRS[@]}" | jq -R . | jq -s .)"
jq -n \
  --argjson chainId "$QBFT_CHAIN_ID" \
  --arg besuImage "$QBFT_BESU_IMAGE" \
  --arg bootnodeAddress "$BOOTNODE_ADDRESS" \
  --arg bootnodeEnode "$BOOTNODE_ENODE" \
  --argjson validatorCount "$QBFT_VALIDATOR_COUNT" \
  --argjson validatorAddresses "$VALIDATOR_ADDRESSES_JSON" \
  '{schemaVersion: 1, chainId: $chainId, besuImage: $besuImage, validatorCount: $validatorCount, validatorAddresses: $validatorAddresses, bootnodeAddress: $bootnodeAddress, bootnodeEnode: $bootnodeEnode}' \
  > "$OUTPUT_DIR/generated/network-info.json"
chmod 600 "$OUTPUT_DIR/generated/network-info.json" "$OUTPUT_DIR/generated/qbftConfigFile.json"

echo "QBFT bootstrap selesai."
echo "Shared directory: $OUTPUT_DIR/generated"
echo "Validator count: $QBFT_VALIDATOR_COUNT"
echo "Bootnode address: $BOOTNODE_ADDRESS"
echo "Genesis chain ID: $QBFT_CHAIN_ID"
echo "Private key contents were not printed. Back up the generated directory securely."
