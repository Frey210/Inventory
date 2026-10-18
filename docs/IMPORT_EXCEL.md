# Impor data awal Excel

Perintah memakai `INVENTORY_DATABASE_URL` dari environment privat. Workbook dan laporan rincian tetap di luar Git/image. Tidak ada endpoint impor publik atau dependensi baru.

```powershell
npx.cmd tsx scripts/import-workbook.ts "list nama barang .xlsx"
npx.cmd tsx scripts/import-workbook.ts "list nama barang .xlsx" --apply <admin-id>
# Setelah bukti hitung fisik disimpan ke INVENTORY_OPENING_RECONCILIATION:
npx.cmd tsx scripts/import-workbook.ts "list nama barang .xlsx" --post-quantities <admin-id>
```

Tanpa `--apply`, hanya membaca sumber dan menulis rencana privat di `.local/workbook-<checksum>.json`. Ambil backup terenkripsi dan salin off-host sebelum apply produksi. Pada container tools, mount workbook read-only dan direktori `.local` privat yang dapat ditulis UID Node. Pakai environment database Inventory.

Apply memakai service/policy/audit/idempotency aplikasi untuk setiap master, barang dan draf. Pengulangan sumber yang sama melanjutkan pekerjaan tanpa menggandakan SKU atau draf; SKU/master yang berbeda ditolak, bukan ditimpa. Setiap aksi atomik; keseluruhan workbook bukan satu transaksi besar, sehingga kegagalan sebagian dapat dilanjutkan dengan sumber dan actor yang sama. Tidak ada migration.

## Pemetaan sumber

- `List Barang` menjadi satu-satunya sumber jumlah. Sheet rak, toolbox dan arsip informasi tidak dijumlahkan lagi.
- `Aquanotes` menyediakan kode unit/serial untuk enam model pada ringkasan. SKU model `XLSX-AQNS-V1` sampai `V5` dan `XLSX-AQNC` dibuat saat impor karena sumber memakai placeholder `SHEET 2`. Kode unit asli tetap tersimpan dalam rencana privat. Jumlah ringkasan/rincian harus cocok dan identitas tidak boleh duplikat.
- Satu gudang MTC, blok A–D, rak sumber, toolbox hitam/hijau di C3, workstation dan area lantai. Typo C! dipetakan C1 sesuai konfirmasi pemilik 19 Oktober 2026. Lokasi lain yang tidak dikenal ditahan.
- Komponen, bahan habis pakai, bahan kimia dan sarung tangan per box memakai quantity. Alat, sensor, produk jadi, APD reusable dan perlengkapan laboratorium memakai serialized sesuai batas proses proyek. Ini pemetaan awal untuk ditinjau petugas; aksesori alat yang habis pakai mungkin perlu diklasifikasikan ulang sebelum stok dibuat.
- Satuan pcs/roll/box berupa bilangan bulat, liter mendukung pecahan. Jumlah sumber dan sheet/baris/checksum tersimpan di rencana privat untuk penelusuran; minimum stok tetap 0 karena tidak diberikan sumber. Foto tidak dibuat-buat.

## Batas stok pembukaan

Apply membuat katalog/master serta draf saldo pembukaan quantity dalam batch maksimal 100 baris. Opsi `--apply` tidak memanggil posting atau membuat saldo/ledger/unit tersedia. `--post-quantities` memerlukan catatan konfirmasi fisik, memeriksa rincian terhadap sumber dan memanggil service posting quantity. Dokumen yang sudah posted dilewati saat retry. Kondisi, identitas fisik dan kebutuhan/validitas kalibrasi alat/sensor belum dibuktikan sumber, sehingga unit serialized tetap bahan review dalam rencana privat. Isi kolom seri alat juga bisa merupakan model komponen; jangan mengubahnya otomatis menjadi serial pabrikan.

Pemilik/petugas mencocokkan jumlah fisik, menuntaskan SKU/lokasi bentrok, menetapkan klasifikasi dan memeriksa unit/kalibrasi sebelum posting dengan alur penerimaan yang ada. Mode persiapan tetap aktif. Konfirmasi jumlah saja tidak membuktikan kondisi atau kelayakan kalibrasi.

Dry-run sumber pengguna: 354 baris utama, 352 SKU diterima, dua baris ditahan karena satu kode dipakai dua barang. Enam model Aquanotes memuat 19 unit rincian tanpa penjumlahan ulang. Ini hasil pembacaan sumber, bukan bukti sudah tersimpan di produksi.
