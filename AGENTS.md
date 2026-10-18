# Aturan kerja MTC Inventory

Gunakan dokumen ini sebagai konteks untuk semua perubahan pada aplikasi Inventory.

## Acuan proyek

- Kebutuhan utama: `Rancangan_Terpadu_Sistem_Inventory_PT_MTC_Revisi_Nota_Terintegrasi.docx`.
- Template nota: `Template_Nota_Terintegrasi_Peminjaman_Pengembalian_MTC.docx`.
- Rencana implementasi dan keputusan teknis: `RENCANA_IMPLEMENTASI_MTC_INVENTORY.md`.
- Evaluasi lintas aplikasi dan workflow Codex: `EVALUASI_STACK_DAN_WORKFLOW_CODEX.md`.
- Konteks produk: `PRODUCT.md`; acuan visual: `DESIGN.md`; paket halaman/nota dan sumber: `docs/design/README.md`. Baca `docs/design/UI_SPEC.md` sesuai modul dan `docs/design/PRINT_SPEC.md` untuk bukti cetak.
- Handoff sesi: `STATUS_IMPLEMENTASI.md`. File ini sudah disiapkan; perbarui sejak spike/bootstrap, jangan membuat status paralel.
- Urutan pekerjaan dan acceptance: `BACKLOG_IMPLEMENTASI_MTC_INVENTORY.md`.
- Repository `Frey210/Inventory` telah diperiksa kosong sebelum bootstrap. Lihat STATUS_IMPLEMENTASI.md untuk commit, verifikasi dan status rilis terkini.
- Jangan menyalin credential atau rahasia dari catatan lokal ke kode, dokumentasi, prompt, log, maupun repository. Rotasi credential sebelum digunakan bila belum dirotasi.

## Skill yang digunakan

- Untuk pekerjaan kode aplikasi, gunakan `$ponytail:ponytail` level full untuk menjaga perubahan sekecil mungkin dan tetap aman. Terapkan validasi, error handling, keamanan, aksesibilitas, serta tes logika non-trivial yang diwajibkan skill.
- Untuk komunikasi langsung, pertahankan gaya ringkas `$caveman` dalam bahasa pengguna. Kode, nama API, error, konfigurasi, dan artefak proyek tetap memakai bahasa normal yang dapat dibaca sesuai pengecualian Ponytail.
- Untuk setiap perubahan frontend, desain halaman, atau interaksi pengguna, baca dan terapkan `$ui-ux-pro-max` **dan** `$impeccable`.
- Desain mengikuti DOCX yang diberikan pengguna. Pertahankan token/shell/komponen pada DESIGN.md, brief target pada `.impeccable/surfaces/`, dan kontrak UI_SPEC. Detail tambahan ditandai baseline engineering; jangan membuat redesign atau menyalin brand/data/logo ilustratif mockup. Referensi gambar hanya untuk development, tidak disalin ke public aplikasi.
- Tambahan pengguna: Master Data admin sebagai pusat setup lokasi, jenis, kategori/default, satuan, katalog/foto sebelum penambahan inventory; ikuti `docs/design/MASTER_DATA_SPEC.md`. Katalog SKU dipakai bersama form penerimaan, tanpa data ganda; simpan/default master tidak mengubah stok atau bukti historis.
- Pada setiap sesi frontend, jalankan `impeccable context` sekali dari direktori proyek melalui `C:\Users\ASUS TUF\.agents\skills\impeccable\scripts\impeccable.cmd`. Ikuti surface brief dan DESIGN.md/PRODUCT.md jika ada. Baca playbook yang cocok; tepat sebelum mengedit UI baca `reference/craft-floor.md`. Untuk UI yang sudah ada, pertahankan perilaku dan identitas yang masih berlaku kecuali pengguna meminta redesign.
- Stack perencanaan revisi: Next.js App Router, React, TypeScript strict, Tailwind 4, Prisma 7 dan PostgreSQL. Gunakan panduan Next/React yang sesuai versi terpin; rekomendasi Laravel/Livewire lama telah digantikan. Verifikasi versi/kompatibilitas saat bootstrap, bukan menyalin versi manifest aplikasi tetangga.
- Skill tersedia lokal di `C:\Users\ASUS TUF\.codex\plugins\cache\ponytail\ponytail\5.3.2\skills\ponytail\SKILL.md`, `C:\Users\ASUS TUF\.codex\skills\caveman\SKILL.md`, `C:\Users\ASUS TUF\.agents\skills\ui-ux-pro-max\SKILL.md`, dan `C:\Users\ASUS TUF\.agents\skills\impeccable\SKILL.md`. Ikuti instruksi yang sedang terpasang, bukan mengasumsikan lokasi data skill.

## Headroom

Repository `headroomlabs-ai/headroom` menyediakan tool/proxy agent, bukan Codex skill berisi `SKILL.md`. Headroom CLI dan MCP server telah dipasang untuk membantu kompresi konteks. Jangan menyebutnya skill yang diinstal.

- Sebelum memakai tool Headroom dalam sesi Codex yang baru, pastikan Codex sudah memuat ulang konfigurasi MCP. Jika integrasi tidak terlihat, jangan mengklaimnya aktif.
- Jika MCP `headroom` tersedia tetapi proxy lokal belum aktif, jalankan proxy lokal hanya pada loopback Windows:

  ```powershell
  $env:HEADROOM_BEACON = 'off'
  $headroom = (Get-Command headroom -ErrorAction Stop).Source
  Start-Process -FilePath $headroom -ArgumentList @('proxy', '--host', '127.0.0.1', '--port', '8787', '--mode', 'cache', '--no-telemetry') -WindowStyle Hidden
  ```

- Gunakan `headroom_compress` untuk hasil alat/file yang panjang dan berulang bila akan mengurangi konteks. Baca kembali sumber atau gunakan `headroom_retrieve` sebelum memutuskan detail yang tidak boleh keliru, seperti saldo, migrasi, otorisasi, credential, isi PDF, atau perubahan destruktif.
- Jangan kirim credential/secret ke kompresi atau alat eksternal. Jangan aktifkan pencatatan isi prompt/respons. Beacon Headroom dinonaktifkan untuk proses yang dimulai dengan perintah di atas.
- Untuk sesi Codex CLI baru yang memang dijalankan melalui proxy, gunakan `headroom wrap codex` dari root project. Perintah ini membuka sesi Codex CLI baru; ia tidak membungkus sesi Codex UI/IDE yang sedang aktif.
- Jika proxy/MCP tidak tersedia, teruskan pekerjaan dengan skill proyek lain dan sebutkan keterbatasan Headroom secara ringkas.

## Batas proses inventory

- Jangan menghitung persetujuan sebagai barang keluar. Stok fisik berubah pada posting, reservasi terpisah dari saldo, dan semua mutasi tercatat pada ledger/audit dalam transaksi atomik.
- Consumable dihitung berdasarkan satuan; equipment, sensor, prototype, dan produk jadi yang beridentitas dikelola per unit. Jangan menghitung unit serialized sebagai saldo jumlah kedua kali.
- Aset yang kembali tidak menjadi tersedia sampai diterima dan diperiksa petugas. Kalibrasi yang lewat masa berlaku memblokir checkout.
- Satu transaksi pinjaman memakai satu `loan_id`, beberapa return event dan versi bukti. Simpan snapshot checkout; koreksi historis menjadi event beralasan, bukan edit tanpa jejak.
- Setiap aksi stok, approval, checkout/return, inspeksi, adjustment, ekspor bukti dan perubahan akses perlu server-side policy, validasi, audit, serta perlindungan retry/concurrency.
- Jangan meluncurkan data operasional sebelum backup/restore dan rekonsiliasi saldo pembukaan lulus.

## Keselarasan aplikasi dan workflow Codex

- Acuan read-only: D:\Aerasea\finance_app dan D:\Aerasea\Absensi. Adaptasi pola kecil yang sesuai; jangan mengubah aplikasi tersebut atau mengimpor data/secret tanpa scope eksplisit.
- Inventory tetap repository, database/user DB, cookie host-only, storage dan deployment terpisah. Tidak menggunakan mtc_session milik Absensi, shared password/session, join database aplikasi lain atau integrasi jurnal otomatis.
- PostgreSQL dipakai sejak dev dan CI; satu schema Prisma dan migration versioned. Migrasi rilis menjadi job tunggal, bukan efek samping import modul atau startup setiap replica.
- Server Actions/Route Handlers memanggil service server-only dengan validasi/policy objek. Mutasi stok, audit, idempotency dan outbox memakai transaction client yang sama. Uji concurrency melalui koneksi PostgreSQL terpisah.
- Gunakan Better Auth untuk autentikasi/MFA, pg-boss untuk job dengan outbox atomik dan handler idempotent; spike kompatibilitas sebelum fitur banyak. Worker Node/Chromium dibangun dan diuji terpisah dari output standalone web.
- Implementasi penuh dikerjakan Codex per batch reviewable; pemilik/gudang menetapkan kebijakan dan menerima UAT/data fisik. Setelah bootstrap, baca/perbarui STATUS_IMPLEMENTASI.md setiap sesi dengan ID backlog, keputusan terbuka, migration dan bukti tes. Jangan mengklaim gate lulus tanpa bukti.
- Estimasi lama 78 hari adalah baseline manual/bobot relatif, bukan durasi Codex. Ukur ulang setelah lima batch dan tiap gate; kalender pada dokumen adalah hipotesis, bukan komitmen.
