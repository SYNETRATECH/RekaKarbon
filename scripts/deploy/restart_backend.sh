#!/usr/bin/env bash
set -e

PROJECT_DIR_INPUT="${BACKEND_PROJECT_DIR:-}"
if [ -z "$PROJECT_DIR_INPUT" ]; then
  echo "ERROR: BACKEND_PROJECT_DIR is not set" >&2
  exit 1
fi
PROJECT_DIR=$(eval echo "$PROJECT_DIR_INPUT")

echo "Target backend host project directory: $PROJECT_DIR"
echo "Restarting rekakarbon-backend systemd service on backend host..."
echo "$BACKEND_SSH_PASSWORD" | sudo -S systemctl restart rekakarbon-backend

echo "Waiting for backend to be healthy..."
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
  exit 1
fi
