#!/bin/sh
# Database backup script — runs inside the db-backup container
# Keeps last 7 days of daily backups

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y-%m-%d_%H%M)
FILENAME="fundiwangu_${DATE}.sql.gz"

echo "[$(date)] Starting database backup..."

pg_dump \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup created: ${FILENAME} ($(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1))"

# Remove backups older than 7 days
find "${BACKUP_DIR}" -name "fundiwangu_*.sql.gz" -mtime +7 -delete

echo "[$(date)] Cleanup complete. Current backups:"
ls -lh "${BACKUP_DIR}"/fundiwangu_*.sql.gz 2>/dev/null || echo "  (none)"
