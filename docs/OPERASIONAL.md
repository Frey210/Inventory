# Penggunaan operasional

Keputusan pemilik 16 November 2026: aktifkan mode `live`, kosongkan data percobaan inventory, dan gunakan akun yang sudah ada. MFA bersifat opsional untuk semua peran. Pengguna yang telah mengaktifkan MFA tetap melewati verifikasi saat login; MFA dan recovery code mereka tidak direset. Kewajiban mengganti password awal serta pemeriksaan akun aktif/otorisasi tetap berlaku.

## Mulai memasukkan data asli

1. Masuk dengan akun lama. Ganti password awal bila diminta di Profil.
2. Admin/petugas gudang menyiapkan lokasi/rak, kategori dan proyek melalui Master Data. Jenis barang dan satuan dasar tetap tersedia.
3. Buat katalog barang sesuai SKU, satuan, jenis pencatatan dan lokasi sebenarnya.
4. Catat penerimaan/saldo pembukaan berdasarkan hitung fisik. Untuk unit beridentitas, lengkapi tag, kondisi dan kebutuhan kalibrasi. Tinjau lalu posting melalui alur aplikasi; jangan mengubah saldo langsung di database.
5. Cocokkan stok tersedia dengan barang fisik sebelum dipakai untuk permintaan, pengambilan komponen atau peminjaman.

## Batas reset awal

Reset satu kali mengarsipkan data persiapan melalui backup terenkripsi terverifikasi dan uji restore terpisah sebelum mengosongkan katalog, unit, saldo, transaksi, lokasi/kategori/proyek/supplier, notifikasi, impor, alias QR, nomor transaksi serta pekerjaan PDF lama. Akun, password, peran, sesi, MFA, pengaturan perusahaan, referensi jenis/satuan dan audit akses akun dipertahankan. Satu audit cutover mencatat backup dan jumlah data sebelum reset. Riwayat bisnis percobaan tersedia di arsip backup, bukan bercampur dengan transaksi operasional baru.

Status eksekusi dan bukti akhir ada di `STATUS_IMPLEMENTASI.md`. Jangan mengulangi reset setelah tim mulai mengisi data asli. Restore seluruh backup lama akan menimpa transaksi baru; lakukan pemulihan terkontrol jika dibutuhkan. Mode operasional bukan pengesahan format QMS atau bukti uji kamera/printer fisik.
