# Redesign MTC Inventory — 18 Oktober 2026

Mode: Operate. Jalur implementasi: code-led, mengikuti referensi visual yang diberikan pengguna. Instruksi pengguna menggantikan baseline tampilan DOCX; warna biru, logo MTC, fakta produk dan integritas transaksi dipertahankan.

## Kebutuhan terkonfirmasi

Tim startup IoT kurang dari 20 orang, satu gudang dengan lemari/rak. Aktivitas utama: mengambil komponen kecil dan meminjam alat kerja. Pengguna meminta tampilan clean, fluid, intuitif, modern, visual dan nyaman di ponsel. Referensi yang diberikan menonjolkan katalog visual, pencarian, stok/lokasi yang cepat terbaca dan navigasi bawah.

## Kontrak desain

- Shell terang dengan navigasi ringkas, biru sebagai warna tindakan/seleksi dan logo MTC asli. Kelompok pengelolaan dapat dibuka ketika diperlukan; seluruh fungsi tetap dapat ditemukan.
- Beranda langsung menawarkan **Ambil komponen** dan **Pinjam alat**, dilanjutkan pencarian. Metrik memakai jumlah jenis barang, pekerjaan dan unit, tanpa menjumlahkan satuan berbeda atau menampilkan data fiktif.
- Katalog berupa kartu atau daftar, foto asli bila tersedia dan ikon kategori konsisten bila belum ada. Filter kategori, rak, komponen/alat dan stok menipis memakai URL yang dapat dibuka ulang.
- Detail barang menunjukkan visual, ketersediaan, satuan, lokasi dan cara pencatatan. Pemilihan barang oleh teknisi dapat diteruskan ke permintaan.
- Ponsel memakai navigasi bawah untuk semua peran, kontrol sentuh, form satu kolom dan daftar transaksi berbentuk kartu berlabel. Tidak mengandalkan geser tabel horizontal.
- Teks utama singkat: permintaan, peminjaman, kembali, hitung stok dan pindah rak. Nomor transaksi/bukti historis tetap utuh.
- Status mode persiapan tetap tersedia sebagai penjelasan ringkas yang dapat dibuka. Belum ada persetujuan cutover.
- Foto katalog tidak diambil dari ilustrasi referensi atau dianggap mewakili barang sebenarnya. Ikon kategori adalah ilustrasi, bukan bukti kondisi unit.

## Excel sebagai konteks, bukan posting stok

Sumber: `list nama barang .xlsx`, sheet **List Barang**, kolom B nama, C jumlah, D satuan, G kategori, I kode dan J lokasi. Terdapat **354 baris barang**: 196 komponen elektronik, 58 aset/alat kerja, 54 bahan habis pakai, 15 sensor, 13 bahan kimia, 7 perlengkapan laboratorium, 6 kelompok produk jadi dan 5 APD. Sheet per blok/toolbox/Aquanotes adalah rincian yang dapat tumpang tindih; tidak dijumlahkan lagi.

Kode lokasi mencakup A1–A5, B1–B4, C1–C5, D1, C3-TB/C3-TG, WST dan FLR. `C!` perlu dikonfirmasi. Sheet INFORMASI menjelaskan A/B/C sebagai blok dekat pintu, D meja cokelat, TG toolbox green, TB toolbox black, WST workstation dan FLR sudut dekat rak B/C; juga memuat arsip alat B5. Enam kelompok Aquanotes memakai penanda `SHEET 2` sebagai kode, sehingga tidak boleh dianggap SKU final. Tidak ada migrasi atau posting saldo produksi dari workbook pada batch desain ini.

## Referensi tambahan

- [Sortly: visual inventory untuk usaha kecil](https://www.sortly.com/business-inventory-app/) — foto barang dan penggunaan dari ponsel.
- [Sortly: pengelompokan folder](https://help.sortly.com/how-to-add-folders) — lokasi/kategori sebagai cara menemukan barang.
- [Zoho Inventory mobile](https://www.zoho.com/us/inventory/mobile-apps/) — akses pekerjaan inventory dari ponsel.

Implementasi memakai Lucide yang sudah terpasang dan font Plus Jakarta Sans yang disimpan lokal dengan lisensi OFL. Tidak menambahkan framework komponen atau dependensi runtime baru. Grafik kategori memvisualisasikan jumlah SKU nyata, bukan valuasi atau tren yang belum tersedia.

## Jangkauan dan batas

Batch ini mencakup shell, login, beranda, katalog/filter/detail, pintasan permintaan, komponen tabel/form dan tampilan responsif lintas modul. Master data, penyerahan fisik, approval, reservasi, ledger, peminjaman/pengembalian/inspeksi, akses dan audit tetap memakai service yang ada. Nota A–G dan renderer arsip tidak didesain ulang. Gate operasional, data fisik dan backup off-host rutin tetap mengikuti STATUS_IMPLEMENTASI.md.
