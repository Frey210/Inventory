# MTC Inventory

Tambahan 25 Oktober 2026: web dapat dipasang sebagai PWA di Android/desktop dan melalui Safari Add to Home Screen. PWA tetap memerlukan internet untuk data dan transaksi; cache hanya halaman offline statis dan ikon publik. Notifikasi tetap di dalam aplikasi, tanpa Web Push.

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Baseline perencanaan yang telah direvisi: Next.js App Router, React, TypeScript strict, Tailwind 4, Prisma 7 dan PostgreSQL. Implementasi dikerjakan Codex, dengan satu pemilik/pemelihara aplikasi. Aplikasi telah diimplementasikan; versi terpin dan bukti verifikasi/rilis mengikuti package.json serta STATUS_IMPLEMENTASI.md. Rencana cakupan tidak menyatakan seluruh acceptance V1/UAT atau cutover lulus.

## Users

Startup IoT dengan kurang dari 20 karyawan, satu gudang dengan lemari/rak. Aktivitas rutin adalah konsumsi komponen kecil dan peminjaman alat kerja. Empat peran mengikuti DOCX: Admin Sistem, Penanggung Jawab Gudang, Teknisi/Pengguna, Auditor/Manajemen. Admin mengelola akses/konfigurasi; gudang menerima, menyerahkan dan memeriksa; teknisi mencari, mengajukan, mengakui penerimaan dan mengembalikan; auditor/manajemen meninjau sesuai kewenangan. Admin tidak otomatis menjadi approver bisnis dan pemohon tidak menyetujui request sendiri.

## Product Purpose

Mengendalikan persediaan jumlah dan aset beridentitas unit, dari penerimaan, permintaan, approval dan penyerahan sampai pengembalian, inspeksi dan rekonsiliasi. Keberhasilan dibuktikan oleh saldo yang cocok dengan ledger/fisik, unit yang tidak dipinjam ganda, bukti yang dapat ditelusuri dan UAT-01–16; bukan jumlah layar yang selesai dibuat.

## Positioning

Aplikasi operasional internal PT MEDIA TEKNOLOGI CELEBES. Satu pinjaman menggunakan satu LOAN sepanjang checkout, beberapa return event dan versi bukti. Consumable memakai issue, sisa layak dan waste yang terpisah dari siklus unit equipment/sensor. Nota awal tetap dapat diakses setelah pengembalian.

## Operating Context

- Semua peran memakai web responsif desktop/tablet/HP. Katalog visual, pencarian dan lokasi rak membantu aktivitas harian; tabel transaksi menjadi kartu berlabel pada ponsel. Kamera QR dan scanner USB mode keyboard memiliki fallback input manual.
- Semua transaksi memerlukan server. Gangguan jaringan harus memperlihatkan hasil yang belum pasti dan menyediakan pemeriksaan status/retry idempotent.
- Dua DOCX di root tetap menjadi acuan proses/bukti; rancangan utama memiliki addendum revisi 1.1 tanggal 16 Oktober 2026. Instruksi redesign pengguna 18 Oktober 2026 menggantikan gaya visual administratif dan mockup lama; acuan visual aktif adalah DESIGN.md dan docs/design/REDESIGN_2026_10.md.
- Finance dan Absensi menjadi referensi pola internal. Inventory memiliki repository/database/session/storage terpisah; tidak ada SSO atau sinkronisasi data lintas aplikasi pada baseline.

## Capabilities and Constraints

V1 mencakup master, penerimaan, request/approval/reservasi, issue consumable, return sisa/waste, checkout aset, partial return/inspeksi, QR, nota snapshot PDF, koreksi historis, transfer, opname/adjustment, kalibrasi/maintenance dasar, prototype/installed, reminder, laporan, audit dan akses.

Tambahan terkonfirmasi dari pengguna: admin menyiapkan lokasi, jenis, kategori, satuan, katalog/foto dan referensi pendukung lewat **Master Data** terlebih dahulu. Penambahan inventory kemudian memilih SKU dan memakai metadata/default yang tersedia, bukan mengetik ulang seluruh atribut. Kontraknya `docs/design/MASTER_DATA_SPEC.md`. Setup master tidak mengubah saldo; opening/penerimaan tetap transaksi terpisah.

Invarian wajib:

1. Approval mereservasi; stok fisik berubah saat posting. Saldo serialized dihitung dari unit, tidak dihitung lagi sebagai quantity.
2. Pengajuan kembali berbeda dari penerimaan fisik dan pemeriksaan. Unit kembali belum tersedia sampai lulus pemeriksaan dan eligibility teknis/kalibrasi.
3. Kalibrasi kedaluwarsa memblokir checkout walau request sudah disetujui.
4. Loan, return event, kondisi awal dan bukti dipertahankan. Koreksi melalui event beralasan dan terotorisasi; tidak ada edit diam-diam atau return fiktif.
5. Mutasi, approval, inspeksi, akses file/ekspor dan perubahan hak diperiksa server serta diaudit. Retry tidak boleh menambah mutasi ganda.

Tidak termasuk V1: procurement penuh, BOM/work order, valuasi lanjutan, jurnal Finance otomatis, portal pelanggan, kontrak sewa, aplikasi native atau transaksi offline.

## Brand Commitments

Nama di UI adalah **MTC Inventory**; nama perusahaan **PT MEDIA TEKNOLOGI CELEBES**. Pengguna mengganti arah visual DOCX menjadi clean, modern, fluid dan nyaman pada ponsel, sambil mempertahankan biru dan logo MTC. Semua peran berbagi shell terang, katalog visual, pencarian dan navigasi bawah pada ponsel. Plus Jakarta Sans lokal menggantikan Arial. Struktur proses dan bahasa Indonesia tetap dipertahankan. Detail visual aktif ada di DESIGN.md. “InventorPro”, kontak, angka dan nama contoh pada mockup tidak menjadi identitas/data produksi.

## Evidence on Hand

- Rancangan_Terpadu_Sistem_Inventory_PT_MTC_Revisi_Nota_Terintegrasi.docx: SOP, role, layar, warna, field, UAT dan addendum nota.
- Template_Nota_Terintegrasi_Peminjaman_Pengembalian_MTC.docx: judul, placeholder, dua tahap dan bagian A–G.
- docs/design/references/: lima gambar asli yang diekstrak tanpa perubahan dari DOCX utama. Inventaris sumber dan konflik terdapat di docs/design/SOURCE_MAP.md.
- Logo MTC tersedia sebagai public/logo.jpg dan digunakan pada shell/login; bukan potongan logo ilustratif mockup. Foto barang produksi, master/saldo fisik, data pengguna operasional, penetapan QMS dan bukti uji perangkat tetap memerlukan penerimaan sesuai STATUS_IMPLEMENTASI.md.
- Implementasi lokal dan review render redesign tercatat pada STATUS_IMPLEMENTASI.md serta .impeccable/review/redesign/. Bukti ini bukan kelulusan seluruh V1/UAT atau persetujuan penggunaan data operasional.
- Workbook daftar barang hanya dipakai memahami kategori/lokasi dan frekuensi pekerjaan; tidak menjadi impor/posting saldo produksi pada batch desain.

## Product Principles

- Ketertelusuran mengikuti kejadian fisik dan kewenangan nyata.
- Pengguna selalu dapat membedakan permintaan, persetujuan, penyerahan dan pemeriksaan.
- Bukti historis tetap utuh meskipun master/status saat ini berubah.
- Kondisi gagal dan koneksi terputus memiliki jalur pemulihan yang jujur.
- Perawatan satu orang dibantu dokumentasi konkret dan tes aturan bisnis.

## Accessibility & Inclusion

DOCX mewajibkan status dengan teks dan warna, label form terlihat, validasi inline dan input kode manual selain kamera. Baseline implementasi tambahan: keyboard penuh, focus terlihat, error summary, target sentuh 44 px dan pengujian kontras. WCAG 2.2 AA menjadi target engineering; belum ada hasil audit kepatuhan.

## Open Decisions

D1–D12 pada rencana tetap berlaku; terutama deadline reservasi, alokasi unit, emergency override, exception, acknowledgement, kode/revisi/retensi QMS dan freeze opname. Timezone kerja diusulkan Asia/Makassar, belum dikonfirmasi. Detail visual kini mengikuti instruksi redesign pengguna dan DESIGN.md; perubahan tampilan tidak menetapkan kebijakan operasional yang belum disahkan. Keputusan terbuka tidak menghalangi pengerjaan dengan data simulasi, tetapi memblokir gate data riil yang terkait.
