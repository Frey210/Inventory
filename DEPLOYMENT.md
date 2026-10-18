# Deployment dan pemulihan MTC Inventory

## Rilis aktif

Aplikasi berjalan dalam mode **preparation** pada `/opt/mtc-inventory`, LXC Docker `192.168.10.68`. Image aplikasi/worker bertag `a1fb4800c3d5`; kode ada pada https://github.com/Frey210/Inventory. Konfigurasi runtime dan script operasi mengikuti repository. Lihat `docs/VERIFIKASI_RILIS.md` untuk bukti pengujian.

Cloudflare Tunnel: hostname `inventory.farlabs.my.id`, service **HTTP**, URL `192.168.10.68:3030`. Origin `http://192.168.10.68:3030` telah diuji dari CT160 dan CT161. URL publik `/login` juga telah merespons HTTP 200. Jika hostname diubah, perbarui BETTER_AUTH_URL agar origin dan cookie tetap sesuai.

PostgreSQL tetap pada **CT102, 192.168.10.69**, database terpisah `mtc_inventory`. Jalur administrasi melalui LXC Docker → SSH Proxmox legacy → `pct exec 102`. Catatan akses ada di `repo&deploy.txt` lokal, tidak di Git. Database uji `inventory-test-db` di Docker telah dihentikan setelah verifikasi; bukan database produksi.

## Konfigurasi dan peran

File runtime privat permission 600, tidak masuk image/repository:

- `.env.production`: koneksi role web, BETTER_AUTH_URL/SECRET, APP_MODE dan STORAGE_PATH.
- `.env.worker`: koneksi role worker, URL publik, mode, storage dan CHROMIUM_SANDBOX=on. Worker tidak menerima secret autentikasi web.
- `.env.migrate`: koneksi pemilik schema khusus migrasi/provisioning.
- `.env.backup`: PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD/PGSSLMODE/PGSSLROOTCERT untuk role backup read-only. Password tidak dimasukkan ke argumen pg_dump.
- `.env`: IMAGE_TAG dari commit aplikasi yang dipasang.

Koneksi DB memakai `postgresql.epi` melalui extra_hosts, TLS `verify-full` dan `db-ca.crt` read-only. Sertifikat server sudah diverifikasi. Tidak ada DDL public untuk role web/worker; web tidak dapat update/delete audit, ledger atau event loan. Worker tidak dapat membaca tabel credential Account. Backup memiliki SELECT tanpa UPDATE.

Schema `inventory_jobs` dimiliki worker; inisialisasi antrean satu kali memakai `node scripts/init-queue.mjs`. Worker berjalan tanpa migrasi schema otomatis. Setelah migrasi, administrator PostgreSQL menerapkan `scripts/grant-runtime.sql` pada database Inventory. Script ini menolak database lain.

## Prosedur rilis berikutnya

1. CI hijau dan source bebas secret. Build image dari source commit yang sama pada direktori release; tag `mtc-inventory-web:<commit>` dan `mtc-inventory-tools:<commit>`. Dockerfile memisahkan cache browser dari perubahan kode aplikasi.
2. Jalankan backup terenkripsi dan pastikan dapat dipulihkan sebelum migrasi data. Jangan mengarahkan migrasi ke DB aplikasi lain.
3. Perbarui IMAGE_TAG, lalu `docker compose --profile tools run --rm migrate`. Terapkan grant runtime bila schema berubah.
4. Provision akun baru hanya dari file privat lewat SEED_USERS_FILE; seed tidak mereset password yang sudah ada. Hapus file provisioning dari host sesudah dipakai. Tidak ada stok operasional yang otomatis di-seed.
5. `docker compose up -d app worker`. Verifikasi health, origin dari node Tunnel, auth/origin/cookie, batas password awal, privilege DB, upload/bukti, heartbeat dan aplikasi tetangga.
6. Jangan menyebut V1 operasional hanya karena deployment sehat. Selesaikan saldo/loan pembukaan, keputusan bisnis/QMS, UAT, perangkat nyata dan operasi backup off-host.

Chromium berjalan non-root dengan sandbox aktif, cap-drop ALL dan profil seccomp khusus di `deploy/`. Tidak memakai privileged, SYS_ADMIN atau IPC host. `CHROMIUM_SANDBOX=off` terbatas pada fixture CI tepercaya; tidak digunakan worker deployment.

## Backup dan pemulihan

Backup otomatis empat jam menggunakan `mtc-inventory-backup.timer`; unit ada di `deploy/`. Jadwal UTC 00/04/08/12/16/20:17 dengan jitter satu menit. Jalankan manual melalui `systemctl start mtc-inventory-backup.service`. Periksa `systemctl list-timers mtc-inventory-backup.timer`, `systemctl show mtc-inventory-backup.service -p Result` dan `journalctl -u mtc-inventory-backup.service`.

`run-backup.sh` memakai flock, pg_dump custom PostgreSQL 17, arsip private storage, checksum, dan konfigurasi recovery termasuk secret autentikasi. Bundle dienkripsi CMS AES-256-GCM dengan RSA-OAEP SHA-256. Server hanya menyimpan sertifikat recipient publik; private key dekripsi tetap di luar server. Marker sukses pipeline adalah `backups/last-encrypted-success`. Backup lokal lebih dari tujuh hari dibersihkan hanya setelah backup baru berhasil.

Salinan terenkripsi telah dipindahkan ke `.local/production-backups` pada workstation dan diuji autentikasi/dekripsinya. Kunci dekripsi ada pada `.local/backup-private.key` dan sertifikat pasangannya `.local/backup-recipient.crt`, keduanya diabaikan Git. **Simpan salinan kunci ke vault/media aman terpisah sebelum memakai data riil**; kehilangan kunci membuat backup terenkripsi tidak dapat dipulihkan. Pengiriman off-host berulang dan kanal alarm eksternal belum dikonfigurasi; salinan awal bukan bukti pengiriman otomatis berkelanjutan.

Urutan restore:

1. Verifikasi SHA-256 file CMS, lalu dekripsi memakai `openssl cms -decrypt -binary -inform DER -in <backup.cms> -inkey <private.key> -recip <recipient.crt> -out <restore.tar>`. Jangan ekstrak output jika dekripsi gagal.
2. Ekstrak hanya ke direktori privat terisolasi, cocokkan manifest dump/berkas. Konfigurasi berisi secret: jangan dicetak atau di-commit.
3. Buat DB kosong khusus restore. Gunakan pg_restore exit-on-error; buat role/grant yang sesuai dan atur ulang URL serta TLS lingkungan restore.
4. Pulihkan private storage; cocokkan saldo/ledger/reservasi/loan, file/checksum, akun/MFA, worker dan bukti lama. Pertahankan BETTER_AUTH_SECRET dari backup agar secret MFA dapat didekripsi.
5. Restore di atas transaksi baru bukan prosedur rollback harian. Pengujian awal memakai database restore kosong terpisah dan telah dibersihkan setelah lulus.

RPO usulan empat jam dan RTO usulan 4–8 jam belum menjadi SLA operasional. Alarm eksternal dan pengiriman off-host rutin perlu ditutup sebelum cutover riil.

## Rollback dan diagnosis

Pertahankan image sebelumnya. Rollback image hanya jika schema kompatibel; gunakan expand–migrate–contract untuk perubahan schema. Jangan membatalkan loan committed karena PDF pending/failed. Simpan bukti kegagalan bebas secret, periksa ledger/reservasi/outbox, lalu rekonsiliasi.

Pantau health app/worker, disk/RAM, umur backup, failed jobs dan heartbeat. Semua metadata operasional ada di STATUS_IMPLEMENTASI.md dan dokumen verifikasi; credential tetap di catatan/file privat.
