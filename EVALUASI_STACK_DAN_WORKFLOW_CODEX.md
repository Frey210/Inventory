# Evaluasi stack dan workflow Codex — MTC Inventory

Tanggal: 18 Oktober 2026. Status: rekomendasi revisi berdasarkan pemeriksaan workspace lokal; belum merupakan hasil uji produksi.

## Keputusan

Gunakan **Next.js App Router + React + TypeScript strict + Tailwind CSS + Prisma ORM 7 + PostgreSQL**, dalam satu aplikasi full-stack. Pilihan Laravel/Livewire pada rencana awal digantikan karena konteks tambahan menunjukkan dua aplikasi internal sudah memakai ekosistem Node/React. Codex mengerjakan implementasi, tes, dokumentasi, dan persiapan rilis; pemilik aplikasi tetap menetapkan kebijakan bisnis, menyediakan akses yang diperlukan, serta menerima hasil UAT.

Alasan perubahan adalah biaya perawatan seluruh aplikasi perusahaan, bukan anggapan bahwa kode buatan AI tidak perlu dirawat. Next.js tidak mengharuskan backend API terpisah. Server Components untuk pembacaan, Server Actions untuk mutasi UI, dan Route Handlers untuk unduh/upload/health sudah cukup. Aturan stok ditempatkan dalam service server-only yang dapat dipakai worker dan UI.

## Bukti dari workspace

Versi berikut berasal dari manifest lokal, bukan klaim versi terbaru, audit dependency, atau bukti versi yang sedang berjalan di server.

| Area | Finance | Absensi | Implikasi untuk Inventory |
|---|---|---|---|
| Framework | `package.json`: Next 16.2.12, React 19.2.4, TypeScript, Tailwind 4 | `package.json`: Next 16.3.8, React 19.3.0, TypeScript, Tailwind 4.3.3 | Samakan keluarga stack; patch persis diverifikasi saat bootstrap |
| Database | `src/lib/db.ts`: `node:sqlite`, file `data/finance.db`, inisialisasi/perubahan data saat modul dimuat | `lib/db.ts`: Prisma + adapter SQLite/PostgreSQL; dua schema dan script persiapan PostgreSQL | Prisma dapat digunakan kembali sebagai pola; Inventory hanya PostgreSQL pada dev/CI/staging/prod |
| Auth | Handler transaksi yang diperiksa tidak memuat pemeriksaan session/policy; kontrol jaringan luar belum diverifikasi | `lib/auth.ts`: token acak, hash token di DB, cookie `mtc_session`, role ADMIN/EMPLOYEE, status aktif | Jangan menjadikan Finance baseline keamanan. Pelajari alur Absensi; jangan menyalin session/role menjadi shared auth |
| Audit | Tidak ditemukan lapisan audit khusus pada daftar source yang diperiksa | `lib/audit.ts` menulis lewat client DB global | Audit stok Inventory harus menerima transaction client agar ledger/saldo/audit rollback bersama |
| Job/PDF | ExcelJS; belum tampak worker durable pada konfigurasi yang diperiksa | Ekspor spreadsheet dan penyimpanan bukti; belum tampak worker durable pada konfigurasi yang diperiksa | Worker PDF/notifikasi perlu dibangun khusus, bukan disamakan dengan request web |
| Deploy | Node 24 Alpine, Next standalone, Compose volume `finance-data`, port host 3000 | Node 22 Debian slim, standalone, non-root, healthcheck, storage persisten, migrasi pada startup | Ambil pola standalone/non-root/health/volume; migrasi Inventory menjadi job rilis tunggal |
| Tes/CI | Script `lint` dan `build`; tidak ada script test pada manifest | `node --test`, tes domain, CI; konfigurasi CI yang diperiksa memakai SQLite | Gunakan tes domain ringkas; tambahkan integrasi PostgreSQL dan concurrency nyata |
| UI | Sidebar navy, Lucide, Geist, tabel transaksi | Token brand biru/slate/teal, Poppins/Roboto, form, navigasi HP, Phosphor | Keselarasan pada brand, navigasi, label, feedback, dan token; bukan menyalin seluruh CSS |

Source aplikasi dibaca secara selektif. Git status kedua repository bersih saat diperiksa. Graph Absensi tersedia tetapi query arsitektur tidak menghasilkan node cocok; keputusan didasarkan pada source aktual. Tidak membaca `.env`, database operasional, atau isi catatan kredensial. Tidak mengubah kedua aplikasi.

## Stack konkret

| Kebutuhan | Pilihan | Batas dan alasan |
|---|---|---|
| Runtime | Node.js 24 LTS, image Debian slim | Konsisten dengan keluarga runtime Finance; Debian memudahkan Chromium. Patch/digest ditetapkan dan diuji pada bootstrap |
| Web | Next.js 16 stable yang masih mendapat patch keamanan, React versi kompatibel | Versi lokal dua aplikasi berbeda; jangan menyalin `latest`, canary, atau versi manifest tanpa verifikasi registry/advisory |
| Bahasa/UI | TypeScript strict, Tailwind 4, komponen React lokal | Tidak perlu Redux, frontend terpisah, atau UI kit besar. Radix hanya untuk primitive kompleks yang sungguh dipakai dan perlu aksesibilitas |
| Data | PostgreSQL major yang masih didukung pada host; Prisma 7 + `@prisma/adapter-pg` + `pg` | `prisma` dan client dipin versi sama. Dev dan CI memakai PostgreSQL. Satu schema, migration SQL versioned, tanpa schema SQLite kedua |
| Validasi | Zod pada batas input server | TypeScript bukan validasi input runtime. Tetap gunakan constraint dan otorisasi objek pada DB/service |
| Login | Better Auth + Prisma adapter, akun internal, session DB; TOTP untuk akun istimewa | Tutup signup publik; provision akun hanya admin. Uji nonaktif/revoke session, MFA enforcement/recovery dan rate limit persisten. Jangan membuat engine auth baru untuk menyerupai Absensi |
| Otorisasi | Policy aplikasi untuk empat role dan scope objek | Plugin admin auth tidak menggantikan izin gudang/approval/auditor. Tidak boleh self-approve |
| Jobs | pg-boss pada PostgreSQL + satu worker Node | Retry/scheduling/failed jobs memakai library. Rekaman outbox dalam transaksi bisnis; dispatcher mengantrekan dengan ID unik; handler tetap idempotent |
| PDF | Template HTML cetak dari snapshot + Playwright Chromium pada worker | Renderer terpisah dari proses web; font/browser dipin, satu render bersamaan awal. Playwright yang sama dapat dipakai E2E |
| Spreadsheet | ExcelJS untuk XLSX; CSV untuk impor pembukaan pertama | Selaras Finance. Batasi jumlah/ukuran file dan cegah formula injection pada ekspor teks |
| Scan | `@zxing/browser`, QR label, USB/manual fallback | Kamera client-only, HTTPS; scan hanya memilih unit, tidak posting otomatis |
| Storage | Private persistent filesystem dan checksum | Akses melalui handler berpolicy; file tidak berada pada `public/`. Object storage ditunda sampai ada kebutuhan |
| Quality | `node:test` + `tsx`, ESLint, `tsc --noEmit`, Playwright E2E | Node runner untuk unit dan integrasi PostgreSQL; satu suite browser. Tidak perlu dua runner unit |
| Operasional | Docker Compose, reverse proxy HTTPS yang sudah tersedia, GitHub Actions | Image web standalone dan worker dengan dependensi browser; DB terpisah. Tidak menambah reverse proxy kedua sebelum memeriksa infrastruktur |

Pilihan paket baru tetap melewati spike kompatibilitas dan keamanan. Better Auth dan pg-boss dipilih untuk menghindari implementasi auth/MFA dan antrean retry sendiri. Jika spike gagal, catat penyebab dan revisi keputusan; jangan diam-diam mengganti desain.

## Keselarasan tanpa ketergantungan silang

1. **Repository dan deployment terpisah.** Inventory bukan modul yang disisipkan ke Finance/Absensi. Tidak perlu monorepo/Turborepo atau package bersama sekarang. Salin/adaptasi pola kecil dengan atribusi source internal dan tes sesuai kebutuhan; ekstraksi library baru dilakukan jika kebutuhan berulang sudah terbukti.
2. **Database dan role DB terpisah.** Boleh satu host PostgreSQL, tetapi database/user Inventory sendiri; tidak ada join atau FK ke database Absensi. Migrasi tidak pernah dijalankan menggunakan role Finance/Absensi.
3. **Cookie terisolasi.** Gunakan nama berprefiks Inventory, host-only, Secure/HttpOnly/SameSite; jangan berbagi `mtc_session`, domain cookie induk, token, atau tabel session. Logout dan penonaktifan Inventory harus jelas cakupannya.
4. **Identitas pegawai.** Tetapkan kode pegawai stabil, bukan nama/email sebagai primary key bisnis. Daftar kurang dari 20 orang dapat diimpor CSV terkontrol; simpan ID internal dan mapping `source_system/external_id` jika diperlukan. Absensi belum otomatis menjadi sumber HR resmi; pemilik proses menetapkannya. Hindari impor password/hash/session dan otomatis mencocokkan nama.
5. **Integrasi pertama berupa tautan aplikasi dan ekspor.** SSO/OIDC, API sinkronisasi pegawai, dan posting biaya ke Finance ditunda sampai manfaatnya jelas. Integrasi kelak memakai kontrak API berotorisasi, external reference unik, idempotency dan audit, bukan akses tabel langsung. Pengeluaran stok bukan otomatis jurnal biaya.
6. **UI satu keluarga MTC.** Pertahankan navy `#0B2E59`, biru `#1565C0`, hijau/teal `#00897B` dari rancangan Inventory. Pola tabel/sidebar Finance dan navigasi mobile Absensi menjadi referensi. Tidak mengganti warna wajib demi meniru seluruh Absensi. Gunakan satu keluarga ikon; usulan Lucide seperti Finance. Tipografi final dan kontras diverifikasi pada sesi frontend, bukan dianggap disetujui sekarang.
7. **Operasional konsisten.** Nama service/volume/secret dan port host berbeda. `3000` boleh sama di dalam container; mapping host tidak boleh bentrok. Petakan domain/routing, resource host, storage, dan prosedur backup ketiga aplikasi sebelum deploy. Tidak menyalin izin kamera/geolokasi atau batas body 50 MB dari Absensi tanpa kebutuhan.

## Aturan transaksi yang wajib tetap ada

Pergantian framework tidak mengurangi ketentuan ledger, reservasi, stok fisik, serialized unit, kalibrasi, inspeksi, satu LOAN, return parsial, snapshot dan koreksi historis pada rencana utama.

- Semua mutasi memverifikasi session aktif, permission dan scope objek di server; Server Action diperlakukan sebagai endpoint publik, bukan dilindungi hanya oleh layout.
- Route Handler mutasi ber-cookie memiliki pemeriksaan origin/CSRF yang sesuai; pembatasan trusted origin/proxy Server Actions diuji di hostname deployment. Halaman dan file privat tidak masuk shared cache lintas pengguna.
- Business service menggunakan satu Prisma transaction client untuk perubahan status, saldo/ledger, reservasi, audit, idempotency dan outbox. Helper tidak boleh diam-diam memakai client global.
- Lock baris melalui SQL berparameter dalam transaksi dengan urutan tetap; gunakan conditional update dan constraint untuk mencegah oversell/double checkout. Serializable digunakan pada operasi yang memerlukannya dengan retry terbatas terhadap konflik yang dikenali; jangan mengulang validation/permission error.
- Uji dua koneksi DB bersamaan, rollback paksa, key idempotency sama/payload berbeda, expiry versus checkout, dan dua return unit yang sama. Decimal database diserialisasi sebagai string di batas UI; jangan menghitung quantity pecahan lewat float JS.
- Outbox committed tidak hilang ketika proses mati setelah commit. Crash sebelum penandaan dispatch dapat mengantrekan ulang; unique event ID dan handler idempotent mencegah efek ganda. Jangan menganggap antrean memberi exactly-once untuk file/email.
- Job tidak merender URL bebas; browser tidak mendapat data/token produksi di log. PDF memakai snapshot beku dan storage key deterministik per versi. Download arsip harus mengecek policy dan diaudit.

## Workflow implementasi penuh oleh Codex

Setiap sesi mulai dengan `AGENTS.md`, rencana/backlog, lalu `STATUS_IMPLEMENTASI.md` setelah file tersebut dibuat pada bootstrap. Pilih satu ID backlog atau satu irisan kecil yang bisa selesai dan diuji. Laporan sesi mencantumkan file berubah, migration, perintah tes dan hasil, batas verifikasi, serta langkah berikutnya. Jangan menyatakan selesai karena halaman tampil.

| Gate | Output Codex | Penerimaan/bukti |
|---|---|---|
| G0 — keputusan dan spike | Matriks versi terpin; demo auth/MFA, transaksi PostgreSQL, worker/outbox, PDF multipage, scan HTTPS dan deploy uji | Pemilik menutup D1–D8 atau menandainya sebagai asumsi simulasi. Koneksi, constraint, crash/retry dan penggunaan resource terbukti |
| G1 — fondasi | Repository bersih, schema awal, migration, auth/policy, CI, master minimum | Lint/typecheck/unit/integrasi/build lulus; empat role diuji dari server; tidak ada secret dalam repo |
| G2 — consumable | Opening, penerimaan, request/approval/reservasi, issue, return/waste | Satu alur utuh dan concurrency/rollback lulus; laporan saldo cocok ledger |
| G3 — aset dan bukti | Checkout, QR/manual, kalibrasi, partial return, inspection, snapshot/PDF, koreksi | UAT terkait pinjaman dan cetak lulus; checkout berhasil walau renderer mati; retry tidak membuat loan baru |
| G4 — pilot riil | Restore, hardening minimum, migrasi opening/legacy loan, panduan operator | Data fisik direkonsiliasi dan operator menerima; jika belum, hanya simulasi |
| G5 — V1 dan stabilisasi | Transfer, opname/adjustment, maintenance/installed, reminder, laporan, UAT lengkap dan runbook | UAT-01–16, restore, resource, akses, format QMS dan cutover lulus; observasi 30 hari |

Codex dapat mengerjakan keputusan rutin, implementasi dan perbaikan secara mandiri. Keputusan yang bergantung pada fakta perusahaan tetap dicatat dengan owner: approver, tenggat reservasi, metode acknowledgement, status/retensi QMS, kondisi barang awal, perangkat scanner dan saldo fisik. Tidak perlu approval ulang untuk perubahan lokal yang sudah diotorisasi; rilis mengikuti gate dan kewenangan sesi yang berlaku.

## Estimasi yang dapat dipertanggungjawabkan

Angka 78 hari pada rencana awal adalah baseline manual, bukan durasi baru pengerjaan oleh Codex. Nilai baris backlog dipertahankan hanya sebagai bobot relatif agar dependensi dan risiko tidak hilang; jangan menjumlahkannya menjadi hari Codex atau mengklaim penghematan persentase yang belum diukur.

Hipotesis anggaran awal: G0 2–4 batch, G1 3–5, G2 5–8, G3 7–11, kesiapan pilot G4 3–5, pelengkap V1/G5 6–10; total **26–43 batch** sebelum observasi. Satu batch adalah satu irisan reviewable beserta tes, dapat memerlukan lebih dari satu sesi; ini anggaran perencanaan dengan ketidakpastian tinggi, bukan benchmark atau janji waktu. Tidak ada tanggal rilis yang sah sebelum G0 dan alur G2 pertama selesai.

Untuk contoh kalender saja, jika empat batch benar-benar diterima per minggu, anggaran tersebut berarti sekitar 7–11 minggu, lalu cadangan 25–35% menjadi sekitar **9–15 minggu menuju V1**, di luar observasi 30 hari. Pilot diperkirakan setelah G3/G4, bukan berdasarkan tanggal. Jika throughput dua batch per minggu, kalender mendekati dua kali lipat. Gudang/UAT/data dan akses host dapat menjadi jalur kritis walaupun kode selesai lebih cepat.

Ukur ulang setelah lima batch pertama dan setiap gate: throughput batch diterima, temuan ulang, waktu tunggu bisnis, biaya/token aktual, dan skenario acceptance tersisa. Anggaran = pemakaian Codex aktual + waktu review pemilik/operator + infrastruktur/perangkat, bukan 78 hari dikali biaya developer.

## Sumber teknis dan batas pemeriksaan

- [Next.js data security](https://nextjs.org/docs/app/guides/data-security): Server Actions adalah endpoint mutasi dan perlu otorisasi sendiri.
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting): Node/Docker, reverse proxy dan kebutuhan deployment.
- [Jadwal rilis Node.js](https://nodejs.org/en/about/previous-releases): Node 24 berstatus LTS saat pemeriksaan; patch tetap diverifikasi pada bootstrap.
- [Prisma ORM 7 transactions](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions): transaksi, isolation dan retry konflik; jangan mengambil contoh API major berikutnya.
- [Better Auth Prisma](https://www.better-auth.com/docs/adapters/prisma), [email/password](https://better-auth.com/docs/authentication/email-password), [TOTP/2FA](https://better-auth.com/docs/plugins/2fa).
- [pg-boss](https://pgboss.io/introduction): antrean berbasis PostgreSQL.

Dokumentasi resmi dan Context7 ditinjau untuk keputusan arsitektur; versi paket final dan advisory keamanan harus dicek lagi pada bootstrap. Server/SSH, domain nyata, resource tersisa, browser UI berjalan, seluruh test aplikasi lama, dan restore aktual belum diuji. DOCX diperiksa ulang secara tekstual untuk cakupan/warna/UAT; tata letak Word tidak dirender ulang. Tidak ada perubahan aplikasi, instalasi dependency proyek, integrasi live, atau deploy dalam revisi perencanaan ini.
