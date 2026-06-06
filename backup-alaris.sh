#!/bin/bash
set -euo pipefail

ALARIS_DIR="/home/symunona/wwwroot/alaris"
BACKUP_DIR="/home/symunona/backup/alaris"
DATE=$(date +%Y%m%d)

mkdir -p "$BACKUP_DIR"

tar czf "$BACKUP_DIR/alaris-$DATE.tar.gz" \
    -C "$ALARIS_DIR" \
    db.json db_2.json \
    public/content

# Keep 30 days of backups
find "$BACKUP_DIR" -name "alaris-*.tar.gz" -mtime +30 -delete

echo "$(date): backup done → $BACKUP_DIR/alaris-$DATE.tar.gz"
