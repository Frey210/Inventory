---
version: 1
slug: "src-app-office-admin-dashboard-page-tsx"
primary_target: "src/app/(office)/admin/dashboard/page.tsx"
related_targets: ["src/app/(office)/admin/items/page.tsx","src/app/(office)/admin/items/new/page.tsx","src/app/(office)/admin/items/[id]/page.tsx","src/app/(office)/admin/items/[id]/edit/page.tsx","src/app/(office)/admin/assets/[id]/page.tsx","src/app/(office)/admin/masters/page.tsx","src/app/(office)/admin/reports/page.tsx","src/app/(office)/admin/users/page.tsx","src/app/(office)/admin/audit/page.tsx","src/app/(office)/admin/settings/page.tsx"]
---

# office - MTC Inventory

Mode: Operate. Status: baseline dokumen sebelum implementasi; belum ada render/review lulus.
Source key: docx-mtc-20261016-r1.1.
Routes: /admin/dashboard, /admin/items, /admin/items/new, /admin/items/[id], /admin/items/[id]/edit, /admin/assets/[id], /admin/masters, /admin/reports, /admin/users, /admin/audit, /admin/settings.

Acuan: PRODUCT.md, DESIGN.md, docs/design/SOURCE_MAP.md, docs/design/UI_SPEC.md. UI_SPEC: Dashboard, master, laporan, audit, pengguna, pengaturan.

## Direction contract

THESIS: Shell navy dan ruang kerja terang yang memprioritaskan antrean operasional.

OWN-WORLD: Warisi navy/biru admin dan hijau teknisi, Arial, panel terang, tabel/form pada DESIGN.md; mockup DOCX menjadi referensi komposisi.

STORY: Pengguna mengenali status dan data relevan, meninjau konsekuensi, lalu menjalankan aksi berizin dengan bukti server.

FIRST VIEWPORT: Sidebar 240px desktop, heading/filter/aksi, KPI dan awal antrean/tabel; HP memakai drawer.

FORM: Form/layout diwarisi dari DOCX sesuai tugas; bukan hasil concept tournament. Source key docx-mtc-20261016-r1.1; tidak ada seed acak atau comp baru yang disetujui.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## States and acceptance

Untuk target `/admin/masters` dan editor SKU, wajib baca docs/design/MASTER_DATA_SPEC.md: lokasi/jenis/kategori/satuan/default/katalog/foto disiapkan dahulu; form inventory memilih SKU tanpa duplikasi metadata. Setup menyertakan status aktif, validasi relasi/upload, audit, konflik edit dan default yang tidak menimpa input pengguna. Perubahan master tidak memposting stok atau mengubah snapshot.

Wajib loading, kosong, filter kosong, invalid, forbidden, conflict, network uncertain dan success sesuai UI_SPEC. Saldo tidak sukses optimistis. Policy server, unit/satuan, keyboard/focus, 390/768/1024/1440px dan bukti tes relevan harus diverifikasi saat implementasi. Contract ini untuk implementasi mendatang; tidak menyatakan pekerjaan aplikasi selesai.
