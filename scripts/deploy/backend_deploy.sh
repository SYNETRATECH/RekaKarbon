#!/usr/bin/env bash
set -e

# 1. Resolve PROJECT_DIR evaluating shell variables like $HOME
PROJECT_DIR_INPUT="${BACKEND_PROJECT_DIR:-}"
if [ -z "$PROJECT_DIR_INPUT" ]; then
  echo "ERROR: BACKEND_PROJECT_DIR is not set" >&2
  exit 1
fi
PROJECT_DIR=$(eval echo "$PROJECT_DIR_INPUT")

echo "Target project directory: $PROJECT_DIR"
echo "Release ID: $RELEASE_ID"

# 2. Ensure base directory structure exists
mkdir -p "$PROJECT_DIR/releases/$RELEASE_ID"
mkdir -p "$PROJECT_DIR/shared"

# 3. Create/update shared .env file if secrets.BACKEND_ENV is provided
if [ -n "${BACKEND_ENV:-}" ]; then
  printf '%s\n' "$BACKEND_ENV" > "$PROJECT_DIR/shared/.env"
fi

# 4. Extract release artifact into specific release folder
tar -xzf "/tmp/rekakarbon-backend-${RELEASE_ID}.tar.gz" -C "$PROJECT_DIR/releases/$RELEASE_ID"
rm -f "/tmp/rekakarbon-backend-${RELEASE_ID}.tar.gz"

# 5. Link shared .env to server release folder
if [ -f "$PROJECT_DIR/shared/.env" ]; then
  ln -sfn "$PROJECT_DIR/shared/.env" "$PROJECT_DIR/releases/$RELEASE_ID/server/.env"
fi

# 5a. Ensure shared directory for persistent ML models and production feedback data
mkdir -p "$PROJECT_DIR/shared/ml_models" "$PROJECT_DIR/shared/ml_data"

# Seed initial model artifacts into shared if shared is empty
if [ ! -f "$PROJECT_DIR/shared/ml_models/anomaly_pipeline.onnx" ] && [ -d "$PROJECT_DIR/releases/$RELEASE_ID/ml/models" ]; then
  echo "Seeding initial ML models into shared/ml_models..."
  cp -r "$PROJECT_DIR/releases/$RELEASE_ID/ml/models/"* "$PROJECT_DIR/shared/ml_models/" 2>/dev/null || true
fi

# Link shared models and production data into release directory so retrained models persist across deployments
ln -sfn "$PROJECT_DIR/shared/ml_models" "$PROJECT_DIR/releases/$RELEASE_ID/ml/models"
mkdir -p "$PROJECT_DIR/releases/$RELEASE_ID/ml/data"
ln -sfn "$PROJECT_DIR/shared/ml_data" "$PROJECT_DIR/releases/$RELEASE_ID/ml/data/production"

# 6. Sync Nginx configuration if provided
if [ -f "$PROJECT_DIR/releases/$RELEASE_ID/server/nginx.conf" ]; then
  echo "Updating Nginx configuration..."
  sudo cp "$PROJECT_DIR/releases/$RELEASE_ID/server/nginx.conf" /etc/nginx/sites-available/api.rekakarbon.farrelad.com
  sudo ln -sf /etc/nginx/sites-available/api.rekakarbon.farrelad.com /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx || echo "Nginx reload skipped or failed"
fi

# 7. Install/use Node version from .nvmrc
export NVM_DIR="$HOME/.nvm"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "ERROR: NVM not found at $NVM_DIR" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$NVM_DIR/nvm.sh"

echo "NVM version: $(nvm --version)"

cd "$PROJECT_DIR/releases/$RELEASE_ID"

nvm install
nvm use

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

# 8. Enable Corepack / pnpm
corepack enable
echo "pnpm: $(pnpm --version)"

# 9. Install dependencies and generate Prisma client on target host
echo "Installing dependencies on target host..."
pnpm install --frozen-lockfile

echo "Generating Prisma Client for host architecture..."
pnpm --filter ./server prisma:generate

# 9a. Install/update Python ML dependencies on host if poetry is installed
if command -v poetry >/dev/null 2>&1 && [ -f "$PROJECT_DIR/releases/$RELEASE_ID/ml/pyproject.toml" ]; then
  echo "Installing Python ML dependencies via Poetry on host..."
  (cd "$PROJECT_DIR/releases/$RELEASE_ID/ml" && poetry install --no-interaction --only main) || echo "Poetry install skipped or warning"
fi

# 10. Run database migrations inside release dir
pnpm --filter ./server prisma:migrate:deploy

# 11. Update current symlink atomically
ln -sfn "$PROJECT_DIR/releases/$RELEASE_ID" "$PROJECT_DIR/current"

# 12. Restart systemd application service
echo "Restarting rekakarbon-backend systemd service..."
sudo systemctl restart rekakarbon-backend

# 13. Health check
echo "Waiting for backend to start..."
MAX_RETRIES=12
RETRY_COUNT=0
HTTP_STATUS="000"

while [ "$RETRY_COUNT" -lt "$MAX_RETRIES" ]; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8006/health || true)
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "Backend health check passed (HTTP $HTTP_STATUS)"
    break
  fi
  echo "Backend not ready yet (HTTP $HTTP_STATUS), waiting 5 seconds... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
  sleep 5
  RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ "$HTTP_STATUS" != "200" ]; then
  echo "Backend health check failed after $((MAX_RETRIES * 5)) seconds (HTTP $HTTP_STATUS)"
  echo "$BACKEND_SSH_PASSWORD" | sudo -S systemctl status rekakarbon-backend --no-pager || true
  echo "$BACKEND_SSH_PASSWORD" | sudo -S journalctl -u rekakarbon-backend -n 50 --no-pager || true
  exit 1
fi

# 14. Optional database seeder
if [ "${RUN_SEED:-}" = "true" ]; then
  echo "Running database seeder..."
  pnpm db:seed
fi

# 15. Cleanup old releases - keep only 3 latest releases
echo "Cleaning up old releases (keeping 3 latest)..."
cd "$PROJECT_DIR/releases"
# shellcheck disable=SC2012
ls -dt "$PROJECT_DIR/releases"/* 2>/dev/null | tail -n +4 | xargs -r rm -rf

echo "Deployment completed successfully!"
