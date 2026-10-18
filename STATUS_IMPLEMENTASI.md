# Status implementasi MTC Inventory

Pembaruan: 18 Oktober 2026. Tahap: aplikasi persiapan/pilot telah dibangun; persiapan rilis ke LXC Docker dan PostgreSQL CT102 sedang diverifikasi. Ini bukan pernyataan seluruh V1/UAT/gate operasional lulus.

## Implementasi tersedia

| Backlog   | Bukti implementasi                                                                                                                                                                                    | Acceptance yang masih perlu ditutup                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| INV-01–04 | Next/React/TS, Prisma PostgreSQL, CI; username internal, ganti password awal, TOTP/recovery, role/ownership, session DB/rate limit                                                                    | Pengesahan kewenangan bisnis dan uji akses pada domain HTTPS sesudah Tunnel diarahkan                                     |
| INV-05–06 | Master aktif/nonaktif/version, parent tanpa siklus, kategori/default, katalog/foto; filter/pagination/path lokasi; metadata SKU pada penerimaan                                                       | Drill-down tree penuh, draft lintas halaman, perangkat nyata dan acceptance semua state master                            |
| INV-07–09 | Ledger/reservasi/audit/outbox/idempotency atomik, constraint DB; dry run CSV per baris dan batch antiulang; draft/posting penerimaan                                                                  | Rekonsiliasi saldo awal riil dan format/data pinjaman legacy harus disahkan sebelum migrasi riil                          |
| INV-10–14 | Request terpisah tracking; approval tanpa self-approval, alokasi, expiry, acknowledgement, issue; permission darurat default mati + review; checkout kondisi/kelengkapan tiap unit, LOAN dan snapshot | UAT pemilik proses; kebijakan override/acknowledgement dan tenggat; seluruh skenario fault/retry lintas modul             |
| INV-15–19 | Label QR/manual/USB/kamera; return parsial, receipt fisik terpisah inspeksi; foto masalah, blocked/insiden, koreksi event dan exception; worker PDF/version/checksum/retry                            | Kamera/USB/printer/grayscale nyata; kebijakan exception/QMS/retensi; integrasi semua skenario bukti masalah               |
| INV-20–23 | Transfer quantity/unit; opname freeze/count/review/cancel quantity dan hadir/hilang unit; maintenance/kalibrasi/installed berproyek                                                                   | UAT gudang, rekonsiliasi lintas lokasi, metode kalibrasi/perangkat yang berlaku                                           |
| INV-24–25 | Notifikasi in-app H-2/H-1/overdue, kalibrasi H-30/14/7, stok minimum berbasis transisi; dashboard; ekspor saldo/aset/loan/reservasi/waste/proyek/opname/audit CSV/XLSX/cetak PDF                      | Kanal email belum disediakan; laporan cetak memakai browser, bukan antrean PDF arsip; validasi laporan/UAT dan beban riil |
| INV-26–27 | Docker non-root, role DB terpisah, TLS DB, script backup/restore dan runbook; private storage                                                                                                         | Status deployment/backup aktual dicatat di bagian rilis; pemantauan/alarm dan salinan off-host berulang perlu dibuktikan  |
| INV-28–32 | Dokumen operasi, pengujian inti dan mode persiapan                                                                                                                                                    | Migrasi riil, pelatihan, UAT-01–16, cutover dan observasi 30 hari belum dapat dianggap selesai oleh tes otomatis          |

Revisi request material membuat transaksi baru dan melepas reservasi lama; riwayat request sebelumnya berstatus superseded. Waktu input lokal ditafsirkan berdasarkan timezone konfigurasi, masa kalibrasi berbentuk tanggal berlaku sampai akhir hari setempat. Metadata checkout dibekukan; perubahan nama master tidak menulis ulang arsip ready.

## Verifikasi yang telah dilakukan

- Lint, TypeScript dan build Next standalone + bundle worker telah lulus pada batch sebelumnya; diulang sesudah perubahan akhir. Lockfile dipin; audit dependency terakhir tanpa kerentanan yang dilaporkan.
- Tes PostgreSQL terisolasi membuktikan draft tanpa stok, posting idempoten, konflik payload retry, dua approval berebut saldo, issue terbatas, waste kumulatif, checkout terkontrol, physical return bersamaan, inspeksi parsial/final, audit immutable, opname quantity/unit/freeze/cancel, dry run/batch dan override/review. Batch terakhir menambah revisi request dan dedup reminder.
- Playwright lulus login/setup master, private export, simpan/buka pengaturan, empat viewport, TOTP dan recovery code. Screenshot simulasi disimpan lokal di `.impeccable/review`, tidak di Git.
- Renderer nota produksi diuji satu unit awal, 35 unit dengan teks panjang dan partial return, serta final. Letter 612×792 pt, A–G, footer LOAN/versi/halaman dan header tabel diperiksa. Review independen menyetujui UI serta layout cetak **untuk pilot**; bukan pengesahan operasional.
- Restore dump database uji ke database kosong terpisah telah lulus. Ini tidak menggantikan restore DB+file rilis produksi dan backup off-host.

## Infrastruktur dan rilis

Repository remote Frey210/Inventory terverifikasi kosong sebelum bootstrap. Local Git sudah dibuat; hash commit dan hasil push dicatat sesudah rilis.

Jalur administrasi CT102 berhasil melalui LXC Docker → Proxmox legacy → pct exec; detail akses ada pada catatan lokal yang diabaikan Git. PostgreSQL 17 aktif; database `mtc_inventory` dan role migrasi/web/worker/backup terpisah telah dibuat. Koneksi TLS dari host aplikasi dengan verifikasi sertifikat sudah lulus. Database aplikasi lain tidak menjadi target migrasi.

Target aplikasi: `/opt/mtc-inventory` pada LXC Docker. Origin rencana `http://192.168.10.68:3030`, domain `inventory.farlabs.my.id`; baru dinyatakan aktif setelah deployment dan healthcheck lulus. Mode preparation tetap berlaku sampai gate bisnis selesai.

Akun awal dibuat dengan password baru pada `account.md` lokal, bukan password Absensi. File akun, secret, catatan akses dan artefak backup dikecualikan dari Git/image. Identitas awal mengacu data lokal Absensi; cocokkan roster pegawai sebelum operasional.

## Handoff

Jangan menghapus banner persiapan atau memasukkan stok riil hanya karena service sehat. Tutup keputusan D1–D12 yang relevan, master/saldo/loan pembukaan, QMS, backup/pemulihan, UAT dan penanggung jawab operasi. Lanjutkan acceptance tersisa berdasarkan backlog asli; jangan menandai INV-01–32 selesai secara massal.
