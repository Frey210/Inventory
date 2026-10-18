---
version: 1
slug: "src-app-office-admin-transfers-page-tsx"
primary_target: "src/app/(office)/admin/transfers/page.tsx"
related_targets: ["src/app/(office)/admin/stocktakes/page.tsx","src/app/(office)/admin/stocktakes/[id]/page.tsx","src/app/(office)/admin/maintenance/page.tsx","src/app/(office)/admin/incidents/page.tsx"]
---

# controls - MTC Inventory

Mode: Operate. Status: baseline dokumen sebelum implementasi; belum ada render/review lulus.
Source key: docx-mtc-20261016-r1.1.
Routes: /admin/transfers, /admin/stocktakes, /admin/stocktakes/[id], /admin/maintenance, /admin/incidents.

Acuan: PRODUCT.md, DESIGN.md, docs/design/SOURCE_MAP.md, docs/design/UI_SPEC.md. UI_SPEC: Opname, transfer, maintenance, installed; UAT-06 sampai UAT-08.

## Direction contract

THESIS: Koreksi dan release berotorisasi dengan alasan, freeze serta bukti; tidak edit saldo langsung.

OWN-WORLD: Warisi navy/biru admin dan hijau teknisi, Arial, panel terang, tabel/form pada DESIGN.md; mockup DOCX menjadi referensi komposisi.

STORY: Pengguna mengenali status dan data relevan, meninjau konsekuensi, lalu menjalankan aksi berizin dengan bukti server.

FIRST VIEWPORT: Identitas sesi/unit, status/freeze/kalibrasi, baris hitung atau kondisi, reviewer dan aksi sah berikutnya.

FORM: Form/layout diwarisi dari DOCX sesuai tugas; bukan hasil concept tournament. Source key docx-mtc-20261016-r1.1; tidak ada seed acak atau comp baru yang disetujui.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## States and acceptance

Wajib loading, kosong, filter kosong, invalid, forbidden, conflict, network uncertain dan success sesuai UI_SPEC. Saldo tidak sukses optimistis. Policy server, unit/satuan, keyboard/focus, 390/768/1024/1440px dan bukti tes relevan harus diverifikasi saat implementasi. Contract ini untuk implementasi mendatang; tidak menyatakan pekerjaan aplikasi selesai.
