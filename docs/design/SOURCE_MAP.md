# Sumber dan keputusan desain

Tanggal ekstraksi: 18 Oktober 2026. Semua referensi lokal berasal dari DOCX yang diberikan pengguna. Gambar disalin byte-for-byte dari arsip DOCX; tidak dihasilkan ulang atau diedit. SOURCE_MANIFEST.json memuat hash sumber dan gambar, ukuran asli serta relasi paragraph OOXML untuk pemeriksaan perubahan sumber.

## Urutan acuan

1. Instruksi pengguna/AGENTS dan keputusan bisnis yang kemudian disahkan.
2. Addendum Lampiran A revisi 1.1 untuk pinjam/return/bukti; dokumen utama untuk modul lain.
3. Template nota khusus untuk judul, urutan bagian A–G, placeholder dan layout cetak; konflik isi proses mengikuti addendum dan dicatat.
4. Tabel desain/field tertulis mengoreksi mockup; gambar menunjukkan karakter/layout, bukan keharusan menyalin angka, logo atau ukuran teks.
5. DESIGN.md dan UI_SPEC melengkapi keputusan engineering yang belum dijelaskan sumber. Rencana teknis revisi mengatur stack, bukan mengubah SOP diam-diam.

## Peta sumber

| Sumber utama | Bagian | Turunan untuk agent |
|---|---|---|
| DOCX rancangan | Desain informasi website; Palet dan komponen | DESIGN.md: shell, warna, typography, forms/tables |
| DOCX rancangan | Desain layar admin/teknisi; Perubahan terhadap mockup | UI_SPEC.md: halaman, navigasi, kelengkapan alur |
| DOCX rancangan | Spesifikasi formulir utama | UI_SPEC.md: field dan konsekuensi submit |
| DOCX rancangan | Status, Peran/hak akses, Aturan bisnis kritis | PRODUCT.md; UI_SPEC: permission/status; rencana transaksi |
| DOCX rancangan | Lampiran A.1–A.7 | Loan/return/inspeksi, timeline dan snapshot |
| DOCX template | Header, A–G, Ketentuan Template | PRINT_SPEC.md; PRINT_FIELDS.json |
| DOCX rancangan | UAT-01–16 | Backlog; fixture dan acceptance UI/print |

## Referensi gambar

| File | Isi dan pemakaian |
|---|---|
| [image1.png](references/image1.png) | Alur alat/equipment: request, approval, checkout, penggunaan, check-in |
| [image2.png](references/image2.png) | Alur consumable: request, approval, pengeluaran, sisa, rekonsiliasi |
| [image3.png](references/image3.png) | Diagram keputusan pengembalian; dibaca sebagai cabang hasil, bukan urutan Baik lalu Bermasalah |
| [image4.jpeg](references/image4.jpeg) | Collage admin: split login, sidebar navy, dashboard, list/detail/form, laporan, user/settings, approval |
| [image5.jpeg](references/image5.jpeg) | Collage teknisi: hijau/teal, beranda, request, scan+manual, konfirmasi, kembali, riwayat |

Gambar hanya referensi development di docs, bukan aset public aplikasi. Dilarang memakai collage sebagai gambar UI, memotong logo/bangunan ilustratif untuk produksi, atau menampilkan data orang/contoh sebagai operasional. Foto barang/logo asli menunggu asset yang disediakan/disahkan perusahaan; sementara gunakan placeholder netral atau wordmark teks MTC Inventory.

## Keputusan eksplisit dari sumber

Tambahan pengguna setelah paket desain awal: Master Data admin menjadi pusat setup lokasi, jenis, foto, kategori dan referensi agar penambahan inventory lebih sederhana. MASTER_DATA_SPEC.md memperinci kebutuhan ini, termasuk default kategori dan pemakaian katalog SKU pada penerimaan. Tambahan tersebut berasal dari instruksi pengguna, bukan klaim bahwa seluruh rincian default/foto telah disebut DOCX.

- Admin navy #0B2E59, tombol biru #1565C0; teknisi hijau #00897B.
- Web Arial/Inter dengan minimum body 14 px, label terlihat, inline validation, status teks+warna.
- Tabel memiliki sticky header, search/filter/sort/pagination/ekspor; detail drawer/halaman.
- Nama MTC Inventory menggantikan InventorPro. Menu tambahan pada tabel perubahan wajib meski tidak ada di collage.
- Multi-item request tidak mencampur consumable dan alat. Approval bukan barang keluar; scan bukan posting.
- Satu LOAN, beberapa return event, inspeksi per unit dan bukti historis tetap tersedia.

## Pelengkapan engineering yang ditetapkan untuk pengerjaan

| Detail yang belum spesifik di DOCX | Baseline yang dipilih | Alasan |
|---|---|---|
| Font final | Arial, fallback Helvetica/sans-serif | Termasuk opsi sumber; tidak menambah ketergantungan font |
| Ukuran layar/spacing | Sidebar 240, header 56/64, breakpoint 768/1024/1280, grid 4/8 px | Membuat shell konsisten; bukan pengukuran pixel collage |
| Body/input HP | 16 px; tabel/helper 14 px | Memenuhi batas sumber dan keterbacaan perangkat |
| Tombol hijau kontras | #00695C untuk teks putih; #00897B tetap identitas | Pasangan putih/hijau asli kurang untuk teks normal; tidak menghilangkan identitas |
| Warna status/neutrals | Token terang/gelap dalam DESIGN.md | Sumber menyebut kelompok warna tanpa kode rinci |
| Navigasi HP | Bottom nav teknisi 5 tujuan + Lainnya, drawer admin | Menjaga tugas utama mudah dijangkau tanpa memuat semua menu di rail kecil |
| Rute/komponen | UI_SPEC; brief Impeccable terdaftar pada target rencana | Rute tidak disebut sumber; ini kontrak implementasi, belum bukti halaman ada |
| Aksesibilitas | Focus/error summary/kontras/reduced motion/target 44 | Melengkapi prinsip label/status/fallback sumber |
| Shadow/radius/motion | Ringan, 6/10 px, 150/200 ms | Selaras karakter referensi tanpa menyalin artefak gambar |
| Render font PDF | Arial 9 pt menggantikan Aptos template | Substitusi sengaja; font deployment harus dipaketkan dan diuji |

Tidak ada klaim pixel-perfect. Tidak ada pemilihan identitas visual baru atau redesign. Detail engineering dapat diperbaiki berdasarkan bukti render; warna/aturan eksplisit sumber tidak diganti sembarang.

## Konflik dan penyelesaiannya

| Konflik | Perlakuan baseline |
|---|---|
| Mockup admin bertuliskan InventorPro | Semua UI memakai MTC Inventory sesuai tabel tertulis |
| Mockup teknisi terlihat dapat langsung mengambil/mengembalikan stok | Teknisi acknowledge/ajukan; posting fisik/inspeksi oleh gudang |
| Dipesan pada tabel unit | Label UI Direservasi agar berbeda procurement; mapping disahkan pada D1 |
| Menunggu Pemeriksaan tidak ada pada daftar availability awal | Addendum dan D1 menambah pending_inspection; kondisi/teknis terpisah |
| Diagram image3 menghubungkan Baik ke Bermasalah secara linear | Hasil inspeksi adalah cabang alternatif. Unit lulus tersedia, bermasalah blocked |
| Judul nota addendum berbeda dari template | Pertahankan judul template khusus; QMS memutuskan judul final |
| Letter pada file vs kebiasaan A4 | Letter dipertahankan; A4 hanya setelah keputusan perubahan dan uji cetak |
| Default draft “FR-INV-01” vs kode resmi | Tampilkan sebagai usulan/simulasi, bukan nomor terkendali sah |
| Snapshot awal vs tanggal/aktor cetak ulang | Arsip tetap; download diaudit terpisah, atau ekspor baru eksplisit bila kebijakan meminta metadata baru |
| Total unit kembali vs diterima layak | Pisahkan kembali fisik, menunggu inspeksi, layak, blocked dan outstanding |

## Batas kesiapan

Semua gambar embedded telah dibuka dan dibaca; teks/tabel/OOXML ukuran halaman dan style nota diekstrak. Dokumen Word penuh tidak dirender halaman demi halaman pada sesi ini. Spesifikasi UI dan PDF belum diuji browser/printer. Kode/revisi/retensi/tanda tangan QMS, timezone, logo asli, volume data, perangkat dan kebijakan D1–D12 tetap mengikuti keputusan bisnis, bukan ditetapkan oleh pembuatan DESIGN.md.
