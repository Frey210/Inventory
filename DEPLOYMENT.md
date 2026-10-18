# Deployment dan pemulihan MTC Inventory

## Target

Repository: https://github.com/Frey210/Inventory. Host aplikasi: LXC Docker yang dirujuk catatan lokal; direktori khusus `/opt/mtc-inventory`. PostgreSQL produksi **wajib pada LXC PostgreSQL**, bukan container database di LXC Docker. Container `inventory-test-db` yang dibuat selama development hanya database pengujian terisolasi, tidak menjadi database produksi.

Origin Cloudflare Tunnel yang direncanakan: `http://192.168.10.68:3030`, hostname `inventory.farlabs.my.id`. Ini baru rencana origin sampai service benar-benar terpasang dan healthcheck diverifikasi; jangan mengumumkannya sebagai deployment aktif sebelum itu. Jangan memakai localhost:3030 pada tunnel yang berjalan di host lain.

## Konfigurasi privat dan peran database

`.env.production` hanya pada host aplikasi, permission 600. Isi INVENTORY_DATABASE_URL, BETTER_AUTH_URL=https://inventory.farlabs.my.id, BETTER_AUTH_SECRET acak, APP_MODE=preparation dan STORAGE_PATH=/app/storage. Jangan menyalin secret ke Dockerfile/build args. File akun awal tidak masuk image atau Git.

Buat database Inventory tersendiri. Pisahkan role migrasi/owner dari role runtime non-superuser. Role runtime hanya CONNECT/USAGE dan privilege tabel/sequence yang diperlukan; tanpa DDL public dan tanpa UPDATE/DELETE untuk Audit/Ledger/LoanEvent. Schema pg-boss dimiliki role worker dan diinisialisasi melalui `scripts/init-queue.mjs` satu kali sebelum worker berjalan tanpa migrasi otomatis. Role worker tidak memiliki DDL public. Terapkan `scripts/grant-runtime.sql` melalui administrator database setelah migrasi; backup memakai role read-only tersendiri. Koneksi memakai hostname sertifikat PostgreSQL yang dipetakan melalui extra_hosts, sslmode verify-full dan sertifikat publik yang dipasang read-only. File .env.migrate/.env.worker/.env.backup mengoverride koneksi base sesuai fungsi; semuanya private.

## Rilis

1. Pipeline lint/type/unit/integrasi/build hijau; tinjau diff, secret exclusion dan versi image bertag commit. Periksa ruang disk dan kapasitas host bersama aplikasi lain.
2. Buat backup terbaru DB+private storage yang sudah dapat direstore. Jangan menjalankan migrasi Inventory pada database Finance/Absensi.
3. Build image web dan tools dari commit yang sama. Jalankan migrasi satu kali melalui service migrate dengan credential migrasi, bukan saat startup tiap replica.
4. Provision akun sekali dari file privat, lalu hapus file provisioning dari host apabila telah diserahkan aman. Seed tidak mengisi saldo/katalog contoh operasional.
5. Jalankan app dan worker. Periksa `/api/health`, login, session/secure cookie, header proxy/origin, ganti password/MFA, upload privat, antrean PDF dan heartbeat. Pastikan aplikasi lain tetap sehat dan port tidak bertabrakan.
6. Setelah service sehat, arahkan Cloudflare Tunnel ke origin di atas. Cloudflare dashboard dikelola pengguna; tidak diubah otomatis oleh aplikasi.
7. Tetap mode preparation sampai seluruh gate bisnis, UAT, backup off-host dan perangkat nyata lulus. Jangan mengganti ke live hanya untuk menghilangkan banner.

`docker compose --profile tools run --rm migrate` menjalankan migrasi yang versioned. `docker compose up -d app worker` menjalankan service. Worker memakai image tools terpisah dari output standalone web. Chromium membutuhkan sandbox yang sesuai; jangan memakai privileged container atau mematikan sandbox untuk mengatasi masalah tanpa pemeriksaan host.

## Backup dan restore

Service backup menggunakan client PostgreSQL 17; cocokkan major client dengan server sebelum pemakaian. Jalankan `docker compose --profile tools run --rm backup` dari root deployment. Script menyimpan dump custom, arsip storage, checksum dan marker last-success. Atur scheduler host setiap empat jam operasional dan backup harian setelah timezone bisnis disetujui. Kegagalan job harus dipantau; keberadaan script saja bukan backup otomatis yang sudah berjalan.

Salin backup terenkripsi ke host/media lain; direktori backups pada host aplikasi tidak cukup. Restore ke database kosong pada lingkungan terisolasi, restore file, cocokkan manifest dan periksa login/saldo/loan/PDF lama. Jangan restore di atas transaksi baru untuk rollback sehari-hari. Selama backup, lampiran arsip tidak boleh dihapus; file yang belum dirujuk bukan bukti yang boleh hilang dari snapshot lama.

RPO usulan empat jam, RTO usulan 4–8 jam; hanya dinyatakan tercapai setelah diuji pada deployment sebenarnya. Pengujian development telah memakai database kosong terpisah, tetapi tidak membuktikan kesiapan backup off-host/produksi.

## Rollback dan diagnosis

Pertahankan image commit sebelumnya. Kembalikan image hanya bila schema kompatibel; migrasi destructive memerlukan expand–migrate–contract. Sebelum rollback hentikan posting bila integritas belum pasti, simpan log bebas secret, periksa ledger/balance/reservation dan antrean, lalu rekonsiliasi. Jangan membatalkan loan committed hanya karena PDF pending/failed.

Pantau health DB/web, RAM/disk, umur backup, umur outbox/failed jobs dan `worker-heartbeat` pada private storage. Catatan credential SSH tetap hanya di file lokal yang dikecualikan Git. Saat sesi terputus, baca STATUS_IMPLEMENTASI.md sebelum melanjutkan rilis.
