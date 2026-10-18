---
name: MTC Inventory
description: Ruang kerja inventory modern untuk tim IoT MTC
colors:
  admin-shell: "#10366d"
  primary: "#1763da"
  primary-hover: "#104fba"
  technician: "#1763da"
  technician-strong: "#1763da"
  technician-hover: "#104fba"
  canvas: "#f4f6fa"
  surface: "#fff"
  surface-muted: "#f0f3f8"
  text: "#1c2b42"
  text-muted: "#627187"
  border: "#e3e9f1"
  control-border: "#98a7bb"
  on-brand: "#fff"
  selected-bg: "#e9f1ff"
  success: "#18704e"
  success-bg: "#eaf8f1"
  warning: "#925409"
  warning-bg: "#fff6e7"
  danger: "#b43343"
  danger-bg: "#fff0f2"
  info: "#185dc1"
  info-bg: "#edf4ff"
typography:
  headline:
    fontFamily: "Jakarta, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 750
    lineHeight: 1.3
  title:
    fontFamily: "Jakarta, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Jakarta, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Jakarta, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.45
  metadata:
    fontFamily: "Jakarta, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  control: "10px"
  panel: "14px"
  badge: "7px"
  tab: "9px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "24px"
  panel: "26px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-brand}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "11px 18px"
    height: "46px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.control}"
    height: "46px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "26px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "11px 13px"
  badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    rounded: "{rounded.badge}"
    padding: "5px 10px"
  navigation-selected:
    backgroundColor: "{colors.selected-bg}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "12px"
    height: "47px"
---
# Design System: MTC Inventory

## Overview

**Creative North Star: "Ruang kerja tim MTC"**

Sistem visual yang telah diterapkan: ruang kerja terang, kartu barang visual, pencarian langsung dan aksi singkat untuk tim startup IoT MTC. Biru dan logo MTC dipertahankan; admin dan teknisi memakai keluarga visual yang sama, dengan menu sesuai peran.

Instruksi redesign pengguna tanggal 18 Oktober 2026 menggantikan gaya administratif DOCX, rail gelap/hijau dan Arial lama. Implementasi code-led mengikuti referensi pengguna, tanpa comp baru. DOCX tetap mengikat proses, bukti dan integritas inventory; detail keputusan ada di docs/design/REDESIGN_2026_10.md. Dokumen ini diekstrak dari tokens.css, globals.css, shell.tsx dan inventory-visuals.tsx setelah implementasi. Status pengujian/rilis mengikuti STATUS_IMPLEMENTASI.md, bukan keberadaan dokumen ini.

**Key Characteristics:**

- Shell putih, canvas dingin dan biru untuk aksi/seleksi.
- Foto barang asli atau ikon kategori yang konsisten.
- Tugas Ambil komponen dan Pinjam alat mudah ditemukan.
- Navigasi bawah semua peran dan daftar berlabel pada ponsel.

## Colors

Palet dingin yang bersih memakai satu aksen biru; nilai frontmatter adalah nilai CSS normatif, termasuk alias technician yang kini mengikuti biru.

### Primary

Biru kerja (`primary`) untuk tindakan, tautan, ikon aktif dan seleksi; varian `primary-hover` untuk hover. Navy MTC (`admin-shell`) mengisi blok awal pekerjaan dan identitas login, bukan sidebar penuh. Semua role berbagi biru; token technician tetap kompatibel dengan source.

### Secondary

Pasangan success/success-bg, warning/warning-bg, danger/danger-bg dan info/info-bg menyampaikan hasil/proses. Ini warna semantik status, bukan identitas role. Stok menipis, gagal, diblokir dan menunggu pemeriksaan harus tetap diberi teks.

### Neutral

Canvas adalah ruang belakang, surface adalah kartu/form/sidebar/topbar putih, surface-muted untuk lapisan informasi sekunder. Text dan text-muted memisahkan data inti dari metadata; border memisahkan struktur, control-border menandai field. Selected-bg menandai tujuan/filter aktif.

**The Status Rule.** Warna selalu ditemani label; Disetujui tidak berarti barang sudah diserahkan.

## Typography

**Display Font / Body Font:** Jakarta, system-ui, sans-serif. Alias CSS **Jakarta** memuat **Plus Jakarta Sans** lokal dari public/fonts/jakarta-latin.woff2, rentang bobot 400?800, font-display swap; lisensi OFL di public/fonts/OFL.txt. Tidak bergantung unduhan font runtime. Arial lama telah diganti.

Judul halaman 30 px/750 (26 px ponsel); panel 19 px/700 (17 px ponsel); body 16 px/1.55; label 14 px/600. Nama barang 15 px desktop, minimum 14 px ponsel. Angka ringkasan menggunakan angka tabular; paragraf umum maksimum 72ch. Sentence case dan bahasa Indonesia dipakai untuk pekerjaan utama.

**The Main Text Rule.** Nama barang dan aksi utama harus tetap terbaca: minimum 14 px pada ponsel; input teks/select/textarea minimum 16 px. Metadata pendukung (kode, kategori, waktu, satuan, navigasi bawah) boleh 11?13 px sesuai konteks; badge stok ringkas 10 px tetap didampingi rincian stok pada kartu. Ini menggantikan aturan lama minimum 14 px untuk seluruh teks web, bukan izin mengecilkan nama barang atau nilai input.

## Layout

Desktop memakai sidebar putih 236 px dan workspace fleksibel; sidebar 210 px pada lebar maksimal 1270 px. Topbar 86 px, konten maksimum 1620 px dengan padding 26 px 36 px 44 px. Panel/form mengikuti ruang tersedia; form utama maksimum 960 px. Dua kolom kerja runtuh saat ruang tidak cukup.

Pada lebar maksimal 1023 px sidebar hilang, menu Semua menu dapat dibuka, dan navigasi bawah lima tujuan tampil untuk semua peran. Bottom nav memberi safe-area serta ruang bawah konten. Di bawah 768 px topbar menjadi 68 px, pencarian global digantikan pencarian dalam halaman, konten memakai padding 20 px 18 px 112 px. Form satu kolom; tabel transaksi menjadi kartu dengan label field, bukan bergantung geser horizontal. Di bawah 360 px kartu katalog dan pintasan menjadi satu kolom.

Katalog memakai tiga kolom desktop, empat mulai 1600 px dan dua pada ponsel. Foto/ikon berada di atas nama, stok dan lokasi; mode daftar tersedia. Grid, filter dan heading boleh membungkus tanpa memotong aksi. Urutan tugas/dashboard dan pemetaan rute terbaru ada pada UI_SPEC dan brief shell, bukan kontrak universal semua halaman.

## Elevation & Depth

Permukaan putih dan canvas dingin memisahkan area; bayangan panel lembut berasal dari token --shadow (0 6px 24px rgba(25, 47, 79, 0.06)). Kartu barang saat hover memakai 0 8px 30px rgba(25, 65, 120, 0.13). Login memakai bayangan lebih luas 0 20px 70px rgba(20, 45, 90, 0.1). Border tetap digunakan pada input, tabel dan pemisah navigasi. Tidak menambahkan glow atau lapisan dekoratif di setiap baris.

## Shapes

Sudut lembut: panel/kartu 14 px, kontrol/nav 10 px, tab 9 px, badge 7 px. Blok awal pekerjaan 16 px desktop dan 14 px ponsel. Foto memakai object-contain supaya identitas barang utuh. Avatar berbentuk lingkaran. Outline focus 3 px primary, offset 3 px.

## Components

### Buttons

Tombol primary biru dengan teks putih, padding 11 px 18 px dan tinggi minimum 46 px; secondary putih dengan border dan teks utama. Danger digunakan untuk aksi destruktif. Hover memakai varian primary-hover; pressed bergeser 1 px. Disabled opacity 0.6; label proses/error tetap jujur. Kontrol sentuh utama minimal 44 px termasuk filter, view switch dan tautan aksi mobile. Tombol ikon memiliki accessible name.

### Inputs / Fields

Field putih dengan control-border 1 px, sudut 10 px, padding 11 px 13 px, tinggi minimum 48 px. Label permanen; input teks/select/textarea 16 px. SearchBox menggabungkan ikon dan input, label aksesibel tidak bergantung placeholder. Checkbox 22 px ditempatkan dengan label yang dapat dipilih. Error inline/summary, invalid dan pemulihan input mengikuti kontrak UI_SPEC; jangan mengganti validasi server dengan styling.

### Chips / Status

Filter/tab putih menjadi selected-bg dengan teks primary saat aktif; target filter minimum 44 px. Badge status memuat label dan titik currentColor, padding 5 px 10 px. Badge merupakan informasi, bukan tombol; label status tidak memindahkan stok.

### Cards / Containers

Panel putih padding 26 px desktop, 22 px 18 px ponsel, memakai radius/shadow bersama. Kartu katalog memakai ItemVisual: foto dari file berpolicy bila tersedia; fallback ikon Lucide konsisten menurut kategori/nama. Detail fallback berlabel Ilustrasi kategori. Foto produksi tidak diambil dari mockup. EmptyState menyatakan keadaan dan hanya menampilkan aksi yang benar-benar tersedia.

### Navigation

Sidebar menampilkan logo MTC, ruang kerja, tujuan utama dan kelompok Kelola gudang yang dapat dibuka. Tujuan aktif memakai aria-current. Topbar menyediakan pencarian/notifikasi/profil; ponsel memakai brand ringkas, Semua menu dan bottom nav lima tujuan. Menu lain dan logout tetap terjangkau. Pemilihan menu bukan pengganti pemeriksaan policy server. Mode uji coba adalah penjelasan ringkas yang dapat dibuka, bukan klaim kesiapan operasional.

### Transaction lists / Feedback

Desktop mempertahankan tabel; ponsel mengubah baris menjadi kartu dengan data-label. Identitas transaksi, quantity+satuan dan aksi berlabel tetap tersedia. Loading, empty, no-results, forbidden, conflict dan network-uncertain harus dibedakan; kegagalan PDF tidak meminta checkout ulang. Semua mutasi menggunakan service/policy yang ada.

Transisi warna/border/shadow 0.18 detik; reduced motion meniadakan animasi/transisi nonesensial. Tidak menunda akses pekerjaan dengan animasi masuk halaman.

## Do's and Don'ts

### Do:

- **Do** gunakan token semantik dan logo MTC yang tersedia.
- **Do** bedakan nama/aksi utama dari metadata sekunder; jaga input 16 px dan target sentuh 44 px.
- **Do** tampilkan satuan, status dengan teks, lokasi dan konsekuensi posting.
- **Do** periksa desktop/ponsel, keyboard, teks panjang dan kegagalan server sebelum menyatakan sebuah perubahan selesai.

### Don't:

- **Don't** mengembalikan rail navy/hijau atau Arial sebagai default visual lama.
- **Don't** memakai foto referensi, data demo atau ikon kategori sebagai bukti barang/kondisi riil.
- **Don't** menjumlahkan meter, pcs dan unit menjadi satu saldo atau memberi sukses sebelum commit server.
- **Don't** menyamakan approval dengan penyerahan, pengajuan kembali dengan Tersedia, atau screenshot dengan kelulusan UAT/cutover.

### Loading dan navigasi

Navigasi menu memakai progress bar indeterminate tipis pada tepi atas saat link pending. Konten data berada dalam Suspense sehingga shell/menu tetap tersedia; fallback berupa skeleton netral berlabel “Halaman sedang disiapkan…”, tanpa angka atau persentase fiktif. Pencarian internal memakai navigasi client melalui Next Form, dengan spinner pada area tombol yang tetap berukuran sama. Ekspor ke tab baru tetap memakai form native.

Animasi hanya menyatakan proses: rotasi spinner 900 ms linear, progress bar 1100 ms ease-in-out dan pulse skeleton 1500 ms ease-in-out. `prefers-reduced-motion: reduce` menonaktifkan semuanya; indikator dan status teks tetap terlihat. Kamera menampilkan “Menyiapkan kamera…” saat decoder dimuat; Hentikan Kamera membatalkan upaya yang tertunda, dan input manual tetap tersedia.
