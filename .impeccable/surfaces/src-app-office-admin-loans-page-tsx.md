---
version: 1
slug: "src-app-office-admin-loans-page-tsx"
primary_target: "src/app/(office)/admin/loans/page.tsx"
related_targets: ["src/app/(office)/admin/loans/[id]/page.tsx","src/app/(office)/admin/returns/page.tsx","src/app/(office)/admin/returns/[id]/page.tsx","src/app/(technician)/me/loans/page.tsx","src/app/(technician)/me/loans/[id]/page.tsx"]
---

# loans - MTC Inventory

Mode: Operate. Status: baseline dokumen sebelum implementasi; belum ada render/review lulus.
Source key: docx-mtc-20261016-r1.1.
Routes: /admin/loans, /admin/loans/[id], /admin/returns, /admin/returns/[id], /me/loans, /me/loans/[id].

Acuan: PRODUCT.md, DESIGN.md, docs/design/SOURCE_MAP.md, docs/design/UI_SPEC.md. UI_SPEC: Loan, return dan inspeksi; PRINT_SPEC; UAT-03 dan UAT-09 sampai UAT-16.

## Direction contract

THESIS: Satu LOAN dengan outstanding fisik dan inspeksi terpisah serta timeline bukti.

OWN-WORLD: Warisi navy/biru admin dan hijau teknisi, Arial, panel terang, tabel/form pada DESIGN.md; mockup DOCX menjadi referensi komposisi.

STORY: Pengguna mengenali status dan data relevan, meninjau konsekuensi, lalu menjalankan aksi berizin dengan bukti server.

FIRST VIEWPORT: LOAN/peminjam/due date, tiga angka progres, badge parsial-inspeksi-overdue bersamaan dan tab Ringkasan/Pengembalian/Riwayat/Bukti.

FORM: Form/layout diwarisi dari DOCX sesuai tugas; bukan hasil concept tournament. Source key docx-mtc-20261016-r1.1; tidak ada seed acak atau comp baru yang disetujui.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## States and acceptance

Wajib loading, kosong, filter kosong, invalid, forbidden, conflict, network uncertain dan success sesuai UI_SPEC. Saldo tidak sukses optimistis. Policy server, unit/satuan, keyboard/focus, 390/768/1024/1440px dan bukti tes relevan harus diverifikasi saat implementasi. Contract ini untuk implementasi mendatang; tidak menyatakan pekerjaan aplikasi selesai.
