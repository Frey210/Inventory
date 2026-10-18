#!/bin/sh
set -eu
umask 077
cd /opt/mtc-inventory
exec 9>.backup.lock
flock -n 9 || exit 0
docker compose --profile tools run --rm backup
stamp=$(cat backups/last-success)
case "$stamp" in *[!0-9TZ]*|'') exit 1;; esac
bundle="backups/bundle-$stamp.tar.pending"
trap 'rm -f "$bundle"' EXIT
tar -cf "$bundle" -C backups "db-$stamp.dump" "files-$stamp.tar.gz" "manifest-$stamp.sha256" -C /opt/mtc-inventory .env.production .env.worker .env.migrate .env.backup .env db-ca.crt .backup-recipient.crt compose.yaml deploy/chromium-seccomp.json
openssl cms -encrypt -stream -binary -aes-256-gcm -in "$bundle" -out "backups/mtc-inventory-$stamp.tar.cms.pending" -outform DER -recip .backup-recipient.crt -keyopt rsa_padding_mode:oaep -keyopt rsa_oaep_md:sha256
mv "backups/mtc-inventory-$stamp.tar.cms.pending" "backups/mtc-inventory-$stamp.tar.cms"
(cd backups && sha256sum "mtc-inventory-$stamp.tar.cms" > "mtc-inventory-$stamp.tar.cms.sha256")
printf '%s\n' "$stamp" > backups/last-encrypted-success
find backups -maxdepth 1 -type f -mtime +7 \( -name 'db-*.dump' -o -name 'files-*.tar.gz' -o -name 'manifest-*.sha256' -o -name 'mtc-inventory-*.tar.cms' -o -name 'mtc-inventory-*.tar.cms.sha256' \) -delete
logger -t mtc-inventory-backup "Backup encrypted: $stamp"
