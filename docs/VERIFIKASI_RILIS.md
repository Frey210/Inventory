# Verifikasi rilis persiapan

Tanggal: 18 Oktober 2026. Status: **siap untuk pilot dalam mode preparation**, bukan persetujuan cutover operasional.

## Kode dan pengujian

- Image web/worker berasal dari commit `6934cf53b011bec80a6e61dec45644a77ed483c3` pada repository Frey210/Inventory. Perubahan dokumentasi dan script backup setelah commit tersebut tidak mengganti image aplikasi.
- [CI rilis aplikasi](https://github.com/Frey210/Inventory/actions/runs/39110280482) lulus: lint, TypeScript, build standalone/worker, sembilan tes domain/integrasi PostgreSQL, tiga fixture renderer nota dan satu alur Playwright.
- Tes mencakup posting/idempotency, persaingan saldo, reservasi/issue, return/inspeksi, audit, opname, master nonaktif, revisi request, import dan dedup reminder. Tes ini tidak mencakup seluruh acceptance backlog.
- Audit dependency terakhir tidak melaporkan kerentanan. Ini hasil pemeriksaan saat rilis, bukan jaminan terhadap kerentanan mendatang.

## Deployment dan akses

- App dan worker healthy di `/opt/mtc-inventory`, LXC Docker `192.168.10.68`; tag image `6934cf53b011`.
- Origin HTTP `http://192.168.10.68:3030/api/health` berhasil diakses dari kedua node Tunnel CT160 dan CT161. URL publik `https://inventory.farlabs.my.id/login` merespons HTTP 200 dengan halaman MTC Inventory.
- PostgreSQL 17.10 berada pada CT102 `192.168.10.69`. Jalur administrasi yang berhasil: LXC Docker → Proxmox legacy → `pct exec 102`. Catatan akses lokal telah diperbarui tanpa menyalin credential ke repository.
- Koneksi database memverifikasi TLS dan hostname `postgresql.epi`. Role migrasi, web, worker dan backup terpisah. Pengujian privilege membuktikan web/worker tidak memiliki DDL public, web tidak dapat mengubah audit, worker tidak dapat membaca Account, dan backup dapat SELECT tanpa UPDATE.
- Database uji Docker dan server pengembangan lokal dihentikan sesudah verifikasi. Aplikasi internal lain tetap berjalan; migrasi Inventory memakai database khususnya sendiri.

## Akun

Roster dicocokkan read-only dengan Absensi produksi: 13 pengguna aktif ditambah tiga akun bootstrap fungsi, total **16 akun manusia aktif**. Password Inventory dibuat terpisah dari Absensi. Satu identitas contoh development dinonaktifkan; histori tetap dipertahankan. Akun SYSTEM tidak interaktif.

Lima belas akun yang masih memakai password awal lulus login produksi, cookie secure/host-only, pembatasan akses sebelum mengganti password, penolakan ekspor dan logout. Akun admin pemilik sebelumnya lulus login, lalu pemilik mengganti password melalui Profil; perubahan dan sesi manusianya dipertahankan. Password pribadinya tidak diuji ulang atau direset. Daftar akun ada di `account.md` privat, diabaikan Git.

## Nota dan antarmuka

Renderer yang sama dengan worker produksi diuji pada image Linux terakhir dengan sandbox Chromium aktif, non-root, cap-drop ALL dan seccomp. Fixture awal/parsial/final menghasilkan **2/6/2 halaman Letter**, termasuk 35 unit dan teks panjang; bagian A–G, pengulangan header tabel serta footer LOAN/versi/halaman diperiksa. PDF dan screenshot sintetis tersimpan lokal, tidak di Git.

Review independen menyetujui tampilan dan layout cetak untuk pilot. Kamera/USB scanner, printer fisik dan hasil grayscale belum diuji pada perangkat perusahaan.

## Backup dan pemulihan

- Timer systemd empat jam aktif; eksekusi terjadwal dan eksekusi manual berhasil. Marker pipeline terenkripsi tersedia. Dump memakai role backup read-only dan TLS verify-full.
- Bundle berisi dump, private storage, checksum dan konfigurasi recovery. Enkripsi CMS AES-256-GCM/RSA-OAEP SHA-256 diuji dengan dekripsi terautentikasi dan penolakan perubahan ciphertext. Private key hanya berada di workstation; server menyimpan recipient publik.
- Snapshot `20261018T081753Z` dipulihkan ke database kosong terisolasi dan berkas/checksum diperiksa. Hitungan saat snapshot: User 18, Account 17, master 8, audit 18, balance 0, asset 0 dan loan 0. Angka ini bukan hitungan produksi setelah pengguna mulai beraktivitas. Database restore uji telah dihapus.
- Bundle konfigurasi `20261018T082450Z` telah disalin off-host dan didekripsi untuk memverifikasi kelengkapan recovery. SHA-256: `9883bb123d2994d869d1bd3750c5d9fce379a534f62d4980fba8b5d61e79cde4`.
- File akun, catatan akses, environment, private key dan backup tidak masuk Git/image. Runbook ada di `DEPLOYMENT.md`.

## Gate yang tetap terbuka

Sebelum data operasional: sahkan kewenangan/keputusan bisnis dan QMS, setup master, rekonsiliasi saldo serta pinjaman pembukaan, jalankan UAT backlog dan uji perangkat nyata. Selesaikan acceptance UI/fault/load yang tercatat di `STATUS_IMPLEMENTASI.md` dan observasi pascacutover.

Backup off-host awal sudah terbukti; **pengiriman off-host berulang dan alarm eksternal belum dikonfigurasi**. Simpan salinan private key dekripsi di vault/media aman terpisah sebelum cutover. RPO/RTO usulan belum menjadi SLA yang telah diuji menyeluruh.
