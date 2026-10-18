#!/bin/sh
set -eu
umask 077
: "${PGDATABASE:?Inventory database required}"
: "${PGUSER:?Backup database role required}"
test "$PGDATABASE" = mtc_inventory
backup_dir="${BACKUP_PATH:-/backup}"
mkdir -p "$backup_dir"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump --format=custom --file="$backup_dir/db-$stamp.dump.pending"
mv "$backup_dir/db-$stamp.dump.pending" "$backup_dir/db-$stamp.dump"
tar --exclude='*.tmp' --exclude='worker-heartbeat' -czf "$backup_dir/files-$stamp.tar.gz.pending" -C /storage .
mv "$backup_dir/files-$stamp.tar.gz.pending" "$backup_dir/files-$stamp.tar.gz"
sha256sum "$backup_dir/db-$stamp.dump" "$backup_dir/files-$stamp.tar.gz" > "$backup_dir/manifest-$stamp.sha256"
printf '%s\n' "$stamp" > "$backup_dir/last-success"
echo "Inventory backup completed; copy encrypted backup off-host."
