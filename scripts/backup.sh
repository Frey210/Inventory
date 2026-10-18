#!/bin/sh
set -eu
umask 077
: "${INVENTORY_DATABASE_URL:?Inventory database URL required}"
backup_dir="${BACKUP_PATH:-/backup}"
mkdir -p "$backup_dir"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump --dbname="$INVENTORY_DATABASE_URL" --format=custom --file="$backup_dir/db-$stamp.dump.pending"
mv "$backup_dir/db-$stamp.dump.pending" "$backup_dir/db-$stamp.dump"
tar --exclude='*.tmp' --exclude='worker-heartbeat' -czf "$backup_dir/files-$stamp.tar.gz.pending" -C /storage .
mv "$backup_dir/files-$stamp.tar.gz.pending" "$backup_dir/files-$stamp.tar.gz"
sha256sum "$backup_dir/db-$stamp.dump" "$backup_dir/files-$stamp.tar.gz" > "$backup_dir/manifest-$stamp.sha256"
printf '%s\n' "$stamp" > "$backup_dir/last-success"
echo "Inventory backup completed; copy encrypted backup off-host."
