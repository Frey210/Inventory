# Master Data admin dan setup inventory

Tambahan kebutuhan pengguna: Master Data menjadi pusat setup sebelum menambah inventory, termasuk lokasi, jenis, kategori, satuan, katalog dan foto. Ini perluasan eksplisit dari pengguna terhadap daftar master pada DOCX, bukan perubahan pada aturan stok. Acuan visual tetap DESIGN.md. Pekerjaan masuk INV-05–06 sebelum penerimaan/opening.

## Navigasi dan susunan halaman

Menu **Master Data** di sidebar admin/gudang membuka `/admin/masters`. Daftar **Inventory** di `/admin/items` tetap untuk mencari/membuka barang dan saldo; keduanya memakai entitas SKU yang sama. Jangan membuat master barang kedua agar data tidak ganda.

Master Data memiliki subnavigasi/tab yang dapat ditautkan melalui `?tab=...`: Lokasi, Jenis Barang, Kategori, Satuan, Katalog & Foto, Supplier, Proyek/Cost Center. Pada HP gunakan select/list subnavigasi berlabel, tanpa memaksa semua tab muat pada satu baris. Tab Katalog & Foto mengarah ke katalog `/admin/items` dan editor SKU yang sama, dengan konteks setup; bukan tabel foto atau katalog duplikat.

First viewport: judul Master Data, penjelasan “Siapkan referensi barang sebelum mencatat inventory”, ringkasan setup belum lengkap, subnavigasi aktif, pencarian/filter aktif-nonaktif dan daftar dengan tombol Tambah sesuai tab. Jangan memakai dashboard KPI besar untuk tiap master. Lokasi memakai tree+detail pada desktop dan drill-down/breadcrumb pada HP; master lain memakai tabel/list.

Urutan setup yang ditampilkan: **Lokasi → Jenis → Satuan → Kategori/default → Katalog & Foto → Penerimaan/Saldo Pembukaan**. Supplier/proyek disiapkan sebelum transaksi yang memerlukannya. Setup belum lengkap menampilkan tautan langsung ke referensi yang kurang; tidak mengunci seluruh aplikasi bila hanya foto opsional yang belum ada.

## Data yang dikelola

| Master | Field dan perilaku |
|---|---|
| Lokasi | Kode unik, nama, tipe lokasi (gudang/blok/rak/level/box/lokasi penggunaan), parent, keterangan, aktif. Tree tanpa siklus; pilihan lokasi akhir sesuai operasi. Perubahan parent tidak memindahkan stok/unit secara otomatis |
| Jenis Barang | Kode bisnis stabil Consumable/Equipment/Sensor/Prototype/Produk Jadi, label, deskripsi, tracking default, aktif. Seed sesuai cakupan bisnis; nama tampilan dapat disesuaikan. Jangan membuat jenis bebas yang otomatis menciptakan alur stok baru |
| Kategori | Kode unik, nama, deskripsi, aktif; default jenis, satuan, lokasi dan foto ilustrasi opsional untuk mempercepat SKU baru. Default boleh kosong bila kategori tidak homogen |
| Satuan | Kode unik, nama/label, menerima pecahan atau bilangan bulat, aktif. Satu satuan dasar per SKU; konversi box ke pcs tidak ditebak dari nama |
| Katalog & Foto | SKU, nama, jenis/tracking, kategori, satuan, lokasi default, minimum stock, spesifikasi/kelengkapan, foto utama opsional. Satu SKU dapat dipakai berulang pada penerimaan/penambahan unit; foto kondisi unit tetap terpisah |
| Supplier | Kode/nama, kontak/alamat opsional, aktif; data riil dimasukkan admin, bukan kontak contoh dari mockup |
| Proyek/Cost Center | Kode/nama, PIC bila ditetapkan, aktif dan keterangan; dipilih pada request/penggunaan |

Jenis barang adalah klasifikasi bisnis, bukan kategori dan bukan availability/status teknis. Consumable menggunakan quantity; equipment/sensor/prototype/produk beridentitas menggunakan serialized sesuai aturan proyek. Mapping/track default yang sudah direferensikan item/transaksi tidak boleh diganti untuk mengubah riwayat. Penambahan jenis yang memerlukan perilaku baru merupakan perubahan aplikasi yang diuji, bukan sekadar CRUD label.

Tidak ada master bebas untuk menambah status “Tersedia”, melewati kalibrasi, atau mengubah permission. Pengguna/role tetap pada menu Pengguna; konfigurasi kebijakan ada pada Pengaturan. Master Data tidak menjadi editor aturan bisnis generik.

## Pengisian otomatis dan penambahan inventory

1. Admin membuat referensi dan SKU terlebih dahulu. Saat membuat SKU, memilih kategori menawarkan default jenis/satuan/lokasi dan foto ilustrasi. Form menjelaskan asal default; nilai boleh dikoreksi sebelum simpan sesuai kombinasi yang valid.
2. Mengganti kategori hanya mengisi field yang masih kosong. Jika field sudah diedit, tampilkan ringkasan “Terapkan default kategori” untuk pilihan sadar; jangan menimpa data diam-diam.
3. Saat **Tambah Inventory/Barang Masuk**, petugas mencari/memindai SKU yang sudah ada. Nama, jenis, tracking, kategori, satuan, spesifikasi dan thumbnail langsung tampil dari katalog; lokasi penerimaan memakai default yang masih aktif dan dapat dipilih ulang sesuai izin.
4. Petugas hanya mengisi data transaksi yang belum tersedia: sumber/tanggal/referensi, qty untuk consumable atau tag/serial/kondisi/kelengkapan per unit serialized, lokasi aktual dan bukti. Foto katalog tidak menggantikan foto kondisi bila diperlukan.
5. SKU belum ada: pengguna berizin membuka Tambah Barang dari tautan terpisah, kemudian kembali memilih SKU yang dibuat. Draft transaksi dipertahankan. Tidak ada pembuatan kategori/lokasi diam-diam dari free text.
6. Simpan master/SKU belum menambah stok. Saldo awal melalui opening dan penambahan inventory melalui posting penerimaan. Perubahan lokasi default bukan transfer unit/saldo yang sudah ada.

Master nonaktif tidak muncul sebagai pilihan transaksi baru, tetapi tetap tampil berlabel Nonaktif pada riwayat. Sebelum submit server memeriksa ulang semua referensi; jika dinonaktifkan pengguna lain, form mempertahankan input dan meminta pilihan baru. Perubahan nama/default/foto tidak merambat ke SKU yang sudah disimpan atau snapshot historis; edit SKU dilakukan eksplisit, dengan audit.

## Foto dan penyimpanan

Foto utama SKU adalah foto identifikasi barang. Foto kategori hanya fallback ilustrasi dengan label “Ilustrasi kategori”, bukan foto kondisi unit. Urutan tampilan: foto unit jika tersedia → foto SKU → ilustrasi kategori yang jelas berlabel → placeholder netral. Riwayat/snapshot menyimpan referensi foto pada saat kejadian, bukan mengikuti perubahan default saat ini.

Baseline upload: JPEG/PNG/WebP, maksimum 5 MB/file dan 20 megapiksel hasil decode; tolak SVG/HTML/executable dan MIME palsu. Server memvalidasi isi, membuang metadata lokasi/EXIF bila diproses dan membuat thumbnail. UI menampilkan preview, Ganti Foto, Hapus Foto dari master, progres/gagal/retry dan fallback bila gagal dimuat. File privat dengan nama server, akses berpolicy dan tanpa URL eksternal arbitrer. Angka limit adalah baseline engineering untuk diuji saat spike.

Mengganti/menghapus foto dari master hanya melepas hubungan master yang diizinkan. Jangan menghapus berkas yang dipakai unit lain/snapshot/nota. Pembersihan file orphan hanya setelah pemeriksaan referensi dan retensi. Foto dari collage DOCX tidak digunakan sebagai foto barang produksi.

## Otorisasi, validasi dan audit

Admin Sistem dan Gudang mengelola master sesuai capability; teknisi hanya membaca pilihan katalog yang relevan; auditor membaca sesuai scope. Semua endpoint mutasi/upload memverifikasi session, policy, validasi dan audit. Sebelum nonaktif, tampilkan penggunaan/default yang terdampak; tidak ada cascade delete yang memutus FK atau menghapus stok. Kode unik dinormalisasi; hierarki lokasi, referensi aktif dan konsistensi tracking/satuan diperiksa server.

Form mengikuti DESIGN.md: label permanen, error summary+inline, focus dan pending. Cancel tidak menyimpan; simpan gagal mempertahankan field. Perubahan serentak menggunakan version/updatedAt guard dan pesan conflict, bukan silent last-write-wins untuk default atau status aktif.

## Acceptance tambahan INV-05–06

- Lokasi bertingkat, jenis, satuan dan kategori dapat disiapkan dari Master Data; kode duplikat/siklus parent ditolak dan perubahan diaudit.
- Pilih kategori pada SKU baru menawarkan default; field yang sudah diedit tidak tertimpa tanpa pilihan pengguna.
- Pilih SKU pada Barang Masuk menampilkan metadata/foto/satuan/default lokasi tanpa mengetik ulang; mode quantity/serialized menentukan field yang relevan.
- Simpan master/SKU tidak mengubah stok, custody, kalibrasi atau reservasi. Perubahan lokasi default tidak memindahkan stock fisik.
- Referensi nonaktif ditolak untuk transaksi baru tetapi riwayat tetap utuh; audit menyimpan before/after aktor/waktu.
- Upload valid tampil preview; file palsu/terlalu besar/berdimensi berlebihan ditolak; mengganti foto tidak mengubah bukti checkout lama.
- Master kosong, foto kosong, no-results, forbidden, conflict/nonaktif saat submit dan gagal upload memiliki pesan serta pemulihan yang jelas.
- Keyboard, HP/desktop, unit pecahan/bulat, validasi server dan hak akses diuji. Seluruhnya masih acceptance rencana, bukan hasil uji implementasi.
