---
name: MTC Inventory
description: Acuan visual implementasi dari DOCX MTC untuk aplikasi inventory internal
colors:
  admin-shell: "#0B2E59"
  primary: "#1565C0"
  primary-hover: "#0D47A1"
  technician: "#00897B"
  technician-strong: "#00695C"
  technician-hover: "#00574B"
  canvas: "#F4F7FB"
  surface: "#FFFFFF"
  surface-muted: "#EDF2F7"
  text: "#172B4D"
  text-muted: "#52647A"
  border: "#D8E1EC"
  control-border: "#7C8A9B"
  on-brand: "#FFFFFF"
  selected-bg: "#E8F1FD"
  success: "#166534"
  success-bg: "#ECFDF3"
  warning: "#92400E"
  warning-bg: "#FFFBEB"
  danger: "#B91C1C"
  danger-bg: "#FEF2F2"
  info: "#1D4ED8"
  info-bg: "#EFF6FF"
typography:
  headline:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  table:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "6px"
  panel: "10px"
  badge: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-brand}"
  button-technician:
    backgroundColor: "{colors.technician-strong}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.control}"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "10px 12px"
  badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    rounded: "{rounded.badge}"
    padding: "4px 8px"
---

# Design System: MTC Inventory

## Overview

**Creative North Star: "Meja kerja gudang MTC"**

Ini baseline implementasi sebelum kode, berdasarkan desain tertulis dan mockup DOCX; bukan hasil ekstraksi aplikasi yang sudah berjalan. Identitasnya berupa rail berwarna, ruang kerja terang, tabel padat yang terbaca dan formulir sederhana. Admin menggunakan navy/biru; teknisi menggunakan hijau/teal. Satu sistem komponen melayani keduanya.

Sumber primer: DOCX utama bagian Desain informasi website, Palet dan komponen, Desain layar admin/teknisi, serta tabel Perubahan terhadap mockup. Mockup image4 dan image5 dipertahankan sebagai referensi komposisi, bukan target pixel-perfect. docs/design/SOURCE_MAP.md membedakan keputusan sumber, pelengkapan engineering dan konflik. Nilai tambahan pada frontmatter adalah keputusan baseline implementasi; dapat disesuaikan setelah uji render dengan mencatat alasannya.

**Key Characteristics:**

- Rail navy/hijau, konten putih pada canvas dingin.
- Hierarki judul pendek, filter di atas data, satu aksi utama per konteks.
- Stok, satuan, identitas unit dan progres inspeksi selalu mudah dibaca.
- Status berupa teks dan warna; detail historis tersedia dari halaman transaksi.

## Colors

### Primary

`admin-shell`, `primary` dan `technician` berasal dari nilai eksplisit DOCX. Sidebar admin memakai admin-shell; sidebar teknisi memakai technician-strong dengan detail technician. Primary mengendalikan aksi admin/gudang. Technician-strong mengendalikan aksi teknisi.

Hijau asli technician dipertahankan sebagai identitas/aksen. Tombol teks putih menggunakan varian lebih gelap technician-strong untuk kontras. Tidak semua permukaan hijau bermakna sukses: identitas role, status dan aksi tetap dibedakan lewat label/lokasi.

### Secondary

Success untuk Tersedia/Disetujui/Selesai yang benar-benar sah; warning untuk Menunggu/Jatuh Tempo/Stok Menipis; danger untuk Ditolak/Rusak/Diblokir; info untuk informasi proses. Token latar lembut dan teks gelap dipakai berpasangan. Badge tetap memuat label, opsional ikon dan jumlah.

### Neutral

Canvas untuk ruang di belakang panel, surface untuk panel/form, surface-muted untuk header tabel/read-only, text untuk isi dan text-muted untuk bantuan. Border memisahkan panel; control-border memperjelas batas input. Jangan memakai border panel yang pucat sebagai satu-satunya penanda field.

**The Status Rule.** Warna tidak menjadi satu-satunya pembeda. Badge Disetujui bukan bukti bahwa stok sudah diserahkan; label berbeda mengikuti UI_SPEC.

## Typography

Arial/Inter diperbolehkan DOCX. Baseline memilih **Arial** agar satu keluarga, tanpa unduhan font dan sesuai teks sumber. Inter hanya bila ada keputusan perubahan yang dicatat. Jangan mewarisi Poppins/Roboto Absensi secara otomatis.

Headline 28 px untuk judul halaman desktop, 24 px pada HP; title 20 px untuk panel; body/input 16 px; label/tabel/bantuan 14 px. Minimum web 14 px mengikuti DOCX; teks print memiliki skala tersendiri pada PRINT_SPEC. Semibold dapat dirender sebagai bold bila Arial pada perangkat tidak menyediakan 600.

Gunakan sentence case, label Indonesia normal, angka tabular untuk jumlah/tanggal tabel, dan rata kanan untuk quantity. Kode/serial boleh memakai `ui-monospace, Consolas, monospace` pada bagian kecil, tetap dapat disalin. Tidak memotong asset tag/LOAN yang menjadi pembeda penting. Angka mengikuti locale id-ID; tanggal tampilan `18 Okt 2026, 09.30 WITA` hanya setelah timezone dikonfirmasi; jangan menempelkan WITA pada UTC mentah.

## Layout

Baseline ukuran berikut melengkapi DOCX yang belum menetapkan breakpoint/pixel:

| Lebar | Struktur |
|---|---|
| <768 px | Header 56 px; satu kolom; menu drawer; teknisi memakai bottom nav maksimal 5 tujuan; konten padding 16 px |
| 768–1023 px | Header 64 px; menu drawer dengan label; grid form dua kolom bila field cukup lebar; padding 24 px |
| ≥1024 px | Sidebar 240 px; header 64 px; konten padding 24 px (32 px mulai 1440 px); tabel memanfaatkan lebar yang tersisa |

Body tidak scroll horizontal. Tabel lebar boleh scroll dalam region berlabel; header sticky berada di bawah header aplikasi, tidak menutup focus. Batas nyaman form 960 px; teks penjelasan 70ch. Detail/pinjam memakai kolom utama dan ringkasan 320 px mulai 1280 px; di bawahnya ringkasan berada sebelum aksi akhir.

Sidebar: identitas MTC Inventory, kelompok menu sesuai role, active item berwarna dengan ikon/label dan `aria-current`. Header: breadcrumb, judul konteks bila diperlukan, notifikasi dan menu akun. Tidak menambah jam bergerak atau splash untuk meniru aplikasi lain. Judul halaman, deskripsi satu kalimat, dan aksi utama berada sebelum KPI/filter/data.

HP teknisi: Beranda, Cari, Request, Pinjaman, Lainnya. Halaman Ambil/Kembali/Riwayat/Profil/masalah tetap terjangkau lewat daftar tugas/Lainnya. Bottom nav tidak boleh menutupi CTA; beri safe-area/padding bawah. Aksi final sticky hanya pada form panjang, dengan label konsekuensi dan tanpa menutupi keyboard/focus.

### First viewport

Dashboard admin menampilkan heading, antrean tindakan utama, ringkasan dan awal daftar; grafik sekunder di bawah pekerjaan mendesak. Dashboard teknisi mendahulukan pinjaman/jatuh tempo dan request miliknya, lalu aksi cepat. Tidak ada hero pemasaran.

## Elevation & Depth

Panel putih dipisahkan oleh border dan jarak; shadow ringan `0 1px 3px rgba(11,46,89,0.08)` hanya untuk panel/header bila perlu. Overlay memakai `0 12px 32px rgba(11,46,89,0.18)` dan backdrop gelap 35%. Tidak memakai glow, glass atau bayangan berat pada tiap baris.

## Shapes

Control 6 px, panel 10 px dan badge pill mengikuti token. Border input 1 px, focus outline 2 px primary dengan offset 2 px; ring focus teknisi memakai technician-strong. Tombol/input minimal tinggi 44 px, jarak antartarget 8 px; kontrol ikon juga target 44 px dengan ikon 18–20 px. Foto menggunakan rasio tetap dan object-contain untuk identitas barang; tidak memangkas bagian identifikasi.

## Components

### Buttons

Primary admin biru; primary teknisi hijau gelap; secondary putih dengan border-control dan text; tertiary berupa tautan jelas. Danger hanya aksi berisiko. Hindari dua tombol primary setara pada satu keputusan; approval memiliki Setujui sebagai primary dan Tolak sebagai secondary berlabel danger. Tombol berikon menyertakan teks atau accessible name.

Semua tombol memiliki hover, focus-visible, pressed, disabled dan pending. Pending mempertahankan lebar/label, menonaktifkan submit ganda dan mengumumkan proses. Disabled memuat alasan di dekatnya; jangan menyembunyikan satu-satunya penjelasan pada tooltip.

### Forms

Label permanen, penanda Wajib + penjelasan di awal form; placeholder hanya contoh. Input jumlah berpasangan dengan satuan. Nilai server/read-only dibedakan dari disabled. Aksi penting memakai halaman dengan ringkasan konsekuensi, bukan modal bertingkat. Dialog hanya untuk konfirmasi singkat/alasan, dengan focus trap, Escape dan pengembalian focus.

Error inline memakai aria-describedby dan invalid; submit gagal menampilkan summary berfokus yang menaut ke field. Pertahankan input yang valid. Upload menunjukkan batas format/ukuran, preview, progres dan retry; foto masalah wajib menurut keputusan proses. Jangan memerlukan upload ulang ketika hanya field lain salah.

### Tables and lists

Header tetap, pencarian, filter, sortir, pagination dan ekspor sesuai izin. Header sort berupa tombol dengan aria-sort; angka/satuan eksplisit. Default halaman 25, pilihan 25/50/100; pencarian debounce 300 ms dan state filter/page tersimpan di URL. Perubahan filter kembali ke halaman pertama. Selected row selalu berbeda dari status badge.

Tabel admin memiliki kolom identitas, data inti, status dan aksi Lihat; edit/posting tidak disembunyikan sebagai ikon tanpa label. Teknisi HP menggunakan daftar tugas berisi kode, nama, due date dan aksi; detail menjaga seluruh informasi penting yang tidak muat di daftar.

### Master Data setup

Halaman Master Data memakai shell office, subnavigasi berlabel, pencarian/filter dan daftar/tree yang dapat diedit sesuai izin. Lokasi bertingkat memakai tree+detail desktop dan drill-down HP; kategori memperlihatkan default jenis/satuan/lokasi secara eksplisit. Katalog & Foto memakai editor SKU yang sama dengan Inventory. Thumbnail membedakan foto barang dan ilustrasi kategori; preview upload/ganti/fallback mengikuti form states. Tautan setup yang belum lengkap mendahului daftar tanpa menambah dashboard KPI besar. Rincian pada docs/design/MASTER_DATA_SPEC.md.

### Stock and unit summary

Quantity: Fisik Layak, Direservasi, Tersedia, Karantina beserta satuan; Tersedia = Fisik Layak − Direservasi. Serialized: hitung unit per availability; tampilkan kondisi dan status teknis terpisah. Jangan menjumlahkan meter dan pcs, atau menampilkan total quantity ditambah total unit sebagai total stok tunggal.

### Loan progress and evidence

Komponen khas berupa ringkasan tiga angka: Diserahkan, Belum Kembali, Menunggu Pemeriksaan, lalu timeline checkout/return/inspection/correction. Label Dikembalikan Sebagian, Menunggu Pemeriksaan dan Overdue dapat tampil bersamaan. Tab Ringkasan, Pengembalian, Riwayat dan Bukti memakai satu nomor LOAN tetap. Bukti Awal/Versi Terbaru berupa tautan terpisah dengan versi/tahap/tanggal, bukan satu tombol yang diam-diam menimpa file.

### Scanner

Panel kamera client-only, tombol Aktifkan Kamera dan input kode manual selalu tersedia. Kamera gagal/izin ditolak menampilkan fallback dan instruksi. Hasil scan memilih baris/unit dan mengumumkan duplikat; belum memposting. Kamera berhenti saat panel ditutup/halaman ditinggalkan.

### Feedback, empty and error states

Skeleton/aria-busy untuk pemuatan, empty state dengan tindakan yang sah, no-results dengan Hapus Filter, forbidden dengan penjelasan tanpa membocorkan data, conflict dengan jumlah terbaru dan opsi Muat Ulang. Saat timeout mutasi: “Hasil belum dapat dipastikan. Periksa status transaksi sebelum mencoba lagi.” Retry menggunakan key awal. Kegagalan PDF menampilkan “Bukti sedang diproses”/“Pembuatan bukti gagal” dan retry berizin tanpa checkout ulang.

Transisi focus/hover 150 ms, drawer/dialog 200 ms, ease-out. Reduced motion mematikan pergerakan nonesensial. Tidak ada animasi masuk halaman yang menunda tugas. Pengumuman status lewat aria-live polite; error penting lewat alert tanpa pengumuman duplikat.

## Do's and Don'ts

### Do:

- **Do** pertahankan identitas, komposisi kerja dan nama MTC dari sumber; lihat gambar admin/teknisi sebelum membuat shell.
- **Do** gunakan token semantik; terapkan varian role di shell dan aksi, bukan dua aplikasi frontend.
- **Do** beri label alasan penolakan, override, koreksi dan selisih; tampilkan konsekuensi sebelum posting.
- **Do** uji 390, 768, 1024 dan 1440 px, zoom 200%, keyboard, kontras dan teks panjang.

### Don't:

- **Don't** menyalin InventorPro, data contoh, bangunan/logo ilustratif atau teks rusak dari mockup ke produksi.
- **Don't** menyalin ukuran teks kecil pada collage; minimum 14 px web tetap berlaku.
- **Don't** membuat scan otomatis mengeluarkan stok, pengajuan kembali otomatis Tersedia, atau admin otomatis menyetujui sendiri.
- **Don't** memberi angka stok sukses secara optimistis sebelum server memastikan commit.
- **Don't** mengklaim desain telah dirender/diuji atau dokumen QMS telah disahkan hanya karena spesifikasi ini lengkap.
