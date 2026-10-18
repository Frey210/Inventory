# MTC Inventory

Aplikasi web inventory internal PT Media Teknologi Celebes. Stack: Next.js App Router, React/TypeScript, Tailwind, Prisma/PostgreSQL, Better Auth, pg-boss dan worker Chromium. Baca AGENTS.md sebelum mengubah kode; paket desain ada di docs/design/README.md.

## Menjalankan development

1. Gunakan Node 24 dan PostgreSQL terisolasi. Salin `.env.example` menjadi `.env`; isi `INVENTORY_DATABASE_URL`, URL aplikasi dan secret baru. Nama koneksi sengaja berbeda dari DATABASE_URL aplikasi lain.
2. `npm ci`, `npx prisma generate`, `npm run db:migrate`.
3. Siapkan file JSON pengguna privat berisi username/name/role/password (minimal 16 karakter), set SEED_USERS_FILE ke file tersebut dan jalankan `npm run db:seed`. Script tidak mengganti password akun yang sudah ada. Jangan commit file akun. Tidak ada password produksi bawaan.
4. `npm run dev -- -p 3030`; inisialisasi antrean sekali melalui `node --env-file=.env scripts/init-queue.mjs`, lalu jalankan `npm run worker` terpisah. Install Chromium untuk worker melalui `npx playwright install chromium`.
5. Login pertama mewajibkan ganti password. Aktifkan MFA akun istimewa melalui Profil. Siapkan master sebelum katalog/penerimaan; tidak ada stok simulasi yang otomatis dimuat saat seeding produksi.

## Verifikasi

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Integration/E2E menolak URL yang tidak menunjuk database bernama inventory_test; gunakan database khusus tersebut, bukan database operasional. `node scripts/seed-test.mjs` menyediakan referensi minimum untuk CI. `npx playwright test` menjalankan login dan setup master serta merekam desktop/HP di direktori review yang tidak di-commit; tes mencakup pengaturan, MFA dan recovery. `npx tsx scripts/verify-print.ts` membuat fixture nota memakai renderer produksi.

Mode persiapan/pilot bukan izin memakai data operasional tanpa rekonsiliasi dan UAT. Periksa STATUS_IMPLEMENTASI.md untuk batas cakupan yang sudah diuji; jangan menganggap seluruh acceptance rencana lulus hanya karena build berhasil.

## Struktur implementasi

- `src/app/[[...path]]/page.tsx`: renderer halaman server, pemeriksaan role/ownership dan form tiap modul; URL tetap mengikuti UI_SPEC. Route file per layar dapat diekstrak nanti bila kebutuhan memerlukannya.
- `src/server/inventory.ts`: action bisnis bertransaksi, reservasi/ledger/audit/outbox dan retry. `capabilities.ts` murni agar worker tidak bergantung pada API request Next.
- `src/server/auth.ts` dan API auth: akun internal, session DB, rate limit persisten, username dan TOTP.
- `src/worker`: dispatcher outbox, antrean PDF, expiry reservasi, pengingat dan heartbeat.
- `prisma/migrations`: schema, constraint/FK serta proteksi append-only audit/ledger/event/snapshot.
- `public/logo.jpg`: logo yang disediakan pada workspace. Referensi collage DOCX tetap khusus development.

Deployment menggunakan `compose.yaml`; PostgreSQL produksi tetap pada LXC database sesuai keputusan pengguna. Credential dan account.md hanya lokal; tidak masuk Git/image. Lihat DEPLOYMENT.md untuk prosedur rilis dan pemulihan.
