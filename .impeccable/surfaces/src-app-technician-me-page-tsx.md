---
version: 1
slug: "src-app-technician-me-page-tsx"
primary_target: "src/app/(technician)/me/page.tsx"
related_targets: ["src/app/(technician)/me/items/page.tsx","src/app/(technician)/me/items/[id]/page.tsx","src/app/(technician)/me/requests/new/page.tsx","src/app/(technician)/me/requests/[id]/page.tsx","src/app/(technician)/me/pickups/page.tsx","src/app/(technician)/me/consumable-returns/new/page.tsx","src/app/(technician)/me/incidents/new/page.tsx","src/app/(technician)/me/history/page.tsx"]
---

# technician - MTC Inventory

Mode: Operate. Status: baseline dokumen sebelum implementasi; belum ada render/review lulus.
Source key: docx-mtc-20261016-r1.1.
Routes: /me, /me/items, /me/items/[id], /me/requests/new, /me/requests/[id], /me/pickups, /me/consumable-returns/new, /me/incidents/new, /me/history.

Acuan: PRODUCT.md, DESIGN.md, docs/design/SOURCE_MAP.md, docs/design/UI_SPEC.md. UI_SPEC: Beranda/Cari/Request/Ambil/Sisa/Masalah/Riwayat; tidak self-service posting.

## Direction contract

THESIS: Teknisi menyelesaikan tugas sendiri dari HP dengan identitas hijau dan fallback manual.

OWN-WORLD: Warisi navy/biru admin dan hijau teknisi, Arial, panel terang, tabel/form pada DESIGN.md; mockup DOCX menjadi referensi komposisi.

STORY: Pengguna mengenali status dan data relevan, meninjau konsekuensi, lalu menjalankan aksi berizin dengan bukti server.

FIRST VIEWPORT: Header ringkas, tugas/pinjaman jatuh tempo, daftar/filter atau form satu kolom; bottom nav 5 tujuan; CTA tidak tertutup keyboard.

FORM: Form/layout diwarisi dari DOCX sesuai tugas; bukan hasil concept tournament. Source key docx-mtc-20261016-r1.1; tidak ada seed acak atau comp baru yang disetujui.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## States and acceptance

Wajib loading, kosong, filter kosong, invalid, forbidden, conflict, network uncertain dan success sesuai UI_SPEC. Saldo tidak sukses optimistis. Policy server, unit/satuan, keyboard/focus, 390/768/1024/1440px dan bukti tes relevan harus diverifikasi saat implementasi. Contract ini untuk implementasi mendatang; tidak menyatakan pekerjaan aplikasi selesai.
