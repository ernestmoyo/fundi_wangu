#!/bin/bash
# Initial server setup for Fundi Wangu production deployment
# Run on a fresh Ubuntu 22.04+ server
# Usage: sudo bash server-setup.sh

set -euo pipefail

echo "═══════════════════════════════════════════════"
echo "  Fundi Wangu — Server Setup"
echo "═══════════════════════════════════════════════"
echo ""

# System updates
echo "[1/7] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# Install Docker
echo "[2/7] Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# Install Docker Compose plugin
echo "[3/7] Installing Docker Compose..."
if ! docker compose version &> /dev/null; then
  apt-get install -y -qq docker-compose-plugin
fi

# Install common tools
echo "[4/7] Installing utilities..."
apt-get install -y -qq \
  curl wget git htop iotop \
  ufw fail2ban

# Configure firewall
echo "[5/7] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
echo "[6/7] Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Create application directory
echo "[7/7] Setting up application directory..."
DEPLOY_DIR="/opt/fundiwangu"
mkdir -p "${DEPLOY_DIR}"
mkdir -p "${DEPLOY_DIR}/infrastructure/backups/postgres"
mkdir -p "${DEPLOY_DIR}/infrastructure/certbot/www"
mkdir -p "${DEPLOY_DIR}/infrastructure/certbot/conf"

echo ""
echo "═══════════════════════════════════════════════"
echo "  Server setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Clone the repo to ${DEPLOY_DIR}"
echo "  2. Copy .env.production.example to .env.production"
echo "  3. Fill in production secrets"
echo "  4. Run ssl-init.sh to get SSL certificates"
echo "  5. Run: docker compose -f docker-compose.production.yml up -d"
echo "═══════════════════════════════════════════════"
