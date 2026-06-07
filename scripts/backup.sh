#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/symunona/wwwroot/alaris"
BACKUP_DIR="$HOME/backup"
MAX_VERSIONS=4
LABEL="alaris"

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y-%m-%d)
TMP=$(mktemp /tmp/backup-XXXXXX.tar.gz)

# Checkpoint WAL into main db file before backup
sqlite3 "$PROJECT_DIR/alaris.db" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true

tar -czf "$TMP" \
    -C "$PROJECT_DIR" \
    alaris.db \
    config.json \
    public/content

NEW_HASH=$(sha256sum "$TMP" | cut -d' ' -f1)

# Compare with most recent backup
LAST=$(ls -t "$BACKUP_DIR"/*-${LABEL}.tar.gz 2>/dev/null | head -1 || true)
if [[ -n "$LAST" ]]; then
    LAST_HASH=$(sha256sum "$LAST" | cut -d' ' -f1)
    if [[ "$NEW_HASH" == "$LAST_HASH" ]]; then
        echo "No changes since last backup. Skipping."
        rm "$TMP"
        exit 0
    fi
fi

DEST="$BACKUP_DIR/${DATE}-${LABEL}.tar.gz"
mv "$TMP" "$DEST"
echo "Saved: $DEST"

# Prune old versions — keep only MAX_VERSIONS newest
ls -t "$BACKUP_DIR"/*-${LABEL}.tar.gz 2>/dev/null | tail -n +$((MAX_VERSIONS + 1)) | xargs -r rm --
