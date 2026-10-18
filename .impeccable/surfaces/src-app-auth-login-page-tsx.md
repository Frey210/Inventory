---
version: 1
slug: "src-app-auth-login-page-tsx"
primary_target: "src/app/(auth)/login/page.tsx"
related_targets: ["src/app/(auth)/forgot-password/page.tsx","src/app/(auth)/reset-password/page.tsx","src/app/(auth)/verify-2fa/page.tsx","src/app/(account)/profile/page.tsx"]
---

# auth - MTC Inventory

Mode: Operate. Status: baseline dokumen sebelum implementasi; belum ada render/review lulus.
Source key: docx-mtc-20261016-r1.1.
Routes: /login, /forgot-password, /reset-password, /verify-2fa, /profile.

Acuan: PRODUCT.md, DESIGN.md, docs/design/SOURCE_MAP.md, docs/design/UI_SPEC.md. UI_SPEC: Login dan pemulihan; profile/MFA; DESIGN.md Forms.

## Direction contract

THESIS: Satu login MTC, form jelas dan aman; role baru diketahui setelah autentikasi.

OWN-WORLD: Warisi navy/biru admin dan hijau teknisi, Arial, panel terang, tabel/form pada DESIGN.md; mockup DOCX menjadi referensi komposisi.

STORY: Pengguna mengenali status dan data relevan, meninjau konsekuensi, lalu menjalankan aksi berizin dengan bukti server.

FIRST VIEWPORT: Split identitas navy dan form putih; HP satu kolom; username/email dan password terlihat sebelum aksi Masuk.

FORM: Form/layout diwarisi dari DOCX sesuai tugas; bukan hasil concept tournament. Source key docx-mtc-20261016-r1.1; tidak ada seed acak atau comp baru yang disetujui.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## States and acceptance

Wajib loading, kosong, filter kosong, invalid, forbidden, conflict, network uncertain dan success sesuai UI_SPEC. Saldo tidak sukses optimistis. Policy server, unit/satuan, keyboard/focus, 390/768/1024/1440px dan bukti tes relevan harus diverifikasi saat implementasi. Contract ini untuk implementasi mendatang; tidak menyatakan pekerjaan aplikasi selesai.
