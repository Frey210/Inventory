# Spesifikasi halaman dan interaksi MTC Inventory

Status: kontrak proses/field berasal dari DOCX; aplikasi kini telah dibangun. **Supersesi visual 18 Oktober 2026:** instruksi pengguna pada REDESIGN_2026_10.md dan DESIGN.md menggantikan komposisi administratif lama, rail navy/hijau, Arial dan ukuran visual lama di bagian berikut. Kontrak policy, transaksi, bukti dan acceptance tetap berlaku. Status verifikasi/cutover hanya mengikuti STATUS_IMPLEMENTASI.md. Rute adalah keputusan engineering; tabel ini bukan bukti semua rute/acceptance sudah selesai.

Pemetaan visual aktif: shell putih dengan biru dan logo MTC, sidebar desktop dan kelompok Kelola gudang; <=1023 px memakai Semua menu serta navigasi bawah lima tujuan untuk semua peran. Ponsel memakai form satu kolom dan kartu transaksi berlabel. Beranda mendahulukan pencarian serta Ambil komponen / Pinjam alat, kemudian jumlah SKU/pekerjaan/unit, perhatian, aktivitas dan lokasi rak; diagram kategori menghitung SKU, bukan menjumlahkan satuan berbeda. Katalog menggunakan foto asli atau ikon kategori konsisten, grid/daftar, stok+satuan dan lokasi, filter URL kategori/rak/komponen/alat/stok menipis. Detail menjaga eligibility dan membawa item ke permintaan. Login mengikuti shell/font/token baru. Ketentuan operasional dan matriks akses di bawah tetap mengikat.

Nama/aksi utama minimum 14 px ponsel; input teks/select/textarea minimum 16 px dan kontrol utama minimal 44 px. Metadata pendukung 11?13 px diperbolehkan; ini menggantikan minimum 14 px menyeluruh dari baseline lama. Detail skala serta pengecualian badge ringkas ada di DESIGN.md.

## Struktur navigasi dan rute

Semua halaman memerlukan session kecuali login/pemulihan. `/` mengarahkan ke landing kerja role. Rute `/admin` mencakup admin/gudang; auditor dapat membaca halaman yang diizinkan dengan policy baca-saja. Role admin sistem tidak otomatis memiliki semua aksi bisnis. Navigasi disusun dari capability server, bukan pemeriksaan string role di client saja.

| Rute | Layar/sumber | Isi utama dan aksi |
|---|---|---|
| `/login` | Login | Username/email, password, lihat password, lupa password; Masuk |
| `/forgot-password` | Pemulihan | Permintaan reset dengan respons generik; kanal sesuai konfigurasi |
| `/reset-password` | Pemulihan | Token tervalidasi, password baru/konfirmasi; Simpan Password |
| `/verify-2fa` | MFA engineering | TOTP/recovery, pesan gagal generik, tidak menampilkan token/session |
| `/admin/dashboard` | Dashboard admin/auditor | KPI, antrean approval/inspeksi/overdue, grafik terukur |
| `/admin/items` | Master Barang | Cari/filter tipe-kategori-lokasi-status, Tambah, Impor, Ekspor |
| `/admin/items/new` | Tambah SKU | Field katalog tanpa editable saldo awal |
| `/admin/items/[id]` | Detail Barang | Foto, spesifikasi, stock/unit, lokasi, riwayat, dokumen |
| `/admin/items/[id]/edit` | Edit SKU | Edit master, nonaktif berpolicy, tidak mengubah riwayat |
| `/admin/assets/[id]` | Unit equipment | Serial/tag, kondisi, teknis, availability, custody, kalibrasi, timeline |
| `/admin/masters` | Master Data | Pusat setup lokasi, jenis, kategori/default, satuan, katalog/foto, supplier dan proyek; tambah/edit/nonaktif |
| `/admin/receipts` | Barang Masuk | Draft/posted, sumber, lokasi, tanggal, referensi |
| `/admin/receipts/new` | Form barang masuk | Baris quantity/serialized, bukti, Simpan Draft, Tinjau Posting |
| `/admin/receipts/[id]` | Detail penerimaan | Snapshot/baris dan status, Posting hanya draft, audit |
| `/admin/requests` | Persetujuan | Tab Menunggu/Disetujui/Ditolak + filter lainnya, detail request |
| `/admin/requests/new` | Ambil komponen / Pinjam alat | Form permintaan untuk role berizin; memakai service request yang sama, bukan posting stok langsung; query opsional `mode=quantity` / `mode=serialized` dan `item=<id>` |
| `/admin/requests/[id]` | Review request | Jumlah diminta/disetujui, stok/unit, alasan, approver, keputusan |
| `/admin/issues/new` | Pengeluaran consumable | Request approved, jumlah sisa, penerima, bukti; Posting Penyerahan |
| `/admin/issues/[id]` | Detail issue | Qty keluar/kembali/waste/pemakaian bersih, riwayat |
| `/admin/consumable-returns` | Sisa/waste | Antrean sisa layak/klasifikasi waste dari issue asal |
| `/admin/checkouts/new` | Checkout | Approval, scanner/manual, unit, kondisi/kelengkapan, penerima |
| `/admin/loans` | Pinjaman | LOAN, peminjam, due date, outstanding fisik/inspeksi, overdue |
| `/admin/loans/[id]` | Detail Pinjaman | Ringkasan, Pengembalian, Riwayat, Bukti; terima/inspeksi/koreksi |
| `/admin/returns` | Penerimaan dan pemeriksaan | Tab Diajukan/Belum Diperiksa/Perlu Koreksi/Selesai |
| `/admin/returns/[id]` | Periksa kembali | Kondisi awal vs aktual per unit, foto, hasil/PIC, tindak lanjut |
| `/admin/transfers` | Transfer | Asal/tujuan, quantity/unit, referensi, Tinjau Transfer |
| `/admin/stocktakes` | Stock Opname | Sesi/lokasi/freeze, hitung, review, adjustment |
| `/admin/stocktakes/[id]` | Detail opname | Saldo snapshot, hitung, selisih, alasan, reviewer, posting |
| `/admin/maintenance` | Maintenance & Kalibrasi | Unit, jenis tindakan, hasil, valid_until, tiket, release |
| `/admin/incidents` | Barang Bermasalah | Insiden kehilangan/kerusakan, bukti, tindak lanjut |
| `/admin/reports` | Laporan | Stok, masuk/keluar, loan, overdue, waste, proyek, opname, kepatuhan |
| `/admin/users` | Pengguna | Akun, role/capability, aktif/nonaktif, revoke session, reset/MFA |
| `/admin/audit` | Audit Log | Aktor, waktu, modul/aksi, alasan, before/after baca-saja |
| `/admin/settings` | Pengaturan | Perusahaan, threshold, notifikasi, penomoran, timezone, QMS |
| `/me` | Beranda teknisi | Request sendiri, pinjaman/due date, menu cepat, tindakan berikutnya |
| `/me/items` | Cari Barang | Nama/kode, kategori/lokasi/tersedia; detail dan Tambah ke Request |
| `/me/items/[id]` | Detail barang teknisi | Ketersediaan/kelayakan unit; informasi teknis relevan |
| `/me/requests/new` | Request Barang | Pilih Consumable/Alat, multi-item, proyek/tujuan/tanggal |
| `/me/requests/[id]` | Request sendiri | Status, approved qty/unit, alasan/expiry, riwayat keputusan |
| `/me/pickups` | Ambil Barang | Request disetujui, scan/manual, konfirmasi penerima |
| `/me/loans` | Pinjaman Aktif | Unit, due date, progres kembali/inspeksi, Ajukan Kembali |
| `/me/loans/[id]` | Detail loan sendiri | Tab dan LOAN tetap; bukti sesuai policy, form partial return |
| `/me/consumable-returns/new` | Pengembalian Sisa | Issue asal, sisa layak, qty, lokasi serah |
| `/me/incidents/new` | Laporkan Masalah | Unit/transaksi, tipe/waktu/kronologi/foto |
| `/me/history` | Riwayat | Request, pengambilan, kembali, issue, sisa/waste milik sendiri |
| `/profile` | Profil | Identitas read-only organisasi, password, notifikasi, MFA |

Auditor/manajemen: dashboard ringkas memakai `/admin/dashboard`, laporan `/admin/reports`, overdue lewat filter `/admin/loans?overdue=true`, selisih melalui opname, masalah melalui incidents, audit baca-saja. URL filter bukan izin; scope tetap diperiksa server.

## Matriks akses minimum

| Kelompok | Admin Sistem | Gudang | Teknisi | Auditor/Manajemen |
|---|---|---|---|---|
| Master | Kelola | Kelola | Baca katalog relevan | Baca |
| Akun/role/pengaturan akses | Kelola terotorisasi | Tidak | Profil sendiri | Tidak |
| Penerimaan/issue/checkout/inspeksi | Sesuai capability bisnis | Operasional | Ajukan/acknowledge sendiri | Baca |
| Approval request | Hanya jika ditunjuk, bukan request sendiri | Bukan request sendiri | Tidak | Tidak secara default |
| Opname | Konfigurasi/aksi jika ditugaskan | Hitung/rekonsiliasi | Hitung jika ditugaskan | Review jika ditunjuk |
| Laporan/audit/file | Scope terotorisasi | Operasional | Riwayat/bukti sendiri | Scope baca |

Keputusan role/reviewer final mengikuti pemilik proses. Tombol tersembunyi tidak menggantikan penolakan server. Direktori pegawai atau lampiran pribadi tidak ikut terbuka karena akses katalog.

## Kontrak layar utama

### Login dan pemulihan

Satu login, bukan dua login admin/teknisi. Desktop: panel identitas navy 40% + form putih 60%, lebar keseluruhan maksimum 960 px. HP: satu panel putih dengan nama aplikasi; tidak memuat foto bangunan ilustratif. Role diketahui setelah autentikasi. Form mendukung password manager/paste; Enter submit; error generik tanpa membedakan akun tidak ada/password salah. Remember-me hanya bila mekanisme session disetujui. Reset tidak ditampilkan seolah email terkirim jika kanal belum tersedia; berikan instruksi administrator yang benar. Jangan membuat alamat bantuan palsu.

### Dashboard admin/gudang

Heading Dashboard, deskripsi periode/lokasi, filter lokasi bila relevan. KPI: Total SKU aktif, Stok Menipis, Request Menunggu, Overdue, Unit Bermasalah; Total Unit tampil sebagai metrik terpisah. KPI berupa tautan daftar terfilter. Di bawah KPI: dua antrean Approval dan Pemeriksaan, masing-masing lima entri terbaru yang dapat ditindak. Grafik masuk/keluar menunjukkan periode dan satuan/series yang sah; jangan menggabungkan pcs/meter. Grafik kategori donut dari mockup bersifat referensi; baseline menggunakan tabel kategori bila donut tidak membantu pekerjaan.

Auditor mendapat ringkasan dan tautan baca, tanpa tombol posting. Empty KPI nol dibedakan dari data gagal dimuat. Tidak memakai angka demo pada production fallback.

### Master Data dan setup awal

Menu Master Data adalah pusat konfigurasi referensi admin/gudang sebelum menambah inventory. Subnavigasi Lokasi, Jenis Barang, Kategori, Satuan, Katalog & Foto, Supplier dan Proyek/Cost Center mengikuti **MASTER_DATA_SPEC.md**. Katalog & Foto menggunakan SKU/editor `/admin/items` yang sama, bukan salinan data. Pilihan kategori menawarkan default jenis/satuan/lokasi/foto; form penerimaan cukup memilih SKU dan mengisi data transaksi/unit. Referensi, upload, state gagal dan acceptance dijabarkan pada kontrak tersebut. Simpan master tidak menambah saldo.

### Master dan detail barang

Daftar: kode, nama, tracking/type, kategori, lokasi, summary ketersediaan bersatuan, status aktif, Lihat. Detail quantity memiliki saldo per lokasi dan ledger; detail serialized memiliki daftar unit dengan tag, serial, tiga status, custodian dan due date. Tab Ringkasan/Unit atau Saldo/Riwayat/Dokumen. Tampilkan tanggal pembaruan ketersediaan; server tetap memvalidasi ulang saat mutasi.

Form SKU: kode, nama, tipe bisnis, tracking mode, kategori, satuan dasar, lokasi default, minimum stock, deskripsi/spesifikasi, foto opsional. Jangan mengubah tracking mode master yang sudah bertransaksi tanpa migrasi terotorisasi. Form unit: SKU, asset tag dan serial sesuai aturan keunikan, kondisi, lokasi, technical status, kelengkapan, data kalibrasi bila relevan. Tambah unit lewat penerimaan/opening, bukan edit saldo master.

### Barang masuk dan opening

Header tanggal, referensi, sumber/supplier, lokasi, penerima. Baris quantity: item, qty desimal valid, satuan, batch jika diperlukan. Serialized: satu entri per unit/tag/serial dan kondisi. Dua langkah: Draft → Tinjau Posting → Posted. Review menampilkan perubahan fisik per item/lokasi; posting menghasilkan nomor/bukti sekali. Pembatalan draft tidak mengubah stok. Impor memiliki pilih file → dry run error per baris → ringkasan → posting batch; tidak menebak konversi satuan.

### Request dan approval

Pintasan `/admin/requests/new` dan `/me/requests/new` memakai service request yang sama. Query opsional `mode=quantity` atau `mode=serialized` menyaring pilihan komponen/alat; `item=<id>` hanya mengisi barang yang masih ada dalam pilihan berizin. Pergantian mode mereset form yang relevan; query tidak memberi izin, melewati validasi atau membuat mutasi. Admin tidak menyetujui request sendiri.

Form dimulai dengan tipe request Consumable atau Alat; item beda tracking tidak bercampur. Wajib: item/unit atau jenis, qty+satuan, proyek/cost center, tujuan, tanggal perlu, due date alat. Identitas pemohon/waktu dari server. Item pilihan menampilkan ketersediaan dan eligibility; tidak membolehkan unit kalibrasi tidak berlaku. Mengirim request belum mengurangi stok.

Review approval: identitas pemohon/proyek/tujuan/tanggal, qty diminta, qty disetujui, saldo layak/reserved/available dan unit teralokasi. Alasan wajib untuk penolakan/perubahan qty; setiap perubahan material setelah approval mengikuti reapproval. Tampilkan “Persetujuan mereservasi barang; penyerahan dilakukan terpisah.” Konflik stok menahan submit dan meminta review nilai terbaru. Tanggal expiry reservasi ditampilkan jika kebijakan sudah ditetapkan.

### Issue consumable dan pengembalian sisa

Issue hanya request approved, approved remaining, qty akan diserahkan, satuan/lokasi dan penerima; petugas memposting. Review: fisik dan reservasi yang berkurang. Teknisi mengonfirmasi penerimaan; tombolnya tidak melakukan posting mandiri. Emergency issue melalui jalur eksplisit permission, alasan, penerima dan daftar review.

Sisa layak merujuk issue asal dan qty maksimum kumulatif; diterima petugas sebelum menambah stok. Waste adalah klasifikasi penggunaan pascaissue dan tidak mengurangi gudang dua kali. Waste gudang mengikuti adjustment terotorisasi. UI menampilkan keluar, kembali diterima, waste dan konsumsi lain secara terpisah; definisi pemakaian bersih = keluar − sisa layak diterima.

### Checkout aset

Request approved → pilih/scan unit → periksa kondisi/kelengkapan → petugas/penerima → tinjau → Posting Checkout. Setiap baris menampilkan tag/serial, lokasi, status kalibrasi/valid_until, kondisi awal, kelengkapan dan foto. Checkbox penerimaan merekam identitas/timestamp sesuai kebijakan, bukan tanda tangan tersertifikasi. Tidak dapat memilih unit selain alokasi tanpa substitusi terotorisasi dan jejaknya.

Sukses membuka satu detail LOAN dengan bukti awal pending/ready. PDF gagal tidak membatalkan checkout yang sudah committed. Re-scan atau retry tidak menghasilkan loan kedua.

### Loan, return dan inspeksi

Header LOAN, peminjam, proyek, checkout/due date dan approver. Summary Diserahkan/Belum Kembali/Menunggu Pemeriksaan. Empat tab Ringkasan, Pengembalian, Riwayat, Bukti. Daftar baris memperlihatkan kondisi awal, event kembali, kondisi akhir, availability dan technical status. Detail teknisi hanya miliknya.

Ajukan Kembali: pilih unit outstanding, kondisi aktual, kelengkapan, keterangan dan foto masalah. Pengajuan tidak mengubah custody. Gudang mencatat **Terima Fisik** dengan qty/unit dan waktu aktual; unit menjadi Menunggu Pemeriksaan. Tahap **Simpan Hasil Pemeriksaan** membandingkan kondisi awal/akhir, hasil Lulus/Perlu Pemeriksaan/Perlu Kalibrasi/Rusak Ringan/Rusak Berat/Hilang, PIC, lokasi tujuan dan tiket masalah. Hilang tidak diterima sebagai return fisik; penyelesaian melalui exception.

Unit available hanya setelah inspeksi lulus dan eligibility. Loan selesai setelah semua kewajiban diterima/diperiksa atau exception berwenang tercatat; unit rusak tetap blocked. **Minta Koreksi** harus membedakan koreksi data pengajuan dari penolakan penerimaan fisik; jangan mengembalikan custody peminjam secara fiktif. Timeline menampilkan event, aktor, waktu, alasan dan referensi koreksi.

### Opname, transfer, maintenance dan installed

Opname: sesi+lokasi → pembekuan → hitung → review selisih/alasan → posting adjustment → buka freeze. Selama freeze semua mutasi lokasi ditolak dengan tautan sesi. Pembatalan sesi juga diaudit dan melepas freeze. Selisih per SKU+satuan; denominator nol N/A. Tidak ada input Edit Saldo langsung.

Transfer menampilkan asal/tujuan, qty/unit, bukti penerimaan internal dan dampak total perusahaan nol. Transit tidak diasumsikan. Maintenance/kalibrasi menampilkan metode, standar/buffer, tanggal/hasil/valid_until, pelaksana, bukti dan release berwenang. Checklist pH hanya tampil untuk elektroda pH yang sesuai; jangan menerapkannya pada sensor DO/suhu/EC. Prototype/produk installed mencatat versi/konfigurasi, custody/lokasi dan referensi pekerjaan; tidak membuat kontrak/BAST otomatis.

### Laporan, audit, pengguna dan pengaturan

Laporan memiliki filter periode/lokasi/item/proyek/status sesuai jenisnya, ringkasan satuan yang benar dan ekspor PDF/XLSX berpolicy. Sebelum mengekspor data besar tunjukkan filter/jumlah baris; job ekspor memperlihatkan status. Audit read-only dengan before/after yang dapat dibuka; token/password/secret tidak tampil sebagai detail audit.

Pengguna: akun internal, role/capability, status aktif, reset dan revoke; perubahan akses memerlukan alasan dan audit. Jangan menghapus aktor riwayat ketika pegawai nonaktif. Profil organisasi read-only bagi teknisi. Pengaturan QMS menandai kode/revisi belum disahkan; tidak mengisi FR-INV-01 sebagai kode resmi bawaan.

## Kamus status UI

| Domain | Nilai server | Label Indonesia | Tampilan |
|---|---|---|---|
| Request | draft/submitted/approved/rejected/cancelled/expired | Draft/Diajukan/Disetujui/Ditolak/Dibatalkan/Kedaluwarsa | neutral/warning/success/danger/neutral/warning |
| Fulfilment | unfulfilled/partially_fulfilled/fulfilled | Belum Diserahkan/Diserahkan Sebagian/Sudah Diserahkan | neutral/info/success |
| Unit | available/reserved/borrowed/installed/pending_inspection/blocked | Tersedia/Direservasi/Dipinjam/Terpasang/Menunggu Pemeriksaan/Diblokir | success/info/info/info/warning/danger |
| Loan lifecycle | active/completed/closed_with_exception | Aktif/Selesai/Ditutup dengan Pengecualian | info/success/warning |
| Loan derived | partial return/inspection queue/overdue | Dikembalikan Sebagian/Menunggu Pemeriksaan/Overdue | info/warning/danger; dapat bersamaan |
| Receipt | draft/posted/cancelled | Draft/Diposting/Dibatalkan | neutral/success/neutral |
| Document job | pending/processing/ready/failed | Menunggu Diproses/Sedang Dibuat/Siap Diunduh/Gagal Dibuat | neutral/info/success/danger |

Kondisi fisik dan status teknis mengikuti daftar DOCX, bukan dilebur menjadi availability. Direservasi adalah label baseline untuk Dipesan pada sumber agar tidak tertukar procurement. Tahap sebelum checkout adalah request/fulfilment “Menunggu Serah Terima”, bukan loan aktif palsu. Status return event final mengikuti kontrak bisnis saat schema dibangun; UI harus membedakan diajukan/diterima fisik/diinspeksi/perlu koreksi.

## States dan copy yang wajib

| Keadaan | Pesan/aksi |
|---|---|
| Belum ada request | “Belum ada request.” + Buat Request bila berizin |
| Filter kosong | “Tidak ada hasil untuk filter ini.” + Hapus Filter |
| Kamera ditolak | “Akses kamera belum diizinkan. Masukkan kode secara manual atau ubah izin kamera.” |
| Unit duplikat | “Unit ini sudah ditambahkan.”; focus ke baris, tidak posting |
| Konflik alokasi | “Ketersediaan berubah. Muat ulang dan periksa alokasi.” |
| Kalibrasi kedaluwarsa | “Checkout diblokir: masa kalibrasi unit telah berakhir.” + tanggal/unit |
| Belum diterima/diperiksa | “Menunggu penerimaan fisik” / “Menunggu pemeriksaan petugas” sesuai tahap |
| Timeout mutasi | “Hasil belum dapat dipastikan. Periksa status transaksi sebelum mencoba lagi.” |
| File tanpa izin | Respons 403/404 sesuai kebijakan; tidak membocorkan nama/lokasi file |
| PDF pending/gagal | Status bukti + Cek Status/Coba Buat Ulang bila berizin; bukan Checkout Ulang |
| Snapshot checkout | Bagian kembali “Belum ada pengembalian” dan “Belum diverifikasi” |

## Fixture dan verifikasi implementasi

Gunakan data simulasi berlabel: ESP32 ELC-ESP32-001 (pcs), kabel (m), tiga unit Multimeter/Kamera/Sensor pH dengan tag unik, proyek Demo Internal dan akun Gudang Demo/Teknisi Demo/Auditor Demo. Jangan membuat akun/password default untuk produksi. Contoh LOAN-202610-0001 dari sumber bukan transaksi riil.

Fixture wajib: request 5 approve 3; kabel kembali layak 2 m; tiga unit dengan dua diterima fisik dan satu menunggu inspeksi; satu unit kalibrasi kedaluwarsa; PDF gagal; daftar kosong; teks nama/kronologi panjang; 30+ item cetak; dua actor berebut unit. Bukti acceptance mengikuti INV dan UAT pada backlog, bukan sekadar screenshot.

Sebelum menyatakan frontend selesai: uji rute/action/file tanpa izin, keyboard/focus/dialog, error summary, scanner fallback, lebar 390/768/1024/1440, zoom 200%, empty/error/loading/conflict, dan label parsial+inspection+overdue bersamaan. Kamera/printer/scanner nyata tetap perlu uji perangkat. Tidak ada hasil uji yang diklaim dalam dokumen perencanaan ini.
