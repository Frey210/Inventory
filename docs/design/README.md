# Paket desain untuk implementasi

**Supersesi visual 18 Oktober 2026:** instruksi pengguna mengganti gaya administratif DOCX dengan UI clean, modern, fluid dan nyaman di ponsel; biru dan logo MTC tetap. Acuan visual aktif adalah DESIGN.md serta REDESIGN_2026_10.md. Kontrak proses/bukti dari DOCX, UI_SPEC dan PRINT_SPEC tetap mengikat. Status implementasi/UAT/cutover mengikuti STATUS_IMPLEMENTASI.md. Brief historis masih dapat memuat target rencana/gaya lama; untuk shell aktif gunakan .impeccable/surfaces/src-components-shell-tsx.md dan source src/components/shell.tsx. Jangan menganggap brief historis sebagai perintah mengembalikan gaya lama.

Mulai dari AGENTS.md, PRODUCT.md dan DESIGN.md. Baca bagian UI_SPEC yang sesuai ID backlog, lalu brief target melalui Impeccable. PRINT_SPEC dan PRINT_FIELDS wajib saat mengerjakan snapshot/nota. Jangan memuat semua dokumen setiap kali mengubah satu komponen kecil; baca aturan bersama dan bagian yang terdampak, lalu sumber asli jika ada konflik/detail kritis.

| Berkas | Fungsi |
|---|---|
| ../../PRODUCT.md | Tujuan, pengguna, workflow, cakupan, invarian dan keputusan terbuka |
| ../../DESIGN.md | Token dan aturan visual bersama, shell role, komponen/states/responsif |
| UI_SPEC.md | Peta rute/menu, hak akses, field dan interaksi per modul |
| MASTER_DATA_SPEC.md | Setup lokasi/jenis/kategori/default/satuan/katalog/foto dan pengisian otomatis saat tambah inventory |
| PRINT_SPEC.md | Struktur A–G, Letter, snapshot, arsip dan acceptance cetak |
| PRINT_FIELDS.json | Daftar seluruh placeholder asli template dengan bagian asal |
| SOURCE_MAP.md | Hierarki acuan, konflik, pelengkapan engineering dan batas verifikasi |
| SOURCE_MANIFEST.json | Hash sumber/gambar dan provenance ekstraksi |
| references/ | Gambar asli mockup/diagram khusus development |
| ../../.impeccable/surfaces/ | Brief target; brief shell aktif mengikat redesign, brief historis disimpan sebagai konteks |
| ../../.impeccable/design.json | Ekstensi sistem visual aktif dan preview primitive dari CSS/komponen |
| ../../STATUS_IMPLEMENTASI.md | Status implementasi, bukti verifikasi, gate dan handoff antarsesi |
| REDESIGN_2026_10.md | Instruksi pengguna, arah visual aktif dan konteks satu gudang; workbook bukan impor stok |

## Urutan satu batch frontend

1. Pilih ID backlog dan target. Baca status terbaru serta acceptance; jangan mengubah modul aplikasi tetangga.
2. Jalankan `impeccable context --target <target>` sekali per sesi dari root proyek memakai launcher pada AGENTS.md. Brief memakai target rencana yang dapat diremap bila struktur source berubah.
3. Ikuti token DESIGN.md dan kontrak halaman terkait. Baca `reference/craft-floor.md` tepat sebelum edit UI sesuai skill.
4. Bangun satu irisan dengan session/policy server, validasi, service/transaksi dan error states; bukan UI statis yang dianggap fitur selesai.
5. Verifikasi tes domain/server dan screenshot target desktop/HP, keyboard/focus/kontras; detektor Impeccable sesuai skill. Catat hal yang memerlukan uji perangkat nyata.
6. Perbarui status dan dokumentasi bila ada keputusan yang berubah. Klaim selesai hanya untuk acceptance yang benar-benar diuji. Perubahan token disinkronkan ke sidecar; jangan membuat nilai kedua yang bertentangan di komponen.

Redesign 18 Oktober 2026 memakai jalur code-led dari referensi pengguna, tanpa comp baru. Review render lokal dan bukti pemeriksaan berada di `.impeccable/review/redesign/` serta STATUS_IMPLEMENTASI.md; ini tidak menyatakan seluruh V1/UAT atau cutover lulus. DOCX tetap menjadi acuan proses dan nota. Navigasi/form transaksi memakai service yang ada; `/admin/requests/new` berbagi request service dengan alur teknisi dan menerima query opsional mode/item, bukan jalan pintas posting stok.
