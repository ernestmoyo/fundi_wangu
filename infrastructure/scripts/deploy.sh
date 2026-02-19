#!/bin/bash
# Deployment script for Fundi Wangu
# Usage: ./deploy.sh <version> [environment]
# Example: ./deploy.sh v0.1.0 production
#          ./deploy.sh abc123f staging

set -euo pipefail

VERSION="${1:?Usage: deploy.sh <version> [environment]}"
ENVIRONMENT="${2:-staging}"
DEPLOY_DIR="/opt/fundiwangu"
COMPOSE_FILE="docker-compose.production.yml"

echo "═══════════════════════════════════════════════"
echo "  Fundi Wangu — Deployment"
echo "  Version:     ${VERSION}"
echo "  Environment: ${ENVIRONMENT}"
echo "  Time:        $(date)"
echo "═══════════════════════════════════════════════"

cd "${DEPLOY_DIR}/infrastructure"

# Pull latest images
echo ""
echo "[1/6] Pulling API image..."
export API_VERSION="${VERSION}"
docker compose -f "${COMPOSE_FILE}" pull api

# Run database migrations
echo ""
echo "[2/6] Running database migrations..."
docker compose -f "${COMPOSE_FILE}" run --rm api node dist/db/migrate.js

# Scale down gracefully
echo ""
echo "[3/6] Scaling down to single instance..."
docker compose -f "${COMPOSE_FILE}" up -d --scale api=1 --no-recreate

# Wait for old requests to drain
echo ""
echo "[4/6] Waiting 10s for in-flight requests..."
sleep 10

# Deploy new version
echo ""
echo "[5/6] Deploying new version..."
docker compose -f "${COMPOSE_FILE}" up -d --force-recreate api worker-notifications worker-escrow worker-payouts

# Scale back up
echo ""
echo "[6/6] Scaling API to 2 replicas..."
docker compose -f "${COMPOSE_FILE}" up -d --scale api=2

# Health check
echo ""
echo "Waiting for health check..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo "Health check passed."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Health check failed after 30 attempts!"
    echo "Rolling back..."
    export API_VERSION="latest"
    docker compose -f "${COMPOSE_FILE}" up -d --force-recreate api
    exit 1
  fi
  sleep 2
done

echo ""
echo "═══════════════════════════════════════════════"
echo "  Deployment complete!"
echo "  Version ${VERSION} is live on ${ENVIRONMENT}"
echo "═══════════════════════════════════════════════"
