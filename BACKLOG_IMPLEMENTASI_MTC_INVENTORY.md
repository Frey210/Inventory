# Backlog Implementasi MTC Inventory

Tanggal: 18 Oktober 2026. Acuan: `RENCANA_IMPLEMENTASI_MTC_INVENTORY.md` dan dua DOCX sumber. Pelaksana implementasi: Codex; pemilik aplikasi tunggal dan petugas bisnis menerima hasil serta menetapkan kebijakan/UAT. Revisi stack: Next.js full-stack + Prisma + PostgreSQL; lihat EVALUASI_STACK_DAN_WORKFLOW_CODEX.md.

Kolom **Bobot** mempertahankan baseline kompleksitas estimasi manual terdahulu (total 78), bukan hari kerja Codex dan bukan estimasi durasi aktif. Alokasi batch dan hipotesis kalender ada pada evaluasi dan bagian 14 rencana. Ukur throughput lima batch pertama lalu tiap gate. Hari operator untuk opname/sign-off terpisah. Semua pekerjaan V1 tetap wajib sebelum rilis lengkap.

Kode tahap: **F** fondasi sebelum pilot; **P** alur pilot; **V1** pelengkap sebelum go-live penuh; **G** kesiapan produksi, sebagian dikerjakan sejak awal. Status semua pekerjaan: belum dimulai. “Dependensi” adalah minimum teknis; urutan dapat disesuaikan setelah spike tanpa melewati acceptance.

| ID | Tahap | Pekerjaan | Bobot | Dependensi | Kriteria selesai dan pengujian |
|---|---|---|---:|---|---|
| INV-01 | F | Finalisasi keputusan dan kamus status | 2 | — | D1–D8, role/approver, lokasi pilot, cutoff waktu, dan scope tercatat; keputusan terbuka memiliki owner |
| INV-02 | F | Spike Next/auth/MFA, worker/outbox, deploy, kamera, PDF dan PostgreSQL | 2 | INV-01 | Demo login uji melalui HTTPS; kamera nyata membaca QR; PDF multipage tercetak; transaksi/lock, rollback, crash/retry outbox, auth/MFA dan volume persisten bekerja; patch kompatibel dipin; limit LXC tercatat |
| INV-03 | F | Bootstrap Next.js/Prisma dan CI PostgreSQL | 2 | INV-02 | Lockfile, konfigurasi contoh tanpa secret, satu schema/migration PostgreSQL; lint, typecheck, unit/integrasi PostgreSQL, build web dan worker berhasil; pengecualian catatan rahasia di gitignore diverifikasi |
| INV-04 | F | Better Auth, akun, MFA dan policy objek | 2 | INV-03 | Registrasi publik mati, TOTP akun istimewa diwajibkan; recovery/revoke diuji; cookie host-only Inventory dan rate limit persisten, akun nonaktif tidak bisa masuk; teknisi tak dapat membaca data/file pengguna lain; UAT-10 |
| INV-05 | F | Halaman Master Data: lokasi, jenis, kategori/default, satuan, supplier dan proyek | 2 | INV-04 | Pusat setup `/admin/masters` sesuai MASTER_DATA_SPEC; kode unik, lokasi tanpa siklus, referensi aktif, tambah/edit/nonaktif dan audit; kategori menawarkan default jenis/satuan/lokasi; conflict/default tidak menimpa input diam-diam; filter/pagination dan policy server diuji |
| INV-06 | F | Katalog/foto SKU dan unit aset dari setup master | 2 | INV-05 | Editor SKU tunggal dari Master Data/Inventory; default kategori terisi dengan kendali pengguna, upload/fallback foto tervalidasi; penerimaan memilih SKU tanpa mengetik ulang metadata; quantity vs serialized jelas, tag/serial unik; perubahan default/foto tidak mengubah stock/snapshot; tidak double count |
| INV-07 | F | Ledger, saldo, reservasi dasar dan audit | 3 | INV-06 | Tabel/constraint dan action transaksi tersedia; rollback mempertahankan konsistensi ledger-balance-audit; role DB runtime dibatasi; audit/idempotency/outbox menggunakan transaction client yang sama |
| INV-08 | F | Impor dry run dan saldo pembukaan | 2 | INV-07 | Error per baris, batch ID antiulang, hasil rekonsiliasi; opening via transaksi; format legacy loan terdefinisi |
| INV-09 | P | Barang masuk quantity/serialized | 3 | INV-07 | Draft tidak mengubah stok; posting sekali menambah saldo/unit; supplier/lokasi/bukti tercatat; retry tidak menduplikasi |
| INV-10 | P | Request consumable dan alat | 3 | INV-04; INV-06 | Jenis request tidak bercampur, proyek dan tujuan wajib, due date alat valid; revisi material ditangani dan riwayat sendiri dibatasi |
| INV-11 | P | Approval, alokasi dan expiry reservasi | 2 | INV-07; INV-10 | Approver bukan pemohon; qty boleh dikurangi beralasan; expiry melepas sisa saja; dua approval tidak overbook |
| INV-12 | P | Issue consumable dan emergency override | 3 | INV-09; INV-11 | Batas approved diterapkan, stok keluar saat posting, bukti penerima dan alasan override wajib; UAT-01; UAT-02; UAT-08 |
| INV-13 | P | Sisa layak dan waste | 3 | INV-12 | Return terkait issue asli, jumlah kumulatif valid, pemeriksaan gudang sebelum tambah stok; waste tidak double decrement; UAT-04; UAT-05 |
| INV-14 | P | Checkout aset dan LOAN | 3 | INV-11 | Unit teralokasi, eligibility dan kalibrasi dicek ulang, penerima mengakui, satu loan ID, audit dan initial payload atomik; UAT-02; UAT-06; UAT-09 |
| INV-15 | P | QR label, scan kamera, USB/manual fallback | 2 | INV-06; INV-14 | Label nyata terbaca, scan ganda dicegah, input manual/USB bekerja, kamera dilepas saat keluar; scan tidak langsung posting |
| INV-16 | P | Return event parsial dan inspeksi | 3 | INV-14 | Pengajuan berbeda dari receipt fisik; custody/pending inspection benar; unit tak diterima dua kali; selesai setelah semua kewajiban tertangani; UAT-03; UAT-12; UAT-13 |
| INV-17 | P | Insiden dan catatan kalibrasi minimum | 2 | INV-06; INV-16 | Foto masalah, valid_until, blokir teknis, tiket tindak lanjut dan release berwenang; rusak tidak tersedia; UAT-06; UAT-14 |
| INV-18 | P | Nota terpadu, snapshot dan PDF worker | 3 | INV-14; INV-16 | Template A–G, payload beku, arsip awal/terbaru, checksum, versi unik, PDF retry tanpa checkout ulang; 1/30+ item dan banyak event terbaca; UAT-11; UAT-15 |
| INV-19 | P | Koreksi historis dan penutupan pengecualian | 3 | INV-16; INV-18 | Edit bukti diam-diam ditolak, koreksi event beralasan, approval loss/exception, snapshot baru tanpa return fiktif; UAT-16 |
| INV-20 | V1 | Transfer lokasi dan custody | 2 | INV-07; INV-14 | Asal-tujuan atomik, jumlah perusahaan tetap, unit punya satu custody/lokasi; mutasi ditolak saat lokasi dibekukan |
| INV-21 | V1 | Sesi stock opname dan hitung | 2 | INV-07; INV-20 | Freeze per lokasi, snapshot hitung, tugas penghitung, selisih dan alasan; sesi batal membuka freeze dengan audit |
| INV-22 | V1 | Review dan posting adjustment | 2 | INV-21 | Reviewer berwenang, adjustment sekali, ledger sesuai selisih, rekonsiliasi cocok dan freeze dibuka; UAT-07 |
| INV-23 | V1 | Maintenance/kalibrasi dan unit installed | 2 | INV-17; INV-20 | Metode/hasil/bukti/masa berlaku dan tindakan perbaikan tercatat; release valid; prototype/installed punya referensi proyek/pekerjaan tanpa kontrak komersial |
| INV-24 | V1 | Reminder, overdue dan notifikasi | 3 | INV-11; INV-16; INV-23 | In-app berfungsi; mail bila kanal siap; H-2/H-1 dan overdue sesuai kebijakan, kalibrasi H-30/14/7, dedup delivery dan retry; stok minimum edge trigger |
| INV-25 | V1 | Laporan, dashboard dan ekspor | 3 | INV-13; INV-22; INV-24 | Stok/lokasi, reservasi, loan, overdue, waste, proyek, opname, audit PDF/XLSX; hak ekspor diperiksa, satuan tidak dijumlahkan sembarang |
| INV-26 | G | Backup, restore dan monitoring dasar | 2 | INV-03; INV-07 | Backup DB+file di host/media lain, alarm gagal, restore lingkungan kosong berhasil; heartbeat worker/scheduler dan disk terpantau. Wajib sebelum pilot data riil |
| INV-27 | G | Hardening dan jalur rilis staging/produksi | 2 | INV-02; INV-04; INV-26 | Secret dipisah, deploy non-root, TLS/firewall/DB role/private storage, image bertag dan smoke; jalur deploy minimum siap sebelum pilot, hardening akhir diverifikasi ulang |
| INV-28 | G | Migrasi pilot dan pelatihan awal | 2 | INV-08; INV-13; INV-15; INV-17; INV-18; INV-19; INV-26; INV-27 | Master/saldo disetujui, legacy loan tanpa bukti fiktif, petugas terlatih, pilot gate lulus; jika belum siap gunakan simulasi |
| INV-29 | G | Pengujian concurrency dan fault recovery | 3 | INV-07; INV-19; INV-22; INV-24; INV-25 | Parallel DB connections, race approval/expiry/checkout/return, rollback, fail PDF dan job retry lulus; test inti dilakukan juga sebelum pilot |
| INV-30 | G | UAT lengkap dan perbaikan | 3 | INV-25; INV-28; INV-29 | UAT-01–16 dengan bukti, review gudang/QMS, tidak ada bug kritis/tinggi yang mengancam data/akses; temuan besar memakai cadangan atau estimasi ulang |
| INV-31 | G | Cutover V1 dan panduan operasi | 3 | INV-26; INV-27; INV-30 | Rekonsiliasi saldo/loan final, keputusan QMS, backup, SOP darurat, runbook deploy/restore, operator dan approver cadangan siap |
| INV-32 | G | Stabilisasi dan review 30 hari | 2 | INV-31 | Pantau pemakaian harian, cocokkan saldo, evaluasi overdue/inspeksi/jobs, prioritaskan temuan; bobot tindak lanjut tersebar selama observasi 30 hari, bukan durasi Codex dua hari |

## Cara menggunakan backlog

1. Awali dengan INV-01–04; jangan memulai seluruh modul sekaligus.
2. Pindahkan baris menjadi issue repository setelah rencana diadopsi. Simpan ID, acceptance, dependensi, dan bukti test dalam issue; saat ini belum ada issue yang dibuat.
3. Batas pekerjaan aktif satu irisan utama per batch Codex. Catat ID dan bukti di STATUS_IMPLEMENTASI.md; jangan memodifikasi aplikasi tetangga tanpa scope baru. Setiap perubahan menyertakan migration, policy, test aturan penting, serta demonstrasi alur.
4. Kerjakan INV-26–27 minimum lebih awal agar pilot tidak menunggu aspek operasional. INV-29 bukan alasan menunda seluruh test concurrency sampai akhir; tahap tersebut mengumpulkan regression lintas modul.
5. Setelah pilot, tuntaskan seluruh V1 dan gate sebelum menyebut aplikasi selesai. Data pilot riil harus tetap terbawa dan direkonsiliasi ke rilis penuh.
6. Ukur usaha aktual setelah fondasi dan satu siklus transaksi selesai. Perubahan scope, temuan integrasi/keamanan, waktu tunggu bisnis, data buruk, atau perubahan QMS mengubah anggaran batch/kalender; jangan mengasumsikan percepatan AI tetap.

## Pemetaan UAT sumber

| UAT | Pekerjaan utama | Bukti penerimaan |
|---|---|---|
| UAT-01 | INV-11; INV-12 | Request 5, approve 3, issue maksimum 3, saldo turun setelah serah terima |
| UAT-02 | INV-12; INV-14 | Checkout/issue tanpa approval ditolak; pengecualian hanya lewat permission override resmi |
| UAT-03 | INV-16; INV-17 | Unit rusak pending inspection lalu blocked, tidak tersedia |
| UAT-04 | INV-13 | Return sisa kabel layak 2 m menambah stok dan mengurangi pemakaian bersih |
| UAT-05 | INV-13 | Waste tampil pada proyek tanpa menambah stok atau mengurangi saldo dua kali |
| UAT-06 | INV-14; INV-17; INV-24 | Kalibrasi lewat masa berlaku memblokir checkout dan mengirim reminder |
| UAT-07 | INV-21; INV-22 | Selisih minus 2 baru mengubah saldo setelah review adjustment |
| UAT-08 | INV-12 | Override wajib alasan, aktor dan before/after tercatat |
| UAT-09 | INV-14; INV-29 | Satu unit tidak bisa dipinjam dua transaksi aktif |
| UAT-10 | INV-04; INV-25 | Teknisi hanya melihat riwayat sendiri; gudang/auditor sesuai scope |
| UAT-11 | INV-18 | PDF checkout berisi satu LOAN dan belum ada pengembalian; bukti awal diarsipkan |
| UAT-12 | INV-16 | Dua dari tiga unit kembali, event baru, outstanding satu, loan tetap sama |
| UAT-13 | INV-16 | Unit terakhir diverifikasi, loan selesai dengan riwayat lengkap |
| UAT-14 | INV-17; INV-18 | Foto/hasil inspeksi/tiket masalah tampil pada nota, unit blocked |
| UAT-15 | INV-18 | Versi awal dan versi terakhir bisa diunduh sesuai policy; cetak ulang tercatat |
| UAT-16 | INV-19 | Edit historis ditolak, koreksi terotorisasi menghasilkan event dan versi baru |

## Definition of done

Fitur selesai jika acceptance dan kasus gagal penting lulus, policy server diperiksa, transaksi tidak meninggalkan saldo setengah jadi, test relevan berjalan di CI, dan dokumentasi operator yang terdampak diperbarui. Untuk aksi stok/bukti, pemeriksaan UI saja tidak cukup. Semua UAT dan bukti nyata menggunakan data uji yang jelas sampai pilot data riil dinyatakan siap.

## Gate dan penerimaan batch Codex

- G0: INV-01-02; G1: INV-03-07; G2: INV-08-13; G3: INV-14-19; G4: minimum INV-26-28; G5: seluruh pelengkap V1 dan INV-29-32.
- INV-26-27 dimulai sejak fondasi; regression INV-29 dimulai pada transaksi pertama. Urutan angka bukan alasan menunda backup atau tes race.
- Setiap batch mencatat acceptance yang dibuktikan, perubahan schema/data, perintah dan hasil tes, batas verifikasi, serta langkah berikutnya. Lint/build saja tidak membuktikan saldo/otorisasi.
- Reuse pertama: pola Next standalone, komponen/form MTC, tes domain dan private evidence. Jangan menyalin session cookie Absensi, DB Finance, migrasi saat import modul, role dua tingkat, atau audit lewat client global untuk stok.
- Akses host, saldo fisik, approver, QMS dan UAT nyata tetap menjadi dependency bisnis. Data simulasi boleh digunakan untuk kemajuan implementasi sambil keputusan bisnis dicatat terbuka.
