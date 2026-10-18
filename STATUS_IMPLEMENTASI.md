# Status implementasi MTC Inventory

Pembaruan: 18 Oktober 2026. Tahap: aplikasi persiapan/pilot telah di-deploy dan sehat pada LXC Docker dengan PostgreSQL CT102. Rilis redesign `a1fb4800c3d5` aktif dan telah lulus CI. Ini bukan pernyataan seluruh V1/UAT/gate operasional lulus.

## Implementasi tersedia

| Backlog   | Bukti implementasi                                                                                                                                                                                    | Acceptance yang masih perlu ditutup                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| INV-01–04 | Next/React/TS, Prisma PostgreSQL, CI; username internal, ganti password awal, TOTP/recovery, role/ownership, session DB/rate limit                                                                    | Pengesahan kewenangan bisnis dan UAT semua role pada domain HTTPS                                     |
| INV-05–06 | Master aktif/nonaktif/version, validasi referensi aktif untuk transaksi baru, pengembalian historis tetap dapat diterima, parent tanpa siklus, kategori/default, katalog/foto; filter/pagination/path lokasi; metadata SKU pada penerimaan                                                       | Drill-down tree penuh, draft lintas halaman, perangkat nyata dan acceptance semua state master                            |
| INV-07–09 | Ledger/reservasi/audit/outbox/idempotency atomik, constraint DB; dry run CSV per baris dan batch antiulang; draft/posting penerimaan                                                                  | Rekonsiliasi saldo awal riil dan format/data pinjaman legacy harus disahkan sebelum migrasi riil                          |
| INV-10–14 | Request terpisah tracking; approval tanpa self-approval, alokasi, expiry, acknowledgement, issue; permission darurat default mati + review; checkout kondisi/kelengkapan tiap unit, LOAN dan snapshot | UAT pemilik proses; kebijakan override/acknowledgement dan tenggat; seluruh skenario fault/retry lintas modul             |
| INV-15–19 | Label QR/manual/USB/kamera; return parsial, receipt fisik terpisah inspeksi; foto masalah, blocked/insiden, koreksi event dan exception; worker PDF/version/checksum/retry                            | Kamera/USB/printer/grayscale nyata; kebijakan exception/QMS/retensi; integrasi semua skenario bukti masalah               |
| INV-20–23 | Transfer quantity/unit; opname freeze/count/review/cancel quantity dan hadir/hilang unit; maintenance/kalibrasi/installed berproyek                                                                   | UAT gudang, rekonsiliasi lintas lokasi, metode kalibrasi/perangkat yang berlaku                                           |
| INV-24–25 | Notifikasi in-app H-2/H-1/overdue, kalibrasi H-30/14/7, stok minimum berbasis transisi; dashboard; ekspor saldo/aset/loan/reservasi/waste/proyek/opname/audit CSV/XLSX/cetak PDF                      | Kanal email belum disediakan; laporan cetak memakai browser, bukan antrean PDF arsip; validasi laporan/UAT dan beban riil |
| INV-26–27 | Docker non-root, role DB terpisah, TLS DB, script backup/restore dan runbook; private storage                                                                                                         | Status deployment/backup aktual dicatat di bagian rilis; pemantauan/alarm dan salinan off-host berulang perlu dibuktikan  |
| INV-28–32 | Dokumen operasi, pengujian inti dan mode persiapan                                                                                                                                                    | Migrasi riil, pelatihan, UAT-01–16, cutover dan observasi 30 hari belum dapat dianggap selesai oleh tes otomatis          |

Revisi request material membuat transaksi baru dan melepas reservasi lama; riwayat request sebelumnya berstatus superseded. Waktu input lokal ditafsirkan berdasarkan timezone konfigurasi, masa kalibrasi berbentuk tanggal berlaku sampai akhir hari setempat. Metadata checkout dibekukan; perubahan nama master tidak menulis ulang arsip ready.

## Verifikasi yang telah dilakukan

- Lint, TypeScript dan build Next standalone + bundle worker lulus pada CI rilis aplikasi terakhir. Lockfile dipin; audit dependency terakhir tanpa kerentanan yang dilaporkan.
- Tes PostgreSQL terisolasi membuktikan draft tanpa stok, posting idempoten, konflik payload retry, dua approval berebut saldo, issue terbatas, waste kumulatif, checkout terkontrol, physical return bersamaan, inspeksi parsial/final, audit immutable, opname quantity/unit/freeze/cancel, dry run/batch dan override/review. Batch terakhir menambah revisi request dan dedup reminder.
- Playwright lulus login/setup master, private export, simpan/buka pengaturan, empat viewport, TOTP dan recovery code. Screenshot simulasi disimpan lokal di `.impeccable/review`, tidak di Git.
- Renderer nota produksi diuji satu unit awal, 35 unit dengan teks panjang dan partial return, serta final. Letter 612×792 pt, A–G, footer LOAN/versi/halaman dan header tabel diperiksa. Review independen menyetujui UI serta layout cetak **untuk pilot**; bukan pengesahan operasional.
- Restore dump database uji ke database kosong terpisah telah lulus. Restore DB+file rilis produksi dan salinan off-host juga telah diverifikasi sebagaimana bagian infrastruktur di bawah.

## Infrastruktur dan rilis

Repository remote Frey210/Inventory terverifikasi kosong sebelum bootstrap. Commit aplikasi `6934cf53b011` sudah di-push dan di-deploy; CI https://github.com/Frey210/Inventory/actions/runs/39110280482 lulus sembilan tes domain/integrasi, lint, typecheck, build, renderer nota dan Playwright.

Jalur administrasi CT102 berhasil melalui LXC Docker → Proxmox legacy → pct exec; detail akses ada pada catatan lokal yang diabaikan Git. PostgreSQL 17 aktif; database `mtc_inventory` dan role migrasi/web/worker/backup terpisah telah dibuat. Koneksi TLS dari host aplikasi dengan verifikasi sertifikat sudah lulus. Database aplikasi lain tidak menjadi target migrasi.

Target aplikasi: `/opt/mtc-inventory` pada LXC Docker. Origin aktif `http://192.168.10.68:3030`, domain `inventory.farlabs.my.id`; app/worker healthy, origin diuji dari dua node Tunnel dan URL publik login merespons 200. Backup terenkripsi dan konfigurasi recovery sudah dibuat, disalin off-host serta diuji; restore DB kosong dan berkas lulus. Timer empat jam aktif dan service backup berhasil. Pengiriman off-host berulang/kanal alarm eksternal masih perlu ditetapkan. Mode preparation tetap berlaku sampai gate bisnis selesai. Bukti rinci: `docs/VERIFIKASI_RILIS.md`.

Akun awal dibuat dengan password baru pada `account.md` lokal, bukan password Absensi. File akun, secret, catatan akses dan artefak backup dikecualikan dari Git/image. Roster telah dicocokkan read-only ke Absensi produksi: 13 pengguna aktif + 3 akun bootstrap fungsi, total 16 akun aktif. Satu identitas contoh development dinonaktifkan. Password admin yang sudah diubah pemilik melalui Profil dipertahankan dan ditandai di file akun.

## Handoff

Jangan menghapus banner persiapan atau memasukkan stok riil hanya karena service sehat. Tutup keputusan D1–D12 yang relevan, master/saldo/loan pembukaan, QMS, backup/pemulihan, UAT dan penanggung jawab operasi. Lanjutkan acceptance tersisa berdasarkan backlog asli; jangan menandai INV-01–32 selesai secara massal.

## Batch redesign untuk startup IoT (18 Oktober 2026)

Arahan pengguna mengganti baseline tampilan lama: modern/visual, biru dan logo MTC, nyaman di ponsel, satu gudang. Alur utama terkonfirmasi: ambil komponen kecil dan pinjam alat. Backlog terdampak INV-04–06, INV-10, INV-15, INV-25 dan tampilan lintas modul. Acuan keputusan: `docs/design/REDESIGN_2026_10.md`.

Implementasi: shell terang/menu berkelompok; navigasi bawah semua role; beranda pencarian dan dua aksi; grafik jumlah SKU per kategori; katalog kartu/daftar dengan filter kategori/rak/tracking/stok; detail visual; tabel menjadi kartu berlabel di HP; form barang mendahului metadata; mode komponen tanpa tanggal kembali. `/admin/requests/new` memakai service permintaan yang sama untuk admin/gudang, tanpa self-approval atau posting mandiri; auditor tetap baca-saja. Pergantian mode mereset form agar pilihan komponen tidak terbawa ke form alat. Font Plus Jakarta Sans dan lisensi OFL disimpan lokal; tidak ada dependensi runtime baru atau migration.

Verifikasi lokal: lint/typecheck/build produksi lulus; Playwright lama dan tes katalog baru lulus. Tes baru membuktikan filter, unit kalibrasi kedaluwarsa tidak tersedia, prefill barang, pengajuan admin tidak mengubah stok, mode alat mewajibkan tanggal kembali, responsif 375/390/768/1024/1440 dan target aksi mobile. Capture produksi desktop1440/HP390 tersimpan lokal di `.impeccable/review/redesign/`. Review visual independen menyatakan temuan selesai setelah satu batch perbaikan. Detektor hanya memperingatkan font/tangga token DESIGN lama; DESIGN dan sidecar telah disinkronkan oleh documenter. Review akhir: ship untuk pilot. Sembilan tes domain/integrasi lulus; suite dijalankan berurutan untuk menghindari konflik antarfixture pada satu DB, sementara skenario concurrency di dalam suite tetap memakai koneksi terpisah.

Excel `list nama barang .xlsx` dibaca sebagai konteks kategori/lokasi. Tidak di-posting menjadi stok; file sumber tetap lokal, tidak masuk repository/image. Foto/angka yang belum ada di produksi tidak diganti data simulasi. Data screenshot berasal dari DB uji terisolasi.

Rilis redesign: commit `a1fb4800c3d5` sudah di-push; CI https://github.com/Frey210/Inventory/actions/runs/39128868102 hijau (9 tes domain/integrasi, 2 Playwright, lint/typecheck/build dan 3 fixture nota). Image web/worker bertag commit yang sama telah aktif dan healthy. URL publik login baru dan byte font lokal terverifikasi, health preparation serta ekspor tanpa sesi ditolak 403. Origin kembali lulus dari CT160 dan CT161. Backup terenkripsi sebelum rilis mtc-inventory-20261018T124926Z.tar.cms berhasil dan disalin off-host ke workstation. Tidak ada migration, reset akun atau impor stok pada rilis ini; container DB uji dihentikan setelah pengecekan. Gate UAT/data fisik/backup off-host rutin dari bagian sebelumnya tetap terbuka.

## Batch performa navigasi dan loading (18 Oktober 2026)

Backlog terkait INV-04–06/INV-25 dan UX lintas modul. Pengukuran awal read-only pada rilis a1fb480: server origin untuk pengguna teknisi merespons halaman hangat sekitar 16–32 ms, tetapi browser Chromium melalui Cloudflare membutuhkan sekitar 997/1244/1200 ms untuk Barang/Riwayat/Profil. Muat awal uji (termasuk menunggu network idle) 10060 ms dan JavaScript terunduh 292416 byte pada tujuh resource. Ini pengukuran satu lingkungan, bukan Core Web Vitals atau SLA perangkat pengguna.

Perbaikan: decoder kamera dan pembuat QR MFA dimuat dinamis saat dibutuhkan; rencana query per halaman menghindari katalog/saldo/aset pada halaman ringan, metadata form tidak membawa seluruh relasi stok, query master/katalog paralel dan lookup memakai Map/Set. Login publik tidak membaca sesi yang tidak dipakai. Auth/policy tetap diperiksa untuk setiap halaman privat; tidak ada cache stok atau session lintas pengguna.

Shell dikirim sebelum data konten selesai melalui Suspense. Tambahan progress bar untuk link pending, skeleton konten, pending spinner pencarian dengan lebar tombol tetap, dan status startup kamera yang dapat dibatalkan. GET pencarian/filter internal memakai Next Form tanpa reload dokumen; ekspor tab baru tetap native. Animasi mematuhi reduced motion.

Verifikasi lokal: lint/typecheck/build lulus; tes pemetaan kebutuhan data lulus, dua E2E lama lulus, dan E2E navigasi baru lulus. Uji menahan respons jaringan untuk progress/pending search, mengunci tabel Master pada DB uji untuk membuktikan fallback streaming sambil menu tetap terlihat, memastikan pencarian tidak membuat document request atau menghapus state window, memeriksa reduced motion, serta membatalkan import kamera tertunda. Screenshot desktop/mobile di `.impeccable/review/performance/`; detektor tanpa temuan primer. Tidak ada migration, perubahan data operasional atau dependensi baru.

Rilis/perbandingan sesudah deployment: menunggu commit, CI, aktivasi image dan pengukuran ulang pada domain yang sama. Kamera fisik, jaringan pengguna nyata dan audit aksesibilitas menyeluruh belum diuji pada batch ini.
