# MTC Inventory

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Baseline perencanaan yang telah direvisi: Next.js App Router, React, TypeScript strict, Tailwind 4, Prisma 7 dan PostgreSQL. Implementasi dikerjakan Codex, dengan satu pemilik/pemelihara aplikasi. Detail versi dan deployment mengikuti RENCANA_IMPLEMENTASI_MTC_INVENTORY.md; belum ada aplikasi yang dibangun.

## Users

Perusahaan memiliki kurang dari 20 karyawan. Empat peran mengikuti DOCX: Admin Sistem, Penanggung Jawab Gudang, Teknisi/Pengguna, Auditor/Manajemen. Admin mengelola akses/konfigurasi; gudang menerima, menyerahkan dan memeriksa; teknisi mencari, mengajukan, mengakui penerimaan dan mengembalikan; auditor/manajemen meninjau sesuai kewenangan. Admin tidak otomatis menjadi approver bisnis dan pemohon tidak menyetujui request sendiri.

## Product Purpose

Mengendalikan persediaan jumlah dan aset beridentitas unit, dari penerimaan, permintaan, approval dan penyerahan sampai pengembalian, inspeksi dan rekonsiliasi. Keberhasilan dibuktikan oleh saldo yang cocok dengan ledger/fisik, unit yang tidak dipinjam ganda, bukti yang dapat ditelusuri dan UAT-01–16; bukan jumlah layar yang selesai dibuat.

## Positioning

Aplikasi operasional internal PT MEDIA TEKNOLOGI CELEBES. Satu pinjaman menggunakan satu LOAN sepanjang checkout, beberapa return event dan versi bukti. Consumable memakai issue, sisa layak dan waste yang terpisah dari siklus unit equipment/sensor. Nota awal tetap dapat diakses setelah pengembalian.

## Operating Context

- Gudang/admin bekerja dengan tabel dan formulir desktop/tablet; teknisi juga menggunakan HP, kamera QR dan scanner USB mode keyboard.
- Semua transaksi memerlukan server. Gangguan jaringan harus memperlihatkan hasil yang belum pasti dan menyediakan pemeriksaan status/retry idempotent.
- Referensi utama: dua DOCX di root. Rancangan utama memiliki addendum revisi 1.1 tanggal 16 Oktober 2026. Mockup di dalamnya adalah referensi tampilan yang harus diselaraskan dengan aturan tertulis.
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

Nama di UI adalah **MTC Inventory**; nama perusahaan **PT MEDIA TEKNOLOGI CELEBES**. Pengguna meminta desain mengikuti DOCX. Pertahankan identitas admin biru tua dan teknisi hijau, struktur kerja dan bahasa Indonesia. Detail visual ada di DESIGN.md. “InventorPro”, kontak, angka dan nama contoh pada mockup tidak menjadi identitas/data produksi.

## Evidence on Hand

- Rancangan_Terpadu_Sistem_Inventory_PT_MTC_Revisi_Nota_Terintegrasi.docx: SOP, role, layar, warna, field, UAT dan addendum nota.
- Template_Nota_Terintegrasi_Peminjaman_Pengembalian_MTC.docx: judul, placeholder, dua tahap dan bagian A–G.
- docs/design/references/: lima gambar asli yang diekstrak tanpa perubahan dari DOCX utama. Inventaris sumber dan konflik terdapat di docs/design/SOURCE_MAP.md.
- Belum tersedia dalam Inventory: logo perusahaan mandiri yang telah disahkan, foto barang produksi, master/saldo fisik, data pengguna operasional, penetapan QMS dan bukti uji perangkat. Logo/gambar bangunan dalam mockup bukan asset produksi yang dapat dipotong dan dipakai.

## Product Principles

- Ketertelusuran mengikuti kejadian fisik dan kewenangan nyata.
- Pengguna selalu dapat membedakan permintaan, persetujuan, penyerahan dan pemeriksaan.
- Bukti historis tetap utuh meskipun master/status saat ini berubah.
- Kondisi gagal dan koneksi terputus memiliki jalur pemulihan yang jujur.
- Perawatan satu orang dibantu dokumentasi konkret dan tes aturan bisnis.

## Accessibility & Inclusion

DOCX mewajibkan status dengan teks dan warna, label form terlihat, validasi inline dan input kode manual selain kamera. Baseline implementasi tambahan: keyboard penuh, focus terlihat, error summary, target sentuh 44 px dan pengujian kontras. WCAG 2.2 AA menjadi target engineering; belum ada hasil audit kepatuhan.

## Open Decisions

D1–D12 pada rencana tetap berlaku; terutama deadline reservasi, alokasi unit, emergency override, exception, acknowledgement, kode/revisi/retensi QMS dan freeze opname. Timezone kerja diusulkan Asia/Makassar, belum dikonfirmasi. Detail visual yang belum ditentukan DOCX ditetapkan sebagai baseline implementasi di DESIGN.md dan bukan kebijakan operasional yang disahkan. Keputusan terbuka tidak menghalangi pengerjaan dengan data simulasi, tetapi memblokir gate data riil yang terkait.
