# Pemeriksaan desain label dan analitik

Tanggal: 25 Oktober 2026. Scope INV-15/25/29; mode Impeccable Operate, perluasan sistem yang sudah berlaku. Ini catatan bukti terbatas, bukan audit seluruh aplikasi atau penerimaan operasional.

## Acuan dan sistem yang dipertahankan

Sumber diperiksa: `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, `.impeccable/surfaces/src-components-labels-analytics.md`, `ANALYTICS_SPEC.md`, `src/components/labels.tsx`, `src/components/label-picker.tsx`, `src/components/analytics.tsx`, dan `src/app/operations.css`.

- Palet tetap biru MTC (`--primary`), permukaan putih, canvas dingin, teks dan status semantik incumbent; logo MTC dan shell existing tetap menjadi identitas.
- Tipografi tetap Jakarta lokal; nama/aksi 14 px, input mengikuti kontrol existing, kode dan lokasi menjadi metadata sekunder. KPI memakai langkah 30 px yang sudah tercatat.
- Panel dan kontrol memakai keluarga bentuk lembut incumbent, border pemisah dan ruang kerja responsif. Tidak menetapkan visual world baru.
- Aturan Main Text tetap berlaku: nama barang terbaca, kode terpisah, target checkbox mencakup baris label dan status pilihan diumumkan melalui `role="status"`.
- Grafik memakai SVG data, legenda solid/dashed dan alternatif tabel harian; jumlah transaksi dipisahkan dari quantity per SKU/satuan. Tidak ada dependensi baru atau raster referensi yang dikirim sebagai aset aplikasi pada scope ini.

`DESIGN.md` dan `.impeccable/design.json` dipertahankan. Pola halaman ini tidak dipromosikan menjadi aturan universal sistem.

## Hasil pada permukaan yang diminta

Pengguna menolak daftar label lama yang panjang dan terpusat. Source sekarang memperlihatkan grid rata kiri: checkbox, foto/ikon, nama, kode, lokasi; 25 hasil per halaman, toolbar pilihan sticky dan aksi cetak disabled saat pilihan kosong. Pilihan direset ketika halaman, pencarian atau jenis berubah. Preview QR, identitas dan audit ekspor existing dipertahankan.

Analitik menyediakan periode 30/90/180 hari, jumlah permintaan/penyerahan/pemohon/unit checkout, tren kebutuhan, peringkat SKU dan anggota, serta tinjauan procurement dengan keluar, sisa kembali, tersedia sekarang dan minimum per SKU. Penjelasan UI membedakan pengajuan dari penyerahan fisik serta frekuensi permintaan dari produktivitas. Angka bukan penjumlahan satuan berbeda atau ramalan pembelian otomatis.

## Bukti review dan validasi

Capture yang menjadi batas review akhir:

- `.impeccable/review/label-analytics/labels-desktop.png`
- `.impeccable/review/label-analytics/labels-mobile.png`
- `.impeccable/review/label-analytics/analytics-desktop.png`
- `.impeccable/review/label-analytics/analytics-mobile.png`

Reviewer akhir `impeccable_finish_reviewer_labels_retry` memberi disposition **ship**, tanpa perbaikan material. Upaya reviewer pertama berhenti karena batas penggunaan dan digantikan reviewer baru; upaya pertama tidak dihitung sebagai review yang lulus. Disposition dan hasil tes berikut dicatat dari handoff pelaksana/reviewer, bukan klaim bahwa documenter menjalankan ulang tes atau meninjau ulang render.

Validasi yang dilaporkan lulus: 16 tes domain dan 8 tes browser. Detector dijalankan sekali; berkas lokal `.local/label-analytics-detector.json` dibaca sebagai UTF-16 dan berisi 9 advisory langkah radius/ukuran teks, nol temuan nonadvisory. Documenter memeriksa jumlah tersebut langsung dari berkas dan keberadaan keempat capture.

## Batas dan drift yang tidak dikanonisasi

Advisory radius/ukuran teks tetap dicatat sebagai variasi lokal, bukan alasan memperluas skala token agar detector diam. Sidecar incumbent masih membawa metadata lama seperti `admin-shell`; catatan ini tidak merapikan drift lintas aplikasi yang berada di luar scope. Tidak ada perubahan pada kedua sumber sistem tersebut.

Catatan ini tidak membuktikan printer, kamera, perangkat fisik, UAT, cutover, data fisik atau aksesibilitas seluruh aplikasi. Status rilis dan gate operasional tetap mengikuti `STATUS_IMPLEMENTASI.md`.
