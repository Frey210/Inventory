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
- Grafik SVG tanpa dependensi baru memakai legenda garis solid/dashed dan tabel harian sebagai alternatif aksesibel. Tidak menampilkan persentase/fake trend pada data kosong. Export tetap melalui Laporan existing dengan policy dan audit existing.

Bukti tes serta status rilis dicatat pada STATUS_IMPLEMENTASI.md. Uji printer/kamera/perangkat fisik tetap dibedakan dari emulasi browser.
