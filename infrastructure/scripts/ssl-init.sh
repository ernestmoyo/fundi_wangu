#!/bin/bash
# Initialize SSL certificates using Let's Encrypt
# Run once on initial server setup

set -euo pipefail

DOMAINS=(
  "api.fundiwangu.co.tz"
  "fundiwangu.co.tz"
  "www.fundiwangu.co.tz"
  "admin.fundiwangu.co.tz"
)

EMAIL="${1:?Usage: ssl-init.sh <email>}"
CERTBOT_DIR="$(dirname "$0")/../certbot"

mkdir -p "${CERTBOT_DIR}/www" "${CERTBOT_DIR}/conf"

echo "Requesting SSL certificates for: ${DOMAINS[*]}"

DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
  DOMAIN_ARGS="${DOMAIN_ARGS} -d ${domain}"
done

docker run --rm \
  -v "${CERTBOT_DIR}/www:/var/www/certbot" \
  -v "${CERTBOT_DIR}/conf:/etc/letsencrypt" \
  certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    ${DOMAIN_ARGS}

echo ""
echo "SSL certificates issued successfully."
echo "Certificates are stored in: ${CERTBOT_DIR}/conf/"
echo "Auto-renewal is handled by the certbot container in docker-compose."
