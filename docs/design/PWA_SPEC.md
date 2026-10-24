# PWA MTC Inventory

Penambahan 25 Oktober 2026. Tujuan: membuka aplikasi dari ikon layar utama dengan pengalaman standalone. Pemasangan bukan aplikasi atau akun terpisah.

## Identitas

Nama MTC Inventory, theme `#1763da`, canvas `#f5f7fb`. Simbol pada `public/mtc-symbol.svg` adalah turunan monogram logo perusahaan `public/logo.jpg`, tanpa tulisan perusahaan kecil agar terbaca sebagai favicon. Logo header existing dipertahankan. Skill `kaankiziltug/logo-design-skill` digunakan dalam mode Assets melalui `export_variants.py`; bukan pembuatan raster AI. PNG membawa metadata asal, termasuk sumber SVG dan proses render.

Manifest `/manifest.webmanifest`: scope/id/start URL `/`, standalone, bahasa Indonesia, ikon 192/512 dan maskable 512. Apple touch 180 serta favicon 16/32/48/ICO disediakan. Ikon maskable memakai latar penuh dan zona aman; ukuran kecil diperiksa secara visual.

## Pemasangan dan koneksi

Profil memuat tombol pemasangan ketika browser menyediakan `beforeinstallprompt`, serta petunjuk menu Chrome/Edge dan Safari Bagikan → Tambahkan ke Layar Utama. HTTPS produksi diperlukan. Pemasangan fisik tiap OS/browser tetap menjadi UAT.

Worker `/sw.js` memakai header no-store dan `updateViaCache: none`. Cache hanya halaman offline statis dan ikon yang disebut eksplisit. Navigasi memakai jaringan; kegagalan koneksi mendapat halaman offline tanpa data pribadi. API, POST/Server Actions, RSC, HTML akun/stok, foto privat dan bukti tidak disimpan oleh worker. Tidak ada replay/antrean transaksi offline. Data yang tampak pada tab terbuka tetap harus diverifikasi server saat aksi.

Pembaruan tidak memaksa `skipWaiting`, reload atau pengiriman ulang form aktif. Naikkan versi cache ketika aset offline berubah. Cache versi MTC lama dibersihkan saat worker baru aktif; cache lain tidak dihapus. Reminder tetap Notification di aplikasi; Web Push tidak termasuk.

## Verifikasi

Uji manifest, ikon, header worker, cache allowlist, fallback offline, autentikasi dan role. Keberhasilan otomatis bukan bukti pemasangan fisik, kamera, printer, seluruh UAT atau persetujuan mode live. Bukti rilis ada pada STATUS_IMPLEMENTASI.md.
