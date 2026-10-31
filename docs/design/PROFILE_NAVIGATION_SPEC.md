# Menu akun dan navigasi halaman

Revisi pemilik 31 Oktober 2026: Keluar masuk ke dropdown profil, dan Back dipisahkan dari logo. Ini refinement Operate pada identitas MTC existing, tanpa perubahan transaksi, brand atau token.

## Riset dan keputusan

- GitHub memakai avatar kanan atas untuk mengakses Settings: [GitHub Docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/viewing-and-managing-your-sessions). Adaptasi MTC: satu pemicu avatar/nama dengan chevron, membuka kartu identitas serta tindakan akun. Tidak menyalin layout/sidebar atau aset GitHub.
- Visa membedakan brand, navigasi dan tindakan akun; varian halaman anak mengganti brand dengan judul: [Visa Top app bar](https://design.visa.com/components/top-app-bar/usage/). MTC mempertahankan brand di header; Back ditempatkan terpisah sebagai navigasi halaman, sehingga tidak menjadi kumpulan tombol di samping logo.
- Penempatan navigasi sekunder di bawah header mempunyai acuan [GOV.UK Layout](https://design-system.service.gov.uk/styles/layout/). Adaptasi MTC: link Kembali berlabel pada desktop dan bar navigasi sticky bersama Semua menu pada mobile. Ini keputusan produk berdasarkan kebutuhan PWA pemilik, bukan klaim semua brand memakai pola identik. Tidak menambah breadcrumb yang mencampur hierarki dengan riwayat browser.

## Kontrak implementasi

- Avatar adalah button native dengan nama aksesibel, chevron, expanded/controls; klik/tap/Enter/Space membuka native `popover="auto"`. Kartu tampil di top layer agar tidak terpotong container. Klik luar/Escape menutup; Escape mengembalikan fokus ke pemicu. Isi berupa nav/link/button biasa, bukan ARIA menu yang membutuhkan pola arrow-key khusus.
- Semua role memperoleh Pengaturan akun ke `/profile` (profil/password/MFA existing). Hanya ADMIN memperoleh Pengaturan aplikasi ke `/admin/settings`; server policy tetap menjadi otoritas. Nama dan role lengkap tampil dalam kartu, termasuk pada mobile. Tidak menampilkan email/credential tambahan.
- Keluar hanya berada dalam kartu akun; tidak ada tombol logout tersendiri di header/menu mobile. Memakai Better Auth signOut existing. Pending mencegah klik ulang; kegagalan tetap pada halaman aktif dengan pesan dan kesempatan retry. Login baru dibuka setelah signOut sukses.
- Kembali menggunakan guard entry internal/fallback yang telah diuji; perubahan hanya letak/tampilan. Label tetap terlihat pada HP. Header brand tetap utuh. Mobile/tablet memiliki bar sekunder sticky di bawah header; desktop memakai link quiet. Bar, label toolbar dan scroll padding menghormati safe area. Menu mobile menutup ketika link dipilih, rute berubah atau Escape.
- Target sentuh minimal 44px, fokus keyboard existing, teks aksi 14px, input existing 16px. Menu menyesuaikan viewport dan memiliki scroll internal pada layar pendek. Native popover memakai browser modern yang mendukung Popover API; tidak menambah dependency. Referensi mekanisme: [MDN Popover](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using).

## Verifikasi

Empat role; menu tertutup/default, open, keyboard/Tab/Escape/focus restore, klik luar, navigasi/close, conditional settings, error/retry/logout/session guard. Lebar 320, 390, 768, 1024 dan 1440; menu dalam viewport, kontrol sentuh, Back di bawah header serta regresi filter/forward/deep link. Bukti review di `.impeccable/review/profile-nav/`, rilis/CI/backup pada STATUS_IMPLEMENTASI.md. Screenshot latihan bukan data produksi atau bukti HP/screen reader nyata.
