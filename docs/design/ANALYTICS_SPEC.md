# Analitik gudang dan pemilihan label

Tambahan pemilik 25 Oktober 2026; identitas DESIGN.md tetap berlaku.

## Label QR

Urutan kerja: pilih Unit alat atau Barang/SKU, cari, centang daftar, Siapkan cetak. Daftar 25 hasil per halaman, nama utama, kode/tag terpisah, foto/ilustrasi kategori dan lokasi berkode. Baris rata kiri dan seluruh label menjadi target sentuh. Toolbar pilihan sticky menampilkan jumlah serta aksi cetak; aksi kosong disabled. Pilihan tetap per halaman dan batas server 100 ID; format QR/audit/preview cetak existing dipertahankan.

Bukti visual wajib memperlihatkan daftar pilihan yang dikeluhkan, bukan hanya preview QR. Uji panjang nama/tag, hasil kosong, paging, keyboard, checkbox di kiri nama, CTA saat scroll, lebar 320/390/768/1024/1440 dan tidak mengubah saldo/identitas.

## Analitik

Route `/admin/analytics`, tersedia pada Kelola gudang dan Semua menu untuk ADMIN/WAREHOUSE/AUDITOR; teknisi tidak dapat membacanya. Hanya query baca dalam snapshot transaksi PostgreSQL Repeatable Read. Tidak memakai cache laporan lintas sesi dan tidak menambah sistem tracking karyawan.

- Periode 30/90/180 hari kalender, termasuk hari berjalan, memakai timezone perusahaan. Awal hari pertama inklusif; awal hari sesudah tanggal terakhir eksklusif. Hari tanpa transaksi tampil nol.
- Permintaan: Document kind request menurut createdAt, selain rejected/cancelled/superseded. Baris ganda pada satu dokumen tidak menggandakan jumlah permintaan. Approved belum menjadi penyerahan/pemakaian.
- Penyerahan: request fulfilled menurut postedAt. Permintaan sebelum periode tetapi diserahkan pada periode tetap masuk penyerahan; dua seri bukan cohort conversion rate.
- Pemohon aktif: distinct actorId pada permintaan valid. Grafik anggota menunjukkan frekuensi pengajuan, bukan login atau produktivitas.
- Unit alat dipinjam: jumlah LoanLine pada pinjaman yang dibuat dalam periode. Merupakan ukuran unit checkout, bukan Balance quantity atau jumlah unit yang masih dipinjam sekarang.
- Barang sering diminta: count distinct Document per SKU, delapan teratas. Tidak menjumlahkan pcs dengan meter/liter. Nama/SKU bisa membuka detail barang.
- Procurement komponen: active Item quantity dengan saldo tersedia <= minimum atau memiliki ISSUE pada periode. Tersedia sekarang = sum Balance.onHand - reserved lintas rak. Keluar = -sum ledger ISSUE; sisa kembali = sum CONSUMABLE_RETURN dalam periode. Jumlah transaksi keluar memakai distinct referenceId. Penerimaan, transfer, adjustment dan approval bukan pemakaian.
- Daftar procurement maksimal 12 SKU, stok menipis didahulukan, kemudian frekuensi penyerahan. Total hasil tetap disebut. Sisa kembali boleh berasal dari pengeluaran periode sebelumnya; tidak dipaksa menjadi net consumption nol. Tidak meramalkan kebutuhan atau membuat pembelian otomatis.
- Chart interaktif Recharts 3.10.1, react-is 19.3.1 sesuai React, dimuat hanya pada modul analitik. Area biru = pengajuan per hari; kolom hijau = penyerahan fisik. Tidak menghaluskan nilai antarhari menjadi prediksi. Tooltip keyboard/sentuh, sumbu hitungan bulat dan ukuran responsif tetap; animasi chart dinonaktifkan agar stabil serta menghormati reduced motion.
- Horizontal bar mengurutkan delapan SKU teratas berdasarkan frekuensi. Sumbu memakai kode maksimal delapan karakter dengan penanda pemendekan eksplisit, tooltip menyediakan nama serta SKU lengkap, dan rincian terbuka menyediakan link barang; satuan campur tidak dijumlahkan.
- Donut anggota memakai total semua pengajuan valid sebagai denominator. Empat actor teratas ditampilkan terpisah, sisa pengajuan termasuk actor di luar delapan hasil query digabung sebagai Anggota lainnya. Legenda menyediakan nama, jumlah dan persentase, tanpa mengandalkan warna; daftar delapan anggota tetap tersedia. Bukan ukuran produktivitas atau conversion rate.
- Tabel harian dan rincian nama barang tetap alternatif aksesibel. Data kosong tidak diberi persentase, contoh atau perkiraan. Export tetap melalui Laporan existing dengan policy dan audit existing.

Bukti tes serta status rilis dicatat pada STATUS_IMPLEMENTASI.md. Uji printer/kamera/perangkat fisik tetap dibedakan dari emulasi browser.

Client boundary next/dynamic memisahkan chunk library dari route bersama. Login dan halaman lain tidak mengunduh Recharts; hanya grafik yang sedang dimuat menampilkan Memuat grafik dengan spinner existing. Tidak menonaktifkan SSR. Verifikasi jaringan browser diperlukan agar lazy loading bukan sekadar asumsi struktur source.
