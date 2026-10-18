# Rencana Implementasi MTC Inventory

Tanggal penyusunan: 18 Oktober 2026  
Status: rekomendasi teknis dan rencana kerja untuk ditinjau pemilik proses  
Konteks terkonfirmasi: karyawan kurang dari 20 orang; pemilik/pemelihara aplikasi satu orang; implementasi direncanakan penuh melalui Codex.

## 1. Keputusan utama

Revisi setelah pemeriksaan Finance dan Absensi: bangun **Next.js App Router + React + TypeScript strict + Tailwind CSS + Prisma ORM 7 + PostgreSQL**, dalam satu aplikasi full-stack. Rekomendasi Laravel/Livewire sebelumnya digantikan. Kedua aplikasi internal telah memakai Next.js; keselarasan runtime, pola frontend, deployment dan debugging seluruh perusahaan lebih menguntungkan daripada menambah ekosistem PHP untuk Inventory.

Implementasi, tes, dokumentasi dan persiapan rilis dikerjakan Codex, dengan pemilik aplikasi sebagai penentu kebijakan bisnis dan penerima hasil. AI tidak menggantikan penghitungan fisik, keputusan approver/QMS, atau uji perangkat gudang. Inventory tetap repository, database, session, storage dan deployment terpisah dari Finance/Absensi.

Rincian bukti source, stack, reuse, integrasi dan workflow terdapat pada **`EVALUASI_STACK_DAN_WORKFLOW_CODEX.md`**. Rencana ini mempertahankan seluruh aturan domain dan UAT sumber. Anggaran awal 26-43 batch reviewable masih hipotesis; contoh kalender 9-15 minggu menuju V1 hanya berlaku bila empat batch diterima per minggu plus cadangan, di luar observasi 30 hari. Ukur ulang setelah lima batch dan setiap gate; angka lama 78 hari manual tidak digunakan sebagai estimasi Codex.

## 2. Dasar penilaian dan kondisi saat ini

Tiga berkas sumber awal berikut telah diperiksa; rencana ini kemudian direvisi setelah peninjauan workspace Finance dan Absensi:

| Sumber lokal | Temuan yang dipakai |
|---|---|
| `Rancangan_Terpadu_Sistem_Inventory_PT_MTC_Revisi_Nota_Terintegrasi.docx` | Kebutuhan bisnis, role, SOP, aturan stok, desain layar, UAT-01–16, dan Lampiran A revisi 1.1 tanggal 16 Oktober 2026 |
| `Template_Nota_Terintegrasi_Peminjaman_Pengembalian_MTC.docx` | Struktur nota, placeholder, satu nomor LOAN, return event, pemeriksaan, dan versi bukti |
| `repo&deploy.txt` | Referensi repository dan rencana pemisahan host Docker dengan host PostgreSQL; rahasia di dalamnya tidak disalin ke rencana |

Teks dokumen, tabel yang tercakup dalam ekstraksi, tiga diagram proses, dan dua mockup admin/teknisi telah ditinjau. Penilaian ini bukan pemeriksaan tata letak halaman Word atau sertifikasi kepatuhan QMS.

Pada pemeriksaan awal, repository `Frey210/Inventory` diperiksa melalui GitHub API: ukuran repository 0, belum ada bahasa pemrograman, dan endpoint isi menyatakan repository kosong. Dengan demikian belum ada kode aplikasi yang dapat diaudit atau stack lama yang perlu dipertahankan. Pemeriksaan server melalui SSH, versi PostgreSQL terpasang, resource host, firewall, backup, dan konfigurasi LXC belum dilakukan.

Pemeriksaan workspace tambahan: Finance memakai Next.js/React/TypeScript/Tailwind dan SQLite langsung; Absensi memakai keluarga UI yang sama dengan Prisma, jalur PostgreSQL, session DB, audit, tes domain dan Docker standalone. Temuan lokal belum membuktikan konfigurasi server produksi. Detail dan batas reuse dicatat pada dokumen evaluasi.

Rancangan bisnis sudah cukup kuat sebagai awal: consumable dan aset dipisahkan, approval mendahului checkout, pengembalian memerlukan pemeriksaan, dan nota memakai identitas tetap. Pekerjaan berikutnya adalah mengubah aturan tersebut menjadi transaksi database, status yang konsisten, kontrol akses, dan bukti pengujian.

Urutan acuan yang diusulkan: aturan tertulis terbaru pada Lampiran A untuk proses pinjam-kembali; bagian utama untuk modul lainnya; template sebagai struktur keluaran; mockup sebagai referensi tampilan. Bila ada konflik, catat keputusan pemilik proses. Status dokumen yang menyebut “final” pada bagian awal belum membuktikan bahwa addendum dan format QMS sudah disahkan.

## 3. Cakupan dan urutan rilis

### Pilot terbatas

Pilot ditujukan pada satu lokasi yang dipilih, satu petugas gudang, dan beberapa pengguna uji. Jumlah lokasi aktual belum diketahui. Pilot mencakup master, saldo pembukaan yang disetujui, barang masuk, request/approval, reservasi, pengeluaran consumable, sisa layak/waste, checkout aset, return parsial, pemeriksaan, QR, nota PDF berversi, audit, dan pencarian dasar. Sertakan data kalibrasi serta blokir saat checkout sejak pilot, karena ini kontrol keselamatan proses yang sudah diwajibkan rancangan.

Pilot bukan pernyataan bahwa V1 lengkap sudah selesai. Sebelum data riil digunakan, backup–restore, akses pengguna, rekonsiliasi saldo pembukaan, serta prosedur koreksi harus lulus. Jika opname berkala belum tersedia, saldo tidak boleh diedit manual: koreksi pembukaan dilakukan sebelum operasional atau lewat transaksi koreksi terkendali yang sudah diuji. Apabila tim tidak siap mengoperasikan pembatasan tersebut, jalankan pilot dengan data simulasi sampai modul opname siap.

### V1 lengkap

Seluruh cakupan versi pertama dokumen sumber tetap dipenuhi:

- Menu Master Data admin/gudang sebagai pusat setup lokasi bertingkat, jenis, kategori/default, satuan, katalog/foto barang, supplier dan proyek/cost center; SKU dan unit aset tetap memiliki identitas masing-masing. Akun/hak akses di menu Pengguna.
- Penerimaan, reservasi, pengeluaran, sisa consumable, waste, dan saldo per lokasi.
- Request dan approval dengan larangan persetujuan diri sendiri serta override beralasan.
- Checkout/check-in aset, return parsial, pemeriksaan, kehilangan/kerusakan, overdue.
- QR/barcode, pencarian manual, label cetak, dan nota terpadu dengan arsip versi awal/terbaru.
- Stock opname, review selisih, adjustment, serta transfer antarlokasi.
- Catatan kalibrasi, masa berlaku, tiket pemeriksaan/perbaikan dasar, dan pengingat.
- Pencatatan prototype dan unit Aquanotes perusahaan, termasuk status terpasang dan referensi pekerjaan.
- Dashboard, laporan PDF/Excel, notifikasi, audit, backup, panduan operator, dan UAT-01–16.

### Sesudah V1

Procurement penuh, BOM/work order produksi, valuasi FIFO/average, integrasi akuntansi, kontrak sewa/BAST komersial, portal pelanggan, mobile native, dan sinkronisasi transaksi offline masuk backlog terpisah. Modul maintenance V1 sebatas pencatatan tindakan, hasil, bukti, dan release unit; penjadwalan work order, biaya, suku cadang, serta SLA maintenance lengkap tetap tahap berikutnya.

## 4. Celah spesifikasi dan keputusan yang diperlukan

“Usulan” pada tabel berikut adalah default untuk dibahas, bukan kebijakan perusahaan yang sudah berlaku. Keputusan D1–D8 perlu ditutup sebelum transaksi pilot riil; D9–D12 sebelum V1 go-live.

| ID | Celah atau potensi konflik | Usulan implementasi dan pemilik keputusan |
|---|---|---|
| D1 | Menunggu Pemeriksaan muncul sebagai status unit dalam addendum, tetapi tidak pada daftar availability awal | Tambahkan `pending_inspection` pada availability unit. Pisahkan dari technical status. Gudang mengesahkan kamus status |
| D2 | Request disetujui tetapi tidak diambil dapat menahan stok selamanya | Simpan `pickup_deadline_at`; usulan batas akhir hari kebutuhan dengan perpanjangan beralasan. Batalkan/expire hanya sisa reservasi, bukan barang yang sudah keluar. Gudang menentukan tenggat |
| D3 | Approval berdasarkan jenis/jumlah belum menentukan unit mana | Untuk V1, alokasikan unit konkret saat approval meskipun pemohon memilih SKU. Substitusi unit setara memerlukan validasi ulang dan catatan petugas |
| D4 | Pengeluaran langsung admin berpotensi melewati kontrol | Admin hanya bisa menjalankan emergency issue jika diberi permission terpisah, alasan dan penerima wajib; transaksi tetap masuk ledger/audit dan daftar review. Larangan self-approval tetap berlaku pada request normal. Manajemen menentukan reviewer override |
| D5 | Unit kembali rusak sudah berada di gudang tetapi belum layak pakai | Bedakan outstanding fisik dan outstanding pemeriksaan. Loan dapat selesai setelah seluruh unit diterima dan diperiksa, sementara unit rusak tetap blocked dan tiket tindak lanjut tetap terbuka |
| D6 | Barang hilang tidak pernah bisa dikembalikan | Tutup melalui `closed_with_exception` hanya dengan keputusan pejabat berwenang dan bukti insiden. Jangan membuat return fiktif atau menandainya tersedia |
| D7 | Waste dapat dihitung dua kali bila dikurangi lagi setelah pengeluaran | Waste pascapengeluaran adalah klasifikasi pemakaian proyek, tidak mengurangi stok gudang lagi. Waste yang terjadi di gudang memakai transaksi kehilangan/penyesuaian tersendiri dengan review |
| D8 | Tanda tangan, kode resmi, dan retensi belum ditetapkan | Pilot memakai acknowledgement akun dan timestamp hanya jika disetujui pemilik proses. QMS menetapkan kode/revisi/retensi dan kebutuhan tanda tangan; acknowledgement tidak diklaim sebagai tanda tangan tersertifikasi |
| D9 | Mutasi antarlokasi belum dijabarkan | V1 memakai transfer atomik untuk perpindahan internal yang langsung diterima; perpindahan dengan transit memerlukan alur dispatch/receive tersendiri bila memang dipakai |
| D10 | Request ditambah jumlahnya, diganti itemnya, atau tanggalnya diubah sesudah approval | Perubahan material membuat revisi dan approval ulang; approval lama tetap tersimpan. Perubahan jumlah ke bawah saat approval memakai alasan dan notifikasi |
| D11 | Stok opname bersamaan dengan transaksi membuat selisih semu | Gunakan pembekuan mutasi per lokasi selama hitung/review singkat, lalu buka setelah posting atau pembatalan sesi. Tentukan durasi dan jadwal dengan gudang |
| D12 | Rumus akurasi menjumlahkan pcs, meter, dan satuan lain | Laporkan selisih per SKU+satuan dan persentase baris cocok. Rasio kuantitas hanya untuk kelompok satuan yang sama; nilai denominator nol menjadi N/A, bukan dibagi nol |

Keputusan tambahan: timezone operasional diusulkan `Asia/Makassar` bila mengikuti operasi Celebes/WITA; konfirmasikan lokasi kerja. Penyimpanan waktu memakai UTC dan tampilan memakai timezone perusahaan. Jam jatuh tempo, pergantian bulan penomoran, dan pengingat mengikuti timezone yang telah disepakati.

## 5. Tech stack yang direkomendasikan

| Lapisan | Pilihan | Pertimbangan |
|---|---|---|
| Runtime | Node.js 24 LTS, Debian slim | Satu ekosistem dengan aplikasi internal; dependency Chromium dipisahkan ke image worker |
| Web | Next.js 16 stable yang didukung, React kompatibel, TypeScript strict | Server Components untuk baca; Server Actions tipis untuk mutasi; Route Handlers untuk file/health/integrasi |
| UI | Tailwind 4, komponen React lokal, Lucide | Adaptasi pola MTC yang berguna; primitive aksesibel ditambahkan hanya bila perlu |
| Database | PostgreSQL major yang masih didukung; Prisma ORM 7, adapter-pg dan pg | Satu schema PostgreSQL di dev/CI/staging/prod; raw SQL berparameter untuk constraint/lock yang diperlukan |
| Login | Better Auth + Prisma adapter, akun internal dan session DB | Signup publik ditutup, admin provision akun, pencabutan sesi, rate limit persisten, TOTP untuk akun istimewa |
| Policy/validasi | Policy server-only per aksi/objek; Zod | Role autentikasi bukan pengganti kewenangan gudang/approval; input runtime tetap divalidasi |
| Jobs | pg-boss, outbox transaksi bisnis, satu worker Node | Retry/scheduler tanpa Redis; handler idempotent, monitoring failed jobs/heartbeat |
| Storage | Private filesystem pada persistent volume | Foto/sertifikat/PDF tidak publik; download berpolicy dan audit |
| PDF | HTML cetak dari snapshot + Playwright Chromium pada worker | Bukan rendering URL bebas; versi bukti immutable, render dibatasi satu bersamaan awal |
| Spreadsheet | ExcelJS untuk XLSX, CSV standar untuk impor pertama | Selaras Finance; limit resource, formula injection dicegah |
| Scan | @zxing/browser, USB keyboard/manual fallback | Kamera client-only dan HTTPS; scan tidak otomatis posting |
| Quality | node:test + tsx, ESLint, tsc, integrasi PostgreSQL, Playwright E2E | Satu runner unit/integrasi dan satu suite browser; test concurrency tidak memakai SQLite |
| Deploy/operasi | Docker Compose standalone, reverse proxy HTTPS yang tersedia, GitHub Actions | Image bertag, non-root, migration job tunggal, volume privat, backup dan healthcheck |

Pin versi tepat dan lockfile pada bootstrap setelah mengecek kompatibilitas, advisory dan build. Versi pada manifest Finance/Absensi adalah bukti kondisi lokal, bukan target patch otomatis. Jangan memakai latest/canary pada konfigurasi produksi. Prisma CLI/client dipin versi sama; contoh API wajib sesuai major 7. Major PostgreSQL mengikuti [kebijakan dukungan resmi](https://www.postgresql.org/support/versioning/); tidak memaksa upgrade host tanpa pemeriksaan.

[Next.js mendukung self-hosting Node/Docker](https://nextjs.org/docs/app/guides/self-hosting). Server Actions tetap memerlukan autentikasi/otorisasi seperti endpoint publik sesuai [data security](https://nextjs.org/docs/app/guides/data-security). [Better Auth](https://better-auth.com/docs/plugins/2fa) menyediakan mekanisme 2FA; enforcement role dan recovery tetap harus diuji. [pg-boss](https://pgboss.io/introduction) menyediakan antrean PostgreSQL; konsistensi enqueue dengan transaksi bisnis ditangani melalui outbox, bukan diasumsikan otomatis.

### Alternatif yang dipertimbangkan

| Opsi | Keputusan untuk konteks baru |
|---|---|
| Next.js full-stack + PostgreSQL | Pilihan utama: selaras kedua aplikasi, satu bahasa, tanpa backend terpisah |
| Laravel + Livewire | Layak secara teknis untuk form/transaksi, tetapi menambah runtime dan pola perawatan yang belum dipakai dua aplikasi ini |
| Next.js + NestJS/backend terpisah | Ditunda: belum ada konsumen API/kompleksitas yang membenarkan service kedua |
| Menggabungkan ke Finance/Absensi | Ditunda: akses, domain data dan rilis menjadi saling tergantung |
| ERP siap pakai | Evaluasi ulang jika procurement/akuntansi lengkap menjadi kebutuhan; fit-gap belum dilakukan |

Tidak diperlukan sekarang: microservices, Kubernetes, Redis, Kafka, GraphQL, event sourcing seluruh aplikasi, monorepo, shared DB/session, sinkronisasi stok offline dan SSO lintas aplikasi. Integrasi awal berupa tautan dan ekspor terkontrol. Tidak menyalin auth custom atau script migrasi dual SQLite/PostgreSQL dari aplikasi lama tanpa alasan.

## 6. Arsitektur aplikasi

```text
Browser admin/gudang/teknisi/auditor
  -> HTTPS reverse proxy
  -> Next.js: Server Components / Server Actions / Route Handlers
  -> session + validasi + policy objek
  -> service bisnis server-only
  -> transaksi PostgreSQL: ledger, saldo, reservasi, loan, audit, outbox

Outbox dispatcher -> pg-boss -> worker Node: PDF, ekspor, notifikasi
Scheduler worker -> reminder/expiry/rekonsiliasi; backup oleh job operasi
Private volume -> foto, sertifikat, snapshot/PDF -> backup off-host
```

```text
src/app/                    route, halaman dan action tipis
src/components/             form, tabel, status dan navigasi MTC
src/server/auth/            Better Auth dan pembacaan session
src/server/policies/        izin aksi, ownership dan scope
src/server/inventory/       receipt, issue, ledger, transfer, adjustment
src/server/requests/        submit, approval, reservation, expiry
src/server/loans/           checkout, return, inspection, correction
src/server/assets/          calibration, incidents, maintenance
src/server/documents/       snapshot, template cetak dan private download
src/server/jobs/            outbox dispatcher dan handler idempotent
src/worker/                 entry point worker dan scheduler
prisma/                     satu schema PostgreSQL + migration SQL
tests/                     unit, integrasi PostgreSQL, concurrency, E2E
```

Service menerima transaction client eksplisit; helper audit/ledger/outbox tidak menggunakan client global di tengah transaksi. Jangan menempatkan aturan stok di React state, cache browser, template, atau handler rute saja. Action dan worker memakai service yang sama. Hindari repository generik/framework plugin internal.

Web menggunakan Node runtime, bukan Edge. Query saldo/session sensitif tidak memakai cache lintas pengguna; invalidasi/polling hanya memperbarui tampilan, validasi akhir tetap di transaksi. Kebijakan caching mengikuti versi Next yang dikunci. Image standalone web tidak otomatis membawa entry point worker: build/bundle dan dependency worker harus diuji terpisah.

## 7. Model data yang perlu dibangun

Gunakan PK internal yang stabil dan nomor dokumen bisnis terpisah. FK dan unique constraint dipasang pada database. Master yang sudah direferensikan transaksi hanya dinonaktifkan, bukan dihapus sehingga riwayat terputus.

Master Data harus disiapkan sebelum penambahan inventory agar petugas tidak mengetik ulang atribut. Kontrak lengkap pada `docs/design/MASTER_DATA_SPEC.md`: kategori menawarkan default jenis/satuan/lokasi/foto ilustrasi untuk SKU baru; penerimaan memilih SKU dengan metadata/foto yang sudah tersedia, lalu mengisi jumlah atau identitas unit dan data transaksi. Master/SKU tidak menyimpan saldo yang dapat diedit. Perubahan default tidak memindahkan stok atau mengubah SKU/snapshot historis secara otomatis.

| Kelompok | Tabel dan isi pokok |
|---|---|
| Identitas | `users` (role, unit kerja, aktif), `projects`, `suppliers`; penugasan approver bila dibutuhkan |
| Katalog | `items` (SKU, jenis bisnis, tracking mode quantity/serialized, base unit, minimum stock, foto utama), `item_types` (kode bisnis stabil dan default tracking), `categories` (default jenis/satuan/lokasi/foto ilustrasi opsional), `units_of_measure`, `locations` (parent, tipe, kode); foto merujuk attachments privat |
| Aset | `asset_units` (item, asset tag unik, serial opsional, kondisi, availability, technical status, lokasi fisik, custodian, kalibrasi); `asset_movements` untuk perpindahan/custody |
| Stok jumlah | `inventory_transactions`, `inventory_transaction_lines`, `stock_ledger`, `stock_balances` per item+lokasi+stock bucket |
| Request | `requests`, `request_lines`, `approval_decisions`, `reservations` (alokasi qty/unit, sisa, expiry, status) |
| Pinjaman | `loans`, `loan_lines` (satu baris per unit serialized), `handovers`, `return_events`, `return_lines`, `inspections` |
| Bukti | `document_snapshots` (loan, stage, versi unik, payload beku, checksum, template revision, lokasi PDF), `attachments` (owner, storage key, hash, mime, ukuran) |
| Kontrol | `stocktake_sessions`, `stocktake_lines`, `calibrations`, `incidents`, `maintenance_records` |
| Teknis | `audit_logs`, `document_sequences`, `idempotency_keys`, `notification_deliveries`, tabel auth/session Better Auth, outbox dan schema antrean pg-boss |

Untuk barang quantity, bucket membedakan `usable` dengan `quarantine`. `on_hand` adalah jumlah fisik pada bucket, bukan otomatis jumlah tersedia. `reserved` hanya boleh mengacu usable. `available = usable_on_hand - active_reserved`. Barang sisa yang baru diajukan belum menjadi penerimaan stok; petugas menerima fisik serta kelayakannya terlebih dahulu. Jika perlu ditahan, masukkan quarantine melalui penerimaan yang jelas.

`stock_ledger` menyimpan perubahan kuantitas fisik yang sudah posted. Reservasi tersimpan terpisah, sehingga approval tidak dianggap barang keluar. `stock_balances` adalah ringkasan yang diperbarui dalam transaksi yang sama dan dapat direkonsiliasi terhadap ledger/reservasi. Serialized asset tidak ikut dijumlahkan dalam ledger consumable; kuantitas aset diturunkan dari unit, custody, lokasi, dan status.

Kategori bisnis dan tracking mode dipisahkan: prototype, sensor, serta produk jadi dapat berupa unit serialized, sedangkan consumable berbasis quantity. Satu aset tidak dicatat sekaligus sebagai saldo quantity dan unit aktif. Tracking mode item yang sudah bertransaksi tidak boleh diganti langsung.

Constraint minimum:

- SKU, kode lokasi, asset tag, dan nomor dokumen unik; serial diisi hanya jika ada, dengan kebijakan keunikan dinormalisasi sebelum impor. Untuk baseline sumber, serial terisi dibuat unik.
- Kuantitas memakai `numeric(18,4)` atau presisi yang disepakati, tidak memakai floating point. Unit pcs/buah hanya menerima bilangan bulat; meter/liter dapat pecahan.
- `usable_on_hand >= 0`, `reserved >= 0`, dan `reserved <= usable_on_hand`. Saldo quarantine tidak boleh negatif.
- Satu active allocation/custody per unit, melalui unique index bersyarat atau tabel occupancy tunggal dengan `unit_id` unik; perubahan status dan alokasi harus atomik.
- Satu return line serialized bernilai satu unit; jumlah return fisik kumulatif per loan line tidak boleh melebihi checkout. Validasi agregat dilakukan dengan lock atas loan line, bukan hanya CHECK per baris.
- Nomor LOAN/REQ/IN/OUT memakai sequence aman per jenis+periode; tidak menggunakan `MAX(number)+1`. Nomor boleh memiliki gap; jangan mengorbankan integritas demi nomor tanpa celah.
- Indeks untuk status request, pemohon, item+lokasi, unit+riwayat, due date loan aktif, valid_until kalibrasi, serta timestamp audit. Optimalkan berdasarkan query nyata.

Untuk V1 pakai satu satuan dasar per SKU. Pembelian per box dikonversi secara eksplisit sebelum posting; konversi satuan dinamis dan lot/expiry hanya ditambahkan jika data operasional membuktikan kebutuhan. Isi lot/batch bila memang wajib untuk bahan tertentu ditentukan pada tahap finalisasi master.

## 8. Aturan transaksi dan konsistensi

Setiap aksi penting harus: autentikasi dan policy server-side, validasi input, mulai transaksi database, lock baris yang relevan dalam urutan konsisten, cek ulang kondisi terbaru, simpan perubahan beserta audit, lalu commit. Notifikasi/rendering tidak boleh menahan lock database. PostgreSQL menyediakan [row-level locking](https://www.postgresql.org/docs/current/explicit-locking.html). Gunakan SQL berparameter melalui transaction client Prisma untuk SELECT FOR UPDATE; cek conditional update dan constraint. [Transaksi Prisma 7](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions) mendukung isolation; retry terbatas hanya untuk konflik/deadlock yang dikenali. Uji koneksi terpisah, bukan Promise.all dalam satu transaksi.

| Aksi | Perubahan atomik |
|---|---|
| Posting penerimaan | Dokumen menjadi posted; ledger bertambah; balance bertambah. Aset serialized dibuat per unit dan movement penerimaannya dicatat |
| Approval | Kunci request dan saldo/unit, cek approver bukan pemohon, simpan keputusan dan reservasi. Fisik belum berkurang |
| Issue consumable | Kunci reservasi dan saldo, cek sisa approved, kurangi usable on_hand dan reserved sesuai qty, tulis ledger dan bukti serah terima |
| Checkout aset | Validasi unit, expiry approval, kondisi, dan kalibrasi saat itu; ubah custody/status, konsumsi reservasi, buat LOAN dan payload bukti awal |
| Batalkan/expire request | Lepaskan sisa reservasi. Tidak membatalkan barang yang sudah diposting keluar |
| Terima sisa consumable | Referensikan issue asal, periksa kumulatif sisa, terima layak, tambah ledger/balance. Pemakaian proyek berkurang sebesar sisa yang diterima |
| Catat waste pascaissue | Tambah klasifikasi waste pada penggunaan terkait; tidak mengurangi on_hand kedua kali |
| Receive return aset | Setelah fisik diterima petugas, pindah custody ke gudang dan availability ke pending_inspection; outstanding fisik turun, outstanding inspeksi masih terbuka |
| Finalisasi inspeksi | Catat hasil; unit menjadi available jika lulus seluruh syarat, atau blocked dengan tiket. Tutup loan hanya bila tidak ada kewajiban fisik/inspeksi yang belum ditangani |
| Transfer internal | Minus lokasi asal dan plus lokasi tujuan pada transaksi yang sama; total perusahaan tetap |
| Posting adjustment | Pastikan sesi reviewed dan lokasi dibekukan, tulis selisih sekali ke ledger/balance, simpan otorisasi, buka pembekuan |

Gunakan idempotency key unik per aksi posting/checkout/return untuk menahan double click, scan berulang, dan retry jaringan. Simpan hash payload dan hasil: key sama dengan payload sama mengembalikan hasil awal; payload berbeda ditolak. Jika gagal sebelum commit, seluruh perubahan ikut rollback. Deadlock ditangani dengan retry terbatas dan lock berurutan.

Pekerjaan dokumen/notifikasi dicatat sebagai outbox pada transaksi Prisma yang sama dengan perubahan bisnis. Dispatcher mengirim event committed ke pg-boss; unique event ID dan handler idempotent menjaga retry saat crash sebelum/sesudah dispatch. Crash setelah commit tetapi sebelum enqueue harus pulih. Pembuatan file memakai key unik per snapshot/version dan publikasi atomik; job notifikasi memiliki dedup delivery. Jangan menganggap antrean menjamin exactly-once untuk efek eksternal. Tidak menjalankan PDF/email dalam transaksi stok.

Saldo yang muncul di layar boleh memakai polling ringan, misalnya interval 30–60 detik untuk daftar yang membutuhkan. Nilai pada layar tidak menjadi dasar final posting; server selalu menghitung ulang di dalam lock. Dashboard tidak memerlukan WebSocket untuk skala ini.

## 9. Status pinjaman dan unit

Request: `draft -> submitted -> approved / rejected / cancelled / expired`. Setelah approved, status pemenuhan dihitung terpisah: unfulfilled, partially_fulfilled, fulfilled. Dengan demikian persetujuan tidak tertukar dengan serah terima.

Saat checkout pertama terbentuk satu LOAN. V1 mengusulkan satu checkout atomik per loan; jika penyerahan bertahap memang diperlukan, definisikan handover event tambahan dalam loan yang sama sebelum coding. Pengembalian parsial tetap wajib sejak pilot.

Availability unit: `available -> reserved -> borrowed -> pending_inspection -> available / blocked`. Jalur unit perusahaan yang dipasang pada pelanggan adalah `reserved -> installed -> pending_inspection`; referensi kontrak/pekerjaan disimpan, pengelolaan kontrak tetap di luar modul. `blocked` hanya dibuka petugas berwenang setelah tindakan dan pemeriksaan tercatat.

Tiga dimensi dipertahankan: kondisi fisik (baru/baik/rusak ringan/rusak berat/hilang), technical status (normal/perlu pemeriksaan/perbaikan/perlu kalibrasi/kalibrasi berlaku), dan availability. Eligibility dihitung dari ketiganya ditambah tanggal kalibrasi serta occupancy. Status available di database saja tidak cukup untuk mengizinkan checkout.

State lifecycle loan: `active`, `completed`, atau `closed_with_exception`, dengan label progres dihitung dari baris dan pemeriksaan. “Dikembalikan Sebagian” dan “Menunggu Pemeriksaan” boleh tampil bersamaan sebagai indikator; UI tidak boleh menyembunyikan satu informasi karena hanya menyimpan satu label status. Overdue juga indikator waktu, bukan status yang menggantikan progres.

Contoh: pinjam tiga unit, dua diterima fisik, satu dari dua belum diperiksa. UI menampilkan “Dikembalikan Sebagian”, outstanding fisik 1, menunggu inspeksi 1. Setelah ketiga unit diterima dan diperiksa, loan dapat selesai meskipun satu unit blocked karena rusak. Loan selesai berarti kewajiban serah-terima ditangani, bukan semua aset layak dipakai.

Pengajuan return oleh peminjam belum mengubah custody. Petugas membedakan waktu pengajuan, penerimaan fisik, dan verifikasi. Ketika fisik sudah berada di gudang tetapi pemeriksaan belum selesai, overdue peminjam dihitung dari penerimaan fisik; keterlambatan pemeriksaan dicatat sebagai antrean gudang yang berbeda.

## 10. Nota terpadu dan arsip bukti

Implementasikan satu template cetak mengikuti bagian A–G pada template Word. PDF adalah keluaran wajib V1. Ekspor DOCX editable menjadi tambahan hanya jika QMS menegaskan bahwa itu diperlukan; jangan menganggap keberadaan placeholder DOCX otomatis mengharuskan engine ekspor Word.

Saat checkout, bekukan payload berisi identitas peminjam/unit kerja/proyek, item dan serial, kondisi/kelengkapan, nama petugas/penerima, waktu, approval, acknowledgement, dan revisi formulir. Payload ini dibuat dalam transaksi checkout, sehingga perubahan nama master kemudian tidak mengubah bukti lama.

Worker merender PDF dari payload snapshot tersebut, menyimpan SHA-256, storage key, versi, tahap, dan waktu pembuatan. Jika PDF gagal, checkout tetap sah dengan status dokumen pending/failed dan retry terkontrol; jangan meminta pengguna checkout ulang. Setelah return/inspeksi, buat versi baru dari gabungan snapshot awal dan event berikutnya. Nomor versi dialokasikan secara atomik. Cetak ulang versi lama mengunduh arsip lama, bukan merender dari master terkini.

Koreksi bukan edit diam-diam: simpan event koreksi yang merujuk rekaman sebelumnya beserta alasan, aktor berwenang, before/after, dan snapshot versi berikutnya. Retensi foto yang menjadi bukti mengikuti retensi dokumen; jangan menghapus lampiran yang masih dirujuk snapshot.

QR pada nota memuat identifier verifikasi internal. Pembaca wajib login dan lulus policy sebelum memperoleh isi dokumen. QR tidak memuat password, data pribadi lengkap, atau token akses permanen. Checksum membantu mendeteksi perubahan berkas; checksum bukan tanda tangan elektronik tersertifikasi.

Uji cetak dengan satu item, lebih dari 30 item, banyak return event, catatan panjang, dan halaman lanjutan. Header tabel, nomor halaman, nomor LOAN, versi, kondisi awal/akhir, serta watermark tahap harus terbaca; data yang belum ada ditampilkan “Belum ada pengembalian” atau “Belum diverifikasi”.

## 11. Layar dan pengalaman pengguna

Pertahankan nama **MTC Inventory**, navy untuk area kontrol dan hijau untuk aktivitas teknisi sesuai dokumen. Gunakan satu login dan navigasi berdasarkan izin; tidak perlu aplikasi frontend terpisah untuk tiap role.

| Pengguna | Layar prioritas |
|---|---|
| Gudang/admin | Dashboard tindakan, master dan saldo, barang masuk, antrean persetujuan, checkout, penerimaan fisik, inspeksi, detail loan/nota, opname, aset/kalibrasi, laporan, audit |
| Teknisi | Beranda tugas, cari barang, request consumable atau alat, request disetujui, konfirmasi penerimaan, pinjaman aktif, ajukan kembali, laporkan masalah, riwayat sendiri |
| Auditor/manajemen | Laporan, overdue, selisih, override, barang bermasalah, audit, dan arsip bukti sesuai policy baca-saja |

Master Data memiliki halaman khusus `/admin/masters`, terpisah secara navigasi dari daftar Inventory tetapi memakai katalog SKU yang sama. Urutan setup: lokasi, jenis, satuan, kategori/default, katalog dan foto, lalu penerimaan/opening. Master dapat ditambah/edit/dinonaktifkan sesuai izin dan audit. Jenis/tracking/status tidak menjadi aturan bebas yang bisa menghindari kontrol stok; upload foto mengikuti validasi server dan retensi referensi bukti.

Request equipment dan consumable tidak boleh dicampur. Form harus memperlihatkan satuan, approved qty, sisa reservasi, lokasi, rencana kembali, serta pesan kegagalan yang spesifik. Tindakan teknisi “Ambil Barang” adalah konfirmasi penerima; posting penyerahan dilakukan petugas gudang, kecuali kebijakan self-service disetujui secara terpisah.

Scan hanya memilih item/unit dan memvalidasi kecocokan. Scan tidak otomatis memposting serah terima. Tersedia fallback kode manual, debounce hasil scan, pencegahan scan unit ganda, dan pelepasan kamera saat pindah halaman. Gunakan library sesuai [kemampuan ZXing browser](https://github.com/zxing-js/browser). Kamera memerlukan secure context/HTTPS menurut [dokumentasi getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), sehingga akses melalui IP LAN HTTP biasa tidak cukup.

Gunakan desain responsif yang nyaman di HP dan tablet; tombol sentuh minimal sekitar 44 px, label terlihat, status disertai teks, fokus keyboard jelas, dan validasi di dekat field. Tabel admin boleh scroll horizontal; teknisi sebaiknya memakai daftar ringkas dengan aksi yang jelas. Jangan menyalin teks contoh dan brand InventorPro pada mockup menjadi data produksi.

Seluruh transaksi V1 memerlukan koneksi ke server. Saat koneksi putus, tampilkan hasil yang belum dapat dipastikan dan tombol cek status/retry idempotent; jangan menampilkan sukses palsu atau melakukan sinkronisasi stok offline tanpa desain khusus.

## 12. Deployment dan keamanan operasional

Catatan sumber menyebut LXC 101 sebagai host Docker aplikasi dan LXC 102 sebagai host PostgreSQL. Gunakan topologi ini sebagai asumsi awal; validasi kemampuan Docker, storage persisten, permission UID/GID, resource, serta rendering Chromium dalam LXC pada minggu pertama. Bila pembatasan kernel/sandbox membuat deployment tidak stabil, evaluasi host VM Docker tersendiri. Jangan menjadikan privileged mode, Docker socket mount, atau mematikan proteksi host sebagai solusi rutin.

Ukuran awal untuk diuji: host aplikasi sekitar 2 vCPU dan RAM 4 GB, PostgreSQL sekitar 2 vCPU dan RAM 2–4 GB, SSD dan kapasitas foto sesuai volume aktual. Ini usulan alokasi, bukan hasil pengukuran kapasitas server. Batasi satu job PDF bersamaan pada awal dan ukur peak RAM. Resource dari layanan perusahaan lain harus diperhitungkan.

Komponen Compose: `app` Next.js standalone, `worker` Node + Chromium (scheduler dan dispatcher awal berada pada worker), serta `migrate` sebagai job rilis satu kali. Pakai reverse proxy perusahaan yang tersedia setelah diverifikasi. PostgreSQL produksi tetap pada host terpisah; database/user/volume/session Inventory terisolasi dari Finance dan Absensi. Dev/CI/staging memakai PostgreSQL terpisah. Gunakan nama service/volume dan port host yang tidak berbenturan; tidak perlu menyamakan port publik 3000 Finance.

Jaringan dan akses:

- Aplikasi tersedia melalui HTTPS dengan hostname stabil. Pilih hostname LAN dengan sertifikat dipercaya perangkat, atau akses Tailscale dengan HTTPS yang sesuai. [Tailscale menyediakan mekanisme sertifikat HTTPS](https://tailscale.com/docs/how-to/set-up-https-certificates); pilihan konkret bergantung perangkat pengguna dan domain perusahaan.
- PostgreSQL hanya menerima koneksi host aplikasi dan administrator yang ditunjuk melalui firewall/pg_hba; tidak dibuka ke internet. Gunakan role aplikasi non-superuser dan role migrasi terpisah.
- Empat role bisnis awal cukup, dengan policy per objek. Teknisi tidak boleh membaca loan atau lampiran milik orang lain dengan mengganti ID URL. Hak role admin sistem tidak otomatis berarti approver bisnis.
- Cookie Secure/HttpOnly/SameSite, CSRF, rate limit login, password hash library autentikasi, pencabutan sesi saat pegawai nonaktif, dan MFA untuk akun istimewa sebelum go-live.
- Private upload dengan allowlist jenis/ukuran, pemeriksaan MIME, nama file buatan server, dan pembatasan dimensi foto. Tolak executable/HTML/SVG aktif; PDF/foto tidak boleh dirender sebagai HTML aplikasi.
- PDF worker hanya merender template dan data yang dikendalikan aplikasi; tidak mengambil URL arbitrer dari pengguna. Terapkan batas waktu, memori, akses jaringan yang diperlukan saja, dan sandbox yang sesuai.
- `NODE_ENV=production`, error internal tidak dikirim ke client, rahasia di environment/secret file dengan permission terbatas, `.env.example` tanpa nilai riil, dan log tidak menyimpan password/token.

**Temuan konkret:** `repo&deploy.txt` menyimpan kredensial infrastruktur berbentuk plaintext. Repository tujuan berstatus publik saat diperiksa. Sebelum commit pertama, pindahkan rahasia ke password manager/secret store, buat akun deploy non-root dengan SSH key, dan rotasi password yang tercantum. Jangan memasukkan catatan mentah ini ke repository. Periksa bahwa `.gitignore` mengecualikannya sebelum `git add`; bila rahasia pernah ter-push, menghapus file saja tidak cukup. Pemeriksaan histori kebocoran belum dilakukan karena repository saat ini kosong.

Audit bisnis ditulis atomik dengan transaksi dan tidak dapat diedit melalui UI. Gunakan role database aplikasi yang tidak memiliki UPDATE/DELETE untuk tabel audit/ledger/snapshot final sesuai kebutuhan. Pisahkan role migrasi. Administrator database tetap memiliki kemampuan tinggi; arsip immutable terhadap user aplikasi bukan berarti kebal terhadap administrator host. Backup di media lain dan checksum memperkuat ketertelusuran.

## 13. CI, rilis, dan pemulihan

Setiap perubahan melewati branch pendek/PR sebagai rekaman review mandiri. CI menjalankan instalasi dari lockfile, ESLint, tsc --noEmit, node:test lewat tsx, test transaksi dan policy pada service PostgreSQL, Playwright untuk alur kritis, build Next dan worker, lalu build image. Tambahkan dependency audit dan jangan memuat rahasia produksi pada test/build. Pengujian menggunakan PostgreSQL, karena SQLite tidak membuktikan perilaku lock dan constraint produksi.

Rilis dipicu setelah pipeline hijau: bangun image bertag commit, deploy staging, jalankan migrasi pada database staging, uji smoke dan PDF, lalu rilis produksi pada jendela yang disepakati. Untuk jaringan internal, host dapat menarik image registry melalui deploy account; tidak perlu membuka SSH produksi ke internet hanya untuk CI. Jangan memasang self-hosted CI runner umum berprivilege pada host produksi.

Urutan produksi: konfirmasi backup terbaru dan ruang disk; hentikan/selesaikan job yang perlu; aktifkan maintenance jika migrasi membutuhkan; jalankan migrasi kompatibel; ganti image; restart worker; jalankan health/smoke; buka aplikasi. Deploy aplikasi versi sebelumnya hanya aman jika schema masih kompatibel. Perubahan destructive memakai tahap expand–migrate–contract setelah verifikasi; restore database bukan tombol rollback harian karena dapat menghilangkan transaksi baru.

Backup dan recovery yang diusulkan untuk operasi awal:

| Objek | Jadwal awal dan kriteria |
|---|---|
| Database | Logical backup otomatis setiap 4 jam selama jam operasional serta backup harian; alarm jika gagal. Target RPO paling banyak 4 jam bergantung keberhasilan jadwal |
| Lampiran dan nota | Salinan incremental dengan frekuensi sepadan atau lebih rapat; manifest checksum menghubungkan berkas dengan snapshot database |
| Off-host | Salinan terenkripsi pada media/host lain; salinan di disk host yang sama tidak cukup menghadapi kehilangan host |
| Retensi backup | Usulan 14 harian, 8 mingguan, 12 bulanan; sesuaikan kapasitas dan kebijakan. Retensi backup berbeda dari retensi arsip QMS |
| Restore | Uji sebelum pilot riil dan bulanan: pulihkan database+file ke lingkungan kosong, cek saldo, login, loan, serta PDF lama. Target RTO awal 4–8 jam, harus dibuktikan |
| Rahasia pemulihan | Simpan app encryption key, akses storage, konfigurasi, dan panduan restore secara aman di luar host aplikasi |

RPO/RTO adalah target usulan pemilik proses, bukan jaminan teknis yang sudah tercapai. Jika kehilangan transaksi empat jam tidak dapat diterima, tingkatkan strategi ke WAL/PITR dan backup file yang sesuai sebelum produksi. Saat mengambil logical backup, cegah penghapusan file bukti; salin file sampai mencakup waktu snapshot database, dan lakukan verifikasi manifest saat restore.

Pemantauan minimum: health aplikasi/database, disk, usia backup terakhir, job gagal/umur job tertua, heartbeat scheduler, kegagalan PDF, login gagal berulang, serta mismatch rekonsiliasi. Notifikasi kegagalan dikirim ke developer melalui kanal yang disepakati. Siapkan petugas bisnis cadangan, bukan hanya akun developer sebagai satu-satunya jalan operasional.

## 14. Rencana pelaksanaan dengan Codex

Backlog rinci tetap memakai ID INV-01-32 agar pemetaan UAT tidak terputus. Kolom bobot adalah baseline kompleksitas dari estimasi manual awal, bukan durasi pengerjaan Codex. Rincian batch, bukti workspace dan cara mengukur estimasi terdapat pada `EVALUASI_STACK_DAN_WORKFLOW_CODEX.md`.

| Gate | Urutan dan hasil |
|---|---|
| G0 | INV-01-02: kebijakan pilot, verifikasi versi/runtime, spike auth/MFA, PostgreSQL/lock, outbox/job, PDF/kamera/HTTPS dan deploy uji |
| G1 | INV-03-07: Next/Prisma/CI, akun dan policy, master minimum, fondasi ledger/constraint/audit |
| G2 | INV-08-13: opening/dry run, receipt, request, approval, reservasi, issue, sisa/waste; satu alur utuh dengan test race/rollback |
| G3 | INV-14-19: checkout/LOAN, scan, return parsial/inspeksi, kalibrasi, PDF snapshot dan koreksi historis |
| G4 | INV-26-28 minimum sebelum data riil: backup-restore, hardening, rekonsiliasi pembukaan, pilot dan pelatihan |
| G5 | INV-20-25, INV-29-32 dan finalisasi INV-26-27: transfer/opname/maintenance/reminder/laporan, UAT lengkap, cutover dan observasi |

Cadangan awal 26-43 batch, dikalibrasi setelah lima batch dan tiap gate. Contoh kalender 9-15 minggu hanya hipotesis pada kapasitas empat batch diterima per minggu plus cadangan; bukan janji rilis atau hasil benchmark Codex. Observasi 30 hari setelah go-live tetap berjalan. Pilot mengikuti kelulusan G3/G4 dan kontrol minimum, bukan target minggu tertentu.

Setiap batch: baca instruksi/status, pilih satu irisan backlog, implementasikan migration/policy/service/UI terkait, tes sukses-gagal-concurrency yang relevan, jalankan pemeriksaan, lalu catat hasil dan langkah berikutnya. Perbarui STATUS_IMPLEMENTASI.md yang sudah disiapkan sejak bootstrap berisi commit terakhir, ID aktif, keputusan terbuka, migrasi, bukti tes dan gate. Status backlog tidak berubah menjadi selesai tanpa bukti. Codex tidak boleh melewatkan gate karena berhasil membuat seluruh halaman.

Pemilik aplikasi menerima demonstrasi dan menetapkan kebijakan/akses; gudang memiliki validasi fisik, master dan UAT; manajemen memiliki approver/override/exception; QMS memiliki format/revisi/retensi. Pekerjaan implementasi dan perbaikan dilakukan Codex. Review per gate dan irisan proses menghindari pembangunan semua layar sebelum aturan stok terbukti.

## 15. Migrasi data dan cutover

1. Siapkan template CSV master: kategori, satuan, lokasi, SKU, unit aset, pengguna, proyek. Kolom saldo awal diimpor melalui transaksi opening, bukan edit angka master.
2. Bersihkan duplikasi SKU/serial, pilih satuan dasar, tandai barang rusak/kalibrasi, tetapkan lokasi dan pemegang unit yang sedang di luar.
3. Impor dry run menampilkan error per baris dan tidak mengubah database. Impor aktual memakai batch ID, validasi, dan pencegahan impor ulang. Data bersih diposting berurutan sesuai FK.
4. Lakukan stock opname awal pada batas waktu cutover dan minta persetujuan pemilik data. Simpan sumber, penghitung, reviewer, dan bukti.
5. Barang yang sedang dipinjam sebelum sistem hidup dimigrasikan sebagai legacy opening loan dengan peminjam, unit, tanggal yang diketahui dan referensi bukti. Jangan mengarang approval, tanda tangan, atau tanggal yang tidak diketahui; catat keterbatasannya dan pengecualian migrasi.
6. Unit terpasang di pelanggan dimigrasikan sebagai installed dengan custody/lokasi dan referensi pekerjaan. Saldo gudang tidak memasukkan barang yang secara fisik berada di luar.
7. Cocokkan jumlah per SKU+lokasi, daftar unit, pinjaman aktif, dan total status dengan sumber. Uji label QR pada item nyata.
8. Saat cutover, hentikan mutasi lama sementara, muat selisih terakhir jika ada, verifikasi saldo dan backup, aktifkan pengguna pilot. Hindari dua sumber resmi yang berjalan bersamaan tanpa rekonsiliasi.
9. Jika terjadi gangguan, pakai formulir darurat bernomor dan catat satu kali setelah pulih dengan referensi yang sama. Rekonsiliasi semua transaksi darurat sebelum operasi normal ditutup hari itu.

## 16. Pengujian dan acceptance

UAT-01–16 dari rancangan sumber menjadi acceptance wajib, bukan sekadar contoh. Pemetaan pekerjaan berada di backlog. Simpan bukti aktor, data uji, hasil aktual, screenshot/PDF terkait, dan persetujuan pemilik proses di lokasi internal yang aman.

Tambahan pengujian teknis yang wajib:

| Skenario | Hasil yang harus dibuktikan |
|---|---|
| Dua approval meminta sisa qty/unit yang sama | Hanya alokasi yang cukup yang berhasil; tidak ada reserved melebihi usable |
| Dua checkout atau dua return serentak | Satu aksi sah per unit/per kuantitas; retry mengembalikan hasil awal |
| Request lolos approval lalu kalibrasi kedaluwarsa | Checkout tetap diblokir berdasarkan tanggal terkini |
| Cancel/expiry terjadi bersamaan dengan checkout | Hanya satu transisi konsisten; tidak ada stok keluar tanpa reservasi/otorisasi yang sah |
| Gagal di tengah posting ledger/balance/audit | Seluruh transaksi rollback; tidak ada saldo atau bukti setengah jadi |
| Sisa 2 m lalu waste dari issue yang sama | Total kembali+klasifikasi tidak melebihi issue; waste tidak mengurangi stok dua kali |
| Mengganti ID loan/file di URL atau Server Action/Route Handler | Akses pengguna lain ditolak server; UI tersembunyi saja tidak cukup |
| Opname bersamaan dengan transaksi | Mutasi di lokasi terkunci ditolak dengan pesan jelas; adjustment tidak bisa diposting dua kali |
| Update nama master setelah checkout | Snapshot awal dan PDF arsip tetap identik; versi baru tidak menimpa versi lama |
| Worker mati/PDF gagal/scheduler terlambat | Pekerjaan pulih melalui retry/pending, reminder tidak ganda, eligibility checkout tetap benar |
| Restore ke mesin/lingkungan kosong | Saldo, loan, file foto, arsip PDF dan kunci aplikasi dapat digunakan kembali |

Gunakan pengujian unit/integrasi untuk angka, transisi, policy, dan transaksi; browser untuk login, scan fallback, checkout, return, dan unduh nota. Kamera/USB scanner diuji manual pada perangkat gudang yang benar-benar dipakai. Uji concurrency harus memakai koneksi/proses PostgreSQL terpisah, bukan dua fungsi berurutan dalam satu transaksi test.

Target nonfungsional awal yang akan diukur: daftar/pencarian umum p95 di bawah 2 detik dan posting umum di bawah 2 detik pada 10 sesi aktif simulasi; PDF antrean normal selesai di bawah 30 detik untuk nota wajar. Gunakan data dummy sekurang-kurangnya beberapa ribu SKU dan puluhan ribu baris ledger bila volume aktual belum ada. Angka tersebut target uji, bukan hasil benchmark atau jaminan perangkat saat ini.

Gate V1 go-live: semua UAT sumber lulus, tidak ada bug kritis/tinggi terbuka yang mengancam saldo/akses/bukti, saldo awal ditandatangani pemilik proses, format QMS diputuskan, backup–restore lulus, operator terlatih, dan runbook tersedia. Pilot tidak boleh melewati kontrol stok, otorisasi, kalibrasi, inspeksi, atau bukti awal hanya untuk mengejar jadwal.

## 17. Biaya dan beban pemeliharaan

Karena server sudah direncanakan, komponen biaya utama adalah pemakaian Codex aktual, waktu review pemilik aplikasi, kebersihan data, dan waktu gudang untuk UAT. Tidak ada kewajiban langganan SaaS baru pada rancangan dasar. Tetap hitung listrik, kapasitas disk, media backup terpisah, SMTP bila diperlukan, domain/sertifikat bila berbayar, printer label dan scanner bila belum tersedia, serta lisensi komponen bila memilih versi berbayar.

Rumus anggaran revisi: `pemakaian Codex aktual + waktu review/UAT operator dan pemilik + perangkat/backup/layanan + cadangan`. Harga layanan, token dan perangkat belum diukur; jangan mengalikan 78 hari manual menjadi biaya Codex atau mengklaim faktor percepatan AI tanpa hasil aktual.

Alokasikan pemeliharaan rutin sekitar 0,5–1 hari per bulan sebagai titik awal, ditambah pekerjaan insiden dan upgrade major yang dijadwalkan terpisah. Tinjau failed jobs/backup mingguan, patch dependency secara teratur melalui staging, dan uji restore bulanan. Ukur kebutuhan aktual setelah 30 hari pemakaian.

## 18. Langkah kerja pertama

1. Gunakan evaluasi lintas aplikasi sebagai keputusan stack; cek ulang repository Inventory sebelum bootstrap, karena status kosong berasal dari pemeriksaan awal.
2. Tetapkan gudang pilot, approver cadangan, kebijakan D1-D8 dan sumber identitas pegawai; keputusan yang belum tersedia membatasi data ke simulasi.
3. Amankan/rotasi credential yang tersimpan lokal sebelum commit; jangan membaca atau menyalin catatan mentah ke prompt/repository.
4. Jalankan G0: pin versi aman/kompatibel Next/React/Prisma/Better Auth/pg-boss; uji transaksi PostgreSQL, login/MFA, worker/outbox, PDF, HTTPS kamera dan storage. Adaptasi pola Absensi/Finance secara selektif.
5. Bootstrap Next full-stack dan CI PostgreSQL, perbarui STATUS_IMPLEMENTASI.md, lalu satu alur receipt sampai approval/issue yang diuji. Ukur ulang anggaran setelah lima batch.

Revisi ini mengubah dokumen perencanaan dan instruksi proyek; belum membangun aplikasi, mengubah Finance/Absensi, repository remote, server, credential, atau DOCX sumber. Kapasitas host, domain, versi PostgreSQL, kebijakan QMS dan uji perangkat tetap perlu diverifikasi saat pelaksanaan.

