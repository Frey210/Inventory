---
version: 1
slug: "src-server-documents-templates-loan-tsx"
primary_target: "src/server/documents/templates/loan.tsx"
related_targets: ["src/server/documents/render-loan.ts"]
---

# Nota terpadu - MTC Inventory

Mode: Read. Status: baseline dari DOCX, belum dirender atau disahkan QMS.
Acuan: docs/design/PRINT_SPEC.md, PRINT_FIELDS.json dan template DOCX asli.

## Direction contract

THESIS: Satu LOAN memuat bukti checkout dan return bertahap, tanpa menghapus versi awal.

OWN-WORLD: Letter portrait, halaman putih, tabel terkendali, identitas perusahaan dan bagian A-G; bukan shell aplikasi. Font/margin mengikuti PRINT_SPEC dan substitusi tercatat.

STORY: Pembaca mengenali transaksi, melihat siapa menyerahkan dan menerima, kondisi tiap unit, kejadian kembali, outstanding dan verifikasi.

FIRST VIEWPORT: Identitas perusahaan/judul, kontrol kode-revisi-LOAN-versi, A identitas, B baris awal, C otorisasi dan D status; page break sebelum E. Header/kolom berulang pada lanjutan.

FORM: Warisi template DOCX khusus; source key template-nota-mtc-20261018. Tidak ada seed acak/comp baru.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Acceptance

Periksa 47 placeholder, 1/30+ item, multi-event, kondisi masalah, QR, Letter, grayscale, header/tabel berulang, tidak clipping, snapshot awal/akhir dan audit unduh. Belum kembali berarti Belum ada pengembalian/Belum diverifikasi, bukan data fiktif. Full print acceptance dan QMS mengikuti PRINT_SPEC. Brief ini tidak mengklaim PDF telah dibangun.
