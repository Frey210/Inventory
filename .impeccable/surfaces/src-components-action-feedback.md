---
version: 1
slug: action-feedback
primary_target: "src/components/action-feedback.tsx"
related_targets: ["src/components/forms.tsx", "src/app/layout.tsx", "src/app/[[...path]]/page.tsx", "src/app/operations.css"]
---

# Umpan balik tindakan dan pengembalian alat

Mode: Operate. Extension incumbent DESIGN.md; sumber utama perbaikan_2.docx dan dua screenshot pengguna, 31 Oktober 2026. Tidak ada comp baru atau pergantian brand.

THESIS: Pengguna langsung tahu tindakan berhasil dan dapat menemukan pengajuan pengembalian per unit tanpa menebak status.
OWN-WORLD: Biru/logo MTC, Jakarta, canvas dingin dan status hijau yang sudah berlaku.
FIRST VIEWPORT: Notifikasi berhasil terlihat pada viewport saat hasil server diterima, termasuk saat pengguna berada di bagian bawah form. Di halaman pinjaman, tindakan pengembalian berupa disclosure dengan kata kerja, ikon dan indikator buka/tutup.
STORY: Simpan/ajukan, baca konfirmasi, lanjutkan pekerjaan. Pilih unit, isi kondisi/catatan, ajukan; petugas tetap menerima fisik lalu memeriksa.
FORM: Satu notifikasi bersama, tanpa dependency baru atau dialog yang memblokir. Toast delapan detik, jeda saat hover/fokus dan dapat ditutup; konfirmasi inline tetap ada sebagai catatan menetap. Hanya satu live region status mengumumkan keberhasilan. Error tetap berfokus pada form.
FINISH: Capture desktop/mobile notifikasi saat form di-scroll, serta kontrol pengembalian tertutup/terbuka. Uji keyboard, tombol tutup, pengumuman ulang sukses identik, error, timer, pause, lebar 320-1440 serta stock tetap hingga aksi berwenang. Review memakai screenshot pengguna sebagai anti-reference; tidak mengklaim UAT perangkat fisik.
