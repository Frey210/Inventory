---
version: 1
slug: "src-app-office-admin-receipts-page-tsx"
primary_target: "src/app/(office)/admin/receipts/page.tsx"
related_targets: ["src/app/(office)/admin/receipts/new/page.tsx","src/app/(office)/admin/receipts/[id]/page.tsx","src/app/(office)/admin/requests/page.tsx","src/app/(office)/admin/requests/[id]/page.tsx","src/app/(office)/admin/issues/new/page.tsx","src/app/(office)/admin/issues/[id]/page.tsx","src/app/(office)/admin/consumable-returns/page.tsx","src/app/(office)/admin/checkouts/new/page.tsx"]
---

# fulfilment - MTC Inventory

Mode: Operate. Status: baseline dokumen sebelum implementasi; belum ada render/review lulus.
Source key: docx-mtc-20261016-r1.1.
Routes: /admin/receipts, /admin/receipts/new, /admin/receipts/[id], /admin/requests, /admin/requests/[id], /admin/issues/new, /admin/issues/[id], /admin/consumable-returns, /admin/checkouts/new.

Acuan: PRODUCT.md, DESIGN.md, docs/design/SOURCE_MAP.md, docs/design/UI_SPEC.md. UI_SPEC: Barang masuk, request/approval, issue, checkout; INV-07 sampai INV-15.

## Direction contract

THESIS: Pisahkan draft, approval, reservasi dan posting fisik; scan tidak memposting.

OWN-WORLD: Warisi navy/biru admin dan hijau teknisi, Arial, panel terang, tabel/form pada DESIGN.md; mockup DOCX menjadi referensi komposisi.

STORY: Pengguna mengenali status dan data relevan, meninjau konsekuensi, lalu menjalankan aksi berizin dengan bukti server.

FIRST VIEWPORT: Shell office, referensi/status, baris barang bersatuan/unit dan ringkasan konsekuensi; aksi final setelah review.

FORM: Form/layout diwarisi dari DOCX sesuai tugas; bukan hasil concept tournament. Source key docx-mtc-20261016-r1.1; tidak ada seed acak atau comp baru yang disetujui.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## States and acceptance

Wajib loading, kosong, filter kosong, invalid, forbidden, conflict, network uncertain dan success sesuai UI_SPEC. Saldo tidak sukses optimistis. Policy server, unit/satuan, keyboard/focus, 390/768/1024/1440px dan bukti tes relevan harus diverifikasi saat implementasi. Contract ini untuk implementasi mendatang; tidak menyatakan pekerjaan aplikasi selesai.
