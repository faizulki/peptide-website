#!/usr/bin/env bash
# Runs on the production server (piped over SSH by .github/workflows/deploy.yml).
#
# Snapshots the deployment's files (code, compose file, Caddyfile, .env)
# before they're overwritten, keeping the most recent few. Docker volumes —
# the database and uploads — aren't touched by a deploy, so they're not
# included here.
#
# Usage: backup.sh <project_dir>
set -euo pipefail

PROJECT_DIR="$1"
BACKUP_DIR=/var/backups/peptide-deploy
KEEP=5

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

archive="$BACKUP_DIR/$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
tar -czf "$archive" \
  --exclude=node_modules --exclude=.next --exclude=dist --exclude=.git \
  -C "$(dirname "$PROJECT_DIR")" "$(basename "$PROJECT_DIR")"
echo "Backed up $PROJECT_DIR to $archive"

ls -1t "$BACKUP_DIR"/*.tar.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f
