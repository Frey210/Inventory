# Rencana perbaikan berdasarkan feedback tim inventory

Tanggal analisis: 24 Oktober 2026. Eksekusi diotorisasi pemilik 25 Oktober 2026, termasuk PWA. Status implementasi dan bukti rilis mengikuti STATUS_IMPLEMENTASI.md.

## Kesimpulan

Feedback pada `Perbaikan.docx` terutama menunjukkan form belum menyesuaikan aturan barang, tujuan menu tidak konsisten antarperangkat, serta operator masih mengulang input yang seharusnya dapat dibantu aplikasi. Perbaikan berfokus pada alur yang ada; tidak memerlukan penggantian stack atau redesign visual menyeluruh.

Prioritas awal adalah input angka sesuai satuan, menu Label QR yang dapat ditemukan, dan Edit Master Data yang langsung membuka form yang benar. Berikutnya: pencarian barang/lokasi, tanggal kembali tanpa jam, penerimaan banyak unit dengan tag otomatis, lalu label QR untuk barang berdasarkan jumlah.

Pertahankan biru/logo MTC, keterbacaan mobile, dan pemisahan persetujuan, penyerahan fisik, penerimaan kembali serta pemeriksaan. Mengurangi langkah input tidak boleh menghapus jejak transaksi atau pemeriksaan unit.

## Sumber dan batas bukti

- Seluruh teks feedback dan 10 gambar dalam `Perbaikan.docx` diperiksa. Referensi paragraf di bawah mengikuti urutan paragraf OOXML dokumen, termasuk paragraf kosong.
- Kode lokal diperiksa pada HEAD `8cd13a3`: shared shell, form, halaman catch-all, service inventory, tanggal bisnis, reminder, scanner, label QR, schema dan template nota.
- Acuan: `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `docs/design/REDESIGN_2026_10.md`, `docs/design/MASTER_DATA_SPEC.md` dan backlog awal.
- Ini analisis kebutuhan dan kode, bukan laporan reproduksi langsung pada server produksi. Screenshot tidak membuktikan semua dugaan akar masalah. Kasus dashboard dan fitur tidak bisa diklik masih memerlukan reproduksi.
- Data operasional telah berubah sejak impor awal. Jumlah stok/akun dari handoff lama tidak dianggap keadaan produksi terbaru.
- Tidak menjalankan perubahan stok, reset akun, migrasi produksi, perbaikan UI atau deployment pada pekerjaan analisis ini.

## Pemetaan feedback dan hasil analisis

Prioritas P1: menghambat tugas atau berisiko memasukkan data yang tidak sesuai. P2: mempermudah kerja/pemahaman setelah alur dasar benar. Tanda * menunjukkan prioritas final bergantung klarifikasi.

| ID | Feedback dan sumber | Hasil analisis | Prioritas / batch |
|---|---|---|---|
| FB-01 | Bagian bawah dashboard tidak terlihat; p1, gambar1 | Screenshot masih memperlihatkan scrollbar. CSS utama memakai `min-height`, bukan batas tinggi konten. Belum terbukti terpotong; hero besar membuat KPI/pekerjaan berikutnya berada di bawah lipatan layar. | P1*, A |
| FB-02 | Menu desktop/mobile berbeda, contoh Cetak Label; p3, gambar2 | Terbukti di kode: `/admin/labels` ada pada quick nav mobile, tetapi tidak ada pada `primary`/`manage` desktop dan menu lengkap. | P1, A |
| FB-03 | Angka pecahan padahal PCS tidak boleh pecahan; p14-19, gambar3-4 | Kedua jalur input angka di `forms.tsx` menetapkan step `0.0001`. Gambar3 sebenarnya menunjukkan **minimum stok**, bukan mutasi jumlah. Jumlah transaksi sudah diperiksa menurut satuan di server; `minStock` baru diperiksa format angka, belum aturan pecahan satuannya. | P1, A |
| FB-04 | Jumlah unit per baris penerimaan alat harus tetap1; p20, gambar4 | Server mewajibkan satu unit dan tag per baris serialized, tetapi jumlah pada UI tetap bebas. Aturan UI dan server tidak selaras. Hanya baris **penerimaan** yang dikunci1; permintaan meminjam beberapa alat tetap boleh berjumlah lebih dari1. | P1, C bersama FB-13 |
| FB-05 | Edit Master Data kembali ke atas; p22, gambar7 | Tautan hanya mengubah query `edit`, sedangkan editor berada sesudah daftar. Belum ada target editor, perpindahan fokus, atau pemeliharaan filter/halaman pada tautan Edit. | P1, A |
| FB-06 | Lokasi penggunaan dapat diketik, opsi lainnya/autocomplete; p24/34, gambar6 | Sekarang hanya menerima ID lokasi master. Lokasi kerja di lapangan perlu dapat dicatat tanpa memberi teknisi hak membuat master gudang. | P1, B |
| FB-07 | Kebutuhan combo/autocomplete, gambar5 | Gambar5 justru menunjukkan dropdown **Barang**, bukan Lokasi penggunaan. Native select ratusan SKU memang berat dicari. Pencarian pada pilihan barang disertakan sebagai usulan pendamping; pemetaan gambar yang ambigu tidak dianggap bukti dua bug berbeda. | P2, B |
| FB-08 | Salah satu fitur tidak bisa diklik; p39, gambar7 | Klarifikasi pemilik: kemungkinan label `Ruang kerja MTC` dianggap pemilih lokasi. Kode menunjukkan elemen ini hanya div statis. Ini masalah affordance/konteks, bukan bukti aksi server gagal. | P2, A |
| FB-09 | Tanggal pengembalian tanpa jam dan terhubung notifikasi; p43, gambar8 | Form memakai `datetime-local`. Reminder **sudah ada** untuk pinjaman/kalibrasi/stok minimum; perlu menyesuaikan kebijakan tanggal dan fase harian, bukan membuat sistem job baru. | P1, B |
| FB-10 | Asset tag dan serial otomatis; p46, gambar9 | Tag internal bisa dialokasikan otomatis. Serial pabrikan adalah fakta pada unit dan tidak boleh dihasilkan dari SKU. Kolom keduanya perlu dibedakan dengan jelas. | P1, C |
| FB-11 | QR otomatis atau dari spreadsheet; p52, gambar10 | Saat ini QR dibuat dengan `QRCode.toDataURL(a.tag)`, berdasarkan tag di database aplikasi. Tidak membaca spreadsheet secara langsung. Identitas asal impor dapat memengaruhi isi database, tetapi tidak ada sinkronisasi Excel otomatis. | P2, D; penjelasan segera |
| FB-12 | Bahan habis pakai tetap memiliki QR; p62 | Halaman label saat ini hanya mengambil Asset. Barang quantity perlu label katalog/SKU tersendiri, tanpa dibuat menjadi aset serialized per pcs. | P1, D |
| FB-13 | Menambah banyak alat sekaligus dengan form menyesuaikan; p63 | Tetap simpan satu unit per baris, tetapi operator memilih jumlah unit sekali. Aplikasi membuat rincian unit yang dapat ditinjau, bukan mengharuskan memilih SKU/lokasi berulang. | P1, C bersama FB-04/10 |

## Keputusan desain dan aturan yang diusulkan

### 1. Angka mengikuti makna field dan satuan

- PCS/roll/box yang diset tidak menerima pecahan: langkah1, tanpa pecahan. Satuan yang menerima pecahan tetap mendukung sampai empat angka desimal sesuai domain saat ini.
- Jumlah penerimaan/permintaan/penyerahan/transfer/sisa harus positif. Minimum stok boleh0. Hasil opname boleh0; unit serialized saat opname tetap hadir1 atau tidak ditemukan0.
- Minimum stok serialized adalah ambang jumlah unit, sehingga juga bilangan bulat.
- Jangan mengubah semua input number menjadi integer secara global; ini akan merusak satuan seperti liter. Field nonjumlah seperti masa reservasi mempunyai batasnya sendiri.
- Metadata unit, termasuk izin pecahan, harus diteruskan dari halaman ke komponen form. Gunakan satu aturan bersama pada caller yang relevan, bukan hardcode berdasarkan teks `Pcs`.
- Server memeriksa minimum stok menurut unit/tracking, selain pemeriksaan jumlah transaksi yang sudah ada. Pesan kesalahan menunjuk field/baris yang perlu diperbaiki.
- Tinjau nilai minimum stok PCS yang telanjur pecahan secara read-only sebelum rilis. Jangan membulatkan saldo, threshold atau data historis secara diam-diam. Koreksi metadata memerlukan alasan dan audit.
- Pertahankan Decimal PostgreSQL/Prisma. Tidak perlu mengganti seluruh kolom menjadi integer.

### 2. Navigasi konsisten, tata letak tetap sesuai perangkat

- Gunakan sumber tujuan menu bersama untuk sidebar, menu mobile lengkap dan quick nav. Nama, ikon, URL serta kebijakan role untuk tujuan yang sama harus konsisten.
- Tambahkan Label QR ke menu lengkap desktop/mobile bagi role yang berhak. Tetap batasi bottom nav menjadi lima pintasan; tidak semua menu harus masuk baris bawah.
- Audit kesamaan istilah, terutama Permintaan/Pengajuan dan Label Aset/Label QR. Tujuan menu diberi nama yang konsisten; judul halaman boleh menjelaskan mode label unit atau barang.
- Tampilan tombol mengikuti policy server yang sama. Menyembunyikan menu tidak menggantikan pemeriksaan izin pada server.
- `Ruang kerja MTC` sekarang hanya label hardcode, bukan pilihan lokasi atau pemilih gudang. Untuk satu gudang, tampilkan konteks nama gudang yang jelas dan tautan `Kelola lokasi` bagi ADMIN/WAREHOUSE menuju Master Data tab Lokasi. Jangan membuat dropdown multi-gudang yang belum mempunyai perilaku sebenarnya.
- Nama konteks dapat mengikuti satu master gudang aktif yang teridentifikasi secara tidak ambigu. Jika belum ada atau lebih dari satu, pakai fallback `Inventory MTC`, bukan memilih gudang pertama secara sembarang. Perubahan nama master tidak memindahkan stok atau mengubah scope transaksi.
- Label konteks dibuat tampak sebagai teks informasi; hanya tautan pengelolaan yang terlihat dapat diklik. Teknisi tidak mendapatkan hak mengubah master. Gunakan metadata ringan, tanpa memuat saldo/katalog hanya demi label shell.

### 3. Dashboard dan edit harus menunjukkan kelanjutan tindakan

- Reproduksi FB-01 pada viewport pendek sebelum mengubah overflow. Bedakan konten hilang, tertutup nav, salah container scroll, dan sekadar berada di bawah lipatan layar.
- Ringkas hero/dashboard agar aksi dan ringkasan pekerjaan prioritas terlihat lebih awal, terutama untuk gudang. Jangan mengecilkan tulisan atau memaksa seluruh dashboard muat satu layar.
- Konten terakhir tetap dapat dicapai lewat roda mouse, sentuhan, Page Down dan End. Scroll sidebar tidak boleh menjebak pengguliran konten.
- Klik Edit membuka editor yang sesuai, membawa judul editor ke viewport dan memindahkan fokus secara wajar setelah konten siap. Tidak bergantung timeout atau animasi paksa.
- Pertahankan tab, pencarian, filter dan halaman daftar. Sediakan Kembali/Batal yang jelas. ID edit tidak valid tidak boleh diam-diam membuka form Tambah.
- Konflik versi master tetap ditolak; jangan menimpa perubahan pengguna lain saat memperbaiki fokus.

### 4. Pisahkan lokasi penyimpanan dan lokasi penggunaan

- Lokasi asal barang tetap master lokasi gudang yang valid. Ini menentukan saldo dan unit yang dipakai transaksi.
- Lokasi penggunaan memakai input pencarian dengan saran lokasi yang ada, serta opsi mengetik lokasi lain, misalnya area proyek atau lokasi pelanggan.
- Lokasi pilihan tetap menyimpan `targetLocationId`; teks bebas disimpan terpisah, disarankan `targetLocationText` nullable pada Document. Tidak membuat Master baru dari akun teknisi.
- Field tetap opsional sebagaimana baseline sekarang. Jika teks diisi, trim dan validasi panjang, usulan maksimum200 karakter. Jangan menebak ID hanya karena nama lokasi sama.
- Nama/kode/hierarki pada saran perlu membedakan lokasi yang namanya mirip. Ketika pengguna mengganti pilihan menjadi teks bebas, ID lama harus dilepas agar data tidak bertentangan.
- Simpan lokasi penggunaan ke snapshot checkout. Perbarui tampilan permintaan, detail pinjaman dan nota agar teks bebas tidak hilang menjadi “Belum dicatat”. Bukti lama tetap memakai snapshot lamanya.

### 5. Pemilih barang yang dapat dicari

- Cari berdasarkan kode dan nama; tampilkan kategori/satuan seperlunya. Barang hanya dapat dipilih dari katalog yang aktif, bukan dibuat dengan mengetik teks baru.
- Usahakan menggunakan satu komponen form yang mendukung dua mode: pilihan wajib untuk barang, dan pilihan/teks bebas untuk lokasi penggunaan. Jangan membangun framework form baru.
- Keyboard, sentuhan, pembaca layar, pilihan kosong dan hasil tidak ditemukan harus ditangani. Jangan mengganti native select dengan komponen yang kehilangan aksesibilitas.
- Pencarian menggunakan metadata katalog yang sudah dimuat. Tidak mengirim request pada setiap ketikan bila dataset saat ini belum membutuhkannya. Jangan memuat saldo sensitif/seluruh relasi stok hanya untuk daftar pilihan.

### 6. Pengembalian berdasarkan tanggal kalender

- Untuk peminjaman alat baru, form hanya meminta tanggal. Label menjadi `Rencana tanggal kembali`.
- Usulan batas waktu: sampai akhir tanggal tersebut pada timezone perusahaan, bukan tengah malam awal hari dan bukan timezone browser.
- Pertahankan `dueAt` UTC sebagai batas waktu mesin. Helper `businessDate` sudah mendukung akhir hari; jangan mengubah perilaku global semua tanggal karena kalibrasi dan tanggal transaksi mempunyai konteks sendiri.
- Untuk membedakan kontrak lama yang memakai jam, disarankan penanda `dueDateOnly` pada Document dan Loan dengan default false; transaksi baru memakai true. Ini perubahan schema additive, bukan konversi massal tanggal lama.
- Tampilan, nota versi baru dan reminder membaca kebijakan yang sama. Bukti lama, snapshot dan file PDF yang telah diterbitkan tidak diubah. Pinjaman lama tetap memakai deadline jam lamanya sampai ada koreksi beralasan.
- Usulan reminder pinjaman: H-2, H-1, hari jatuh tempo dan overdue harian; penerima peminjam serta petugas gudang aktif. Hitung fase menurut tanggal kalender perusahaan.
- Gunakan worker/reminder dan Notification existing. Pertahankan idempotensi `eventKey`, hentikan reminder pinjaman yang seluruh unitnya sudah diterima fisik, dan hindari notifikasi baru setiap tick10 detik.
- Kanal telah dikonfirmasi pemilik: **notifikasi di aplikasi dahulu**. Email/WhatsApp di luar scope rencana ini.

### 7. Penerimaan banyak unit dan tag otomatis

Alur yang dituju:

1. Petugas memilih SKU dan lokasi sekali.
2. Untuk barang jumlah, isi jumlah menurut satuan.
3. Untuk alat, isi `Jumlah unit`, misalnya3. Aplikasi menampilkan tiga rincian unit dengan jumlah per baris tetap1.
4. Kondisi/lokasi yang sama dapat diterapkan sebagai default. Serial dan informasi unit lain tetap dapat berbeda pada setiap rincian.
5. Saat draft disimpan, server mengalokasikan tag internal secara atomik. Draft/detail penerimaan menampilkan tag yang benar-benar dialokasikan untuk ditinjau sebelum posting.
6. Posting tetap satu transaksi atomik per penerimaan. Barcode/QR belum berarti barang sudah masuk sebelum posting berhasil.

Ketentuan implementasi:

- Gunakan pola existing `MTC-<SKU>-001` dan seterusnya; panjang urutan boleh bertambah setelah999. Jangan mengubah tag yang sudah dipakai atau mereset urutan impor awal.
- Reuse Counter, idempotency dan lock transaksi existing. Inisialisasi urutan dari data/counter yang benar; periksa aset dan tag draft aktif, bukan hanya menebak `count + 1` di browser.
- Nomor yang terlewati akibat draft batal boleh tetap terlewati. Jangan menggunakan ulang identitas untuk merapikan urutan.
- Preview sebelum penyimpanan harus jujur: tag dialokasikan ketika draft disimpan, bukan menjanjikan nomor browser yang belum dicadangkan.
- Nomor seri pabrikan tetap opsional/manual. Ubah label menjadi `Nomor seri pabrikan (opsional)` dan berikan penjelasan singkat. Jangan menyalin model atau spesifikasi menjadi serial unik.
- Penggandaan rincian tidak menyalin serial/tag. Perubahan jumlah tidak boleh menghilangkan rincian yang sudah diisi tanpa kesempatan membatalkan/memulihkan tindakan.
- Batas existing100 baris berlaku untuk total unit/baris dalam satu penerimaan. Batas ditampilkan sebelum mengirim; jumlah101 tidak boleh tersimpan sebagian. Menambah stok dengan jumlah lebih besar dapat dibagi menjadi penerimaan berikutnya.
- Jumlah pada **permintaan peminjaman** serialized tetap boleh N unit. Penguncian1 hanya untuk satu rincian penerimaan, bukan semua field alat.
- Kegagalan satu unit, serial duplikat atau retry tidak boleh menghasilkan sebagian stok, audit terpisah, maupun unit ganda. Pertahankan ledger quantity terpisah dari unit serialized.

### 8. QR untuk jenis barang dan untuk unit alat

- Keputusan pemilik, 25 Oktober 2026: **aplikasi Inventory menjadi satu-satunya penerbit QR baru**, dengan satu standar format. Spreadsheet hanya dapat menjadi sumber impor data barang; gambar QR atau formula generator eksternal dari spreadsheet tidak dipakai sebagai label resmi baru.
- Gunakan satu generator/encoder dan satu resolver bersama untuk label barang maupun unit. Pembeda tipe merupakan bagian dari standar yang sama, bukan format buatan masing-masing halaman atau role.
- Mode `Barang / SKU`: label untuk komponen/bahan berdasarkan jumlah. Satu QR mengenali katalog barang; pemakai tetap memasukkan jumlah pada transaksi.
- Mode `Unit alat`: label mengenali satu Asset beserta tag unitnya.
- Usulan payload baru bertipe dengan ID internal stabil, misalnya `MTC:ITEM:<id>` dan `MTC:ASSET:<id>`. Kode SKU/tag yang mudah dibaca tetap dicetak sebagai teks di label.
- Alasan memakai ID stabil: edit nama atau SKU tidak memaksa mencetak ulang semua QR. Payload baru tidak memuat deskripsi panjang, jumlah stok, data pribadi atau credential.
- Scanner/resolver harus tetap menerima label lama yang berisi raw tag dan kode barang yang masih dipakai. Jangan membatalkan QR yang sudah ditempel atau melakukan rename massal tag deskriptif dari data existing.
- Resolver membedakan barang dan unit, membuka tujuan sesuai role, serta memeriksa izin. Pindai tidak melakukan approval, penerimaan atau checkout otomatis; payload tidak boleh menjadi navigasi bebas ke URL luar.
- QR dibuat dari database aplikasi saat label diminta. File spreadsheet adalah sumber impor, bukan database QR yang dibaca ulang saat scan.
- Cetak ulang menerbitkan kembali QR dengan identitas/payload yang sama. Tidak membuat SKU, unit atau identitas baru hanya karena label dicetak ulang. Kontrak payload final ditetapkan sekali sebelum batch D; contoh di atas masih usulan teknis, bukan format yang sudah diimplementasikan.
- Halaman `/admin/labels` sekarang memakai `take:100`. Hilangkan pemotongan diam-diam: sediakan pencarian/filter, total hasil, pagination dan pilihan label yang benar-benar dicetak. Rekomendasi awal maksimal100 label terpilih per batch cetak, dengan batas terlihat.
- Cetak hanya pilihan yang dimaksud, dengan teks SKU/tag, nama, dan lokasi seperlunya. Jangan mengubah semua komponen menjadi Asset demi memperoleh QR.
- Uji label sungguhan pada kertas/printer/perangkat tim sebelum menyatakan ukuran cetak dan kamera lulus UAT.

## Batch implementasi

Bobot di bawah adalah kompleksitas relatif, bukan janji jumlah hari Codex. Satu batch harus dapat direview dan diverifikasi sebelum lanjut. Urutan default A, B, C, D; C dapat didahulukan dari B jika penerimaan alat menjadi hambatan terbesar.

### Batch A Memperbaiki input dan navigasi dasar

Scope: FB-01/02/03/05/08. Bobot S-M. Tidak direncanakan migrasi schema.

Target: `src/components/forms.tsx`, `src/components/shell.tsx`, `src/app/globals.css`, halaman master/katalog/transaksi pada `src/app/[[...path]]/page.tsx`, validasi item pada `src/server/inventory.ts`, serta test form/mobile yang terkait.

Acceptance:

- PCS tidak menawarkan increment pecahan; liter tetap menerima pecahan yang sah. `minStock` PCS pecahan ditolak server, nilai0 tetap sah.
- Semua tujuan menu yang diizinkan role dapat ditemukan dari desktop maupun menu mobile lengkap. Label QR dapat dibuka dari keduanya.
- Edit master langsung menunjukkan form terisi, fokus jelas, filter/pagination terjaga dan Back/Batal berfungsi.
- Pada viewport pendek, seluruh dashboard dapat dicapai dengan scroll dan aksi prioritas terlihat lebih awal tanpa mengecilkan teks.
- Label konteks gudang tidak menyerupai dropdown yang mati; tautan Kelola lokasi membuka halaman lokasi yang benar bagi role berwenang. Nama master dapat berubah melalui Master Data tanpa memindahkan stok. Jika tim ternyata menunjuk fitur lain pada FB-08, buat reproduksi terpisah dan jangan menganggapnya sudah selesai.

### Batch B Mempermudah pengisian permintaan

Scope: FB-06/07/09. Bobot M. Satu migration additive untuk teks lokasi penggunaan dan penanda kebijakan tanggal, jika rancangan ini dipakai.

Target: form/field pilihan, schema dan migration Prisma, service create/revise request dan checkout snapshot, `business-date.ts`, `reminders.ts`, DateLabel/tampilan jatuh tempo, template nota, serta tampilan/laporan yang menggunakan data terkait.

Acceptance:

- Cari/pilih SKU tanpa menggulir ratusan opsi. Nilai yang bukan katalog ditolak untuk barang.
- Lokasi existing tersimpan sebagai referensi; lokasi lain tersimpan sebagai teks dan muncul kembali di request, snapshot serta nota. Master gudang tidak bertambah dari aksi teknisi.
- Pinjaman baru hanya meminta tanggal dan berlaku sampai akhir hari sesuai timezone perusahaan. Kontrak/nota pinjaman lama tidak berubah.
- Reminder H-2/H-1/H0/overdue muncul sesuai penerima, tidak berulang setiap tick dan berhenti sesuai keadaan pengembalian.
- Kebijakan baru tidak mengubah masa reservasi pengambilan atau tanggal kalibrasi secara tidak sengaja.

### Batch C Mempercepat penerimaan alat

Scope: FB-04/10/13. Bobot M-L. Rencanakan memakai Counter/constraint existing; jangan menambah tabel reservasi tag sebelum terbukti diperlukan.

Target: editor baris penerimaan, service receipt/post-receipt dan allocator tag bersama, tampilan draft/detail unit, kompatibilitas impor opening, serta tes PostgreSQL retry/concurrency.

Acceptance:

- Memilih3 unit menghasilkan tiga rincian berjumlah1 tanpa memilih ulang SKU/lokasi. Meminta pinjam3 alat tetap memakai jumlah3.
- Tag dialokasikan server dan tampil pada draft; serial pabrikan tidak dibuat otomatis. Urutan tidak berbenturan dengan tag aset atau draft lama.
- Permintaan bersamaan memakai koneksi PostgreSQL terpisah menghasilkan identitas unik. Retry aksi yang sama tidak menambah counter/draft/unit kedua.
- Posting beberapa unit berlaku seluruhnya atau tidak sama sekali. Tidak ada tambahan Balance quantity untuk serialized.
- Impor awal/manual legacy masih dapat ditelusuri; tag/serial lama tidak diubah diam-diam.

### Batch D Menyatukan label dan pemindaian

Scope: FB-11/12, penyelesaian UX label setelah FB-02 dan tag setelah C. Bobot M.

Target: halaman label, scanner/resolver bersama, pencarian/detail barang atau unit sesuai role, CSS cetak dan pengujian QR. Reuse paket qrcode dan decoder existing.

Acceptance:

- QR barang quantity membuka katalog yang benar dan tetap memakai jumlah/satuan. QR unit alat mengidentifikasi unit yang benar.
- Seluruh penerbitan QR baru berasal dari generator aplikasi yang sama; cetak ulang menghasilkan identitas yang sama. Generator spreadsheet/layanan luar tidak menjadi jalur penerbitan label resmi.
- Label lama, SKU lama dan label baru bertipe tetap dapat diproses sesuai aturan kompatibilitas.
- Tidak ada aset fiktif per pcs consumable, perubahan stok akibat scan atau akses lintas role tanpa policy.
- Label di luar100 aset pertama dapat ditemukan/dipilih; cetak hanya pilihan yang diminta.
- Cetak dan pindai pada HP nyata lulus; fallback manual tetap berfungsi bila kamera ditolak.

## Skenario uji yang wajib menjadi bukti

### Batch E Pemasangan PWA

Tambahan pemilik 25 Oktober 2026. Manifest standalone, ikon 192/512, maskable, Apple touch dan favicon memakai simbol MTC biru. Skill `kaankiziltug/logo-design-skill` dipasang dan digunakan dalam mode Assets untuk turunan identitas MTC yang ada.

- Pemasangan melalui Chrome/Edge Android/desktop; petunjuk Safari Tambahkan ke Layar Utama di Profil.
- Service worker hanya menyimpan halaman offline statis dan ikon publik. HTML login/akun, API, RSC, stok, foto privat dan transaksi tidak masuk cache offline.
- Tidak ada antrean transaksi offline. Jika hasil Simpan belum pasti, pengguna memeriksa riwayat setelah tersambung sebelum membuat transaksi baru; retry server tetap idempotent.
- Pembaruan service worker menunggu lifecycle browser; tidak memaksa reload form aktif. HTTPS produksi dan header no-cache worker diperiksa saat rilis.
- PWA terpisah dari kanal reminder: notifikasi tetap di aplikasi. Web Push tidak ditambahkan.
- Acceptance otomatis: manifest/ikon valid, offline fallback aman, cache tidak memuat data terautentikasi, autentikasi/role normal. Pemasangan dan kamera/printer pada perangkat fisik tetap menjadi UAT pemilik.


| Skenario | Hasil yang harus dibuktikan |
|---|---|
| PCS: jumlah1/2, minimum0, pecahan0.5 | Bilangan bulat dan minimum0 diterima; pecahan ditolak pada field yang tidak mengizinkannya, termasuk server |
| Liter pecahan dan jumlah nol | Pecahan sampai4 desimal dipertahankan tepat; jumlah transaksi0 ditolak; opname0 tetap diperbolehkan |
| Penerimaan serialized3 vs permintaan3 | Tiga rincian penerimaan1 unit; permintaan tetap dapat meminta3 unit |
| Bulk1/3/100/101, campuran SKU | Unit dan total batas benar, error per baris, tidak menyimpan sebagian |
| Dua penerimaan serentak + retry | Tag unik, tidak menggandakan asset/draft/audit stok; rollback ketika satu unit gagal |
| Edit master dari halaman2 dengan filter | Editor benar, fokus/scroll tepat, filter dan kembali terjaga, versi konflik tidak ditimpa |
| Kode lokasi tidak valid / teks penggunaan / input HTML | Referensi tidak valid ditolak; teks aman tersimpan dan di-escape pada UI/nota; tidak membuat Master |
| Akhir hari timezone dan tanggal tidak valid | Tidak overdue pada awal tanggal kembali; tepat setelah akhir hari; tanggal kalender tidak valid ditolak |
| Pinjaman lama dan bukti lama | Deadline lama dan snapshot/file bukti tidak berubah; pembacaan lama tetap didukung |
| Reminder dipanggil berkali-kali | H-2/H-1/H0/overdue tepat dan tidak spam; unit sudah diterima fisik tidak terus diingatkan untuk kembali |
| QR SKU quantity, unit, legacy, malformed | Target tepat dan sesuai role; payload tidak memposting, tidak membuka URL luar, fallback manual tersedia |
| Label lebih dari100 dan cetak sebagian | Total/pagination jelas; ID label yang dicetak sama dengan pilihan, tanpa terpotong diam-diam |
| Desktop/mobile/zoom | Chrome dan Firefox; 1366x768 dan viewport pendek; HP360/390, landscape; zoom125%/200%; keyboard dan sentuhan |
| Regresi stok dan pinjaman | Approval hanya reservasi, posting mengubah fisik, partial return/inspeksi dan blokir kalibrasi tetap berlaku |

Untuk validasi UI gunakan data latihan yang mewakili lebih dari satu halaman master, ratusan SKU, unit lama/baru, dan teks lokasi panjang. Jangan memasukkan transaksi contoh pada produksi. Test lama yang relevan harus tetap lulus; tidak perlu menambah snapshot test yang hanya menyalin implementasi.

## Persiapan data dan rilis

1. Audit read-only keadaan aktual: minimum stok PCS yang pecahan, tag legacy/deskriptif, draft aktif, nomor urut terakhir, label di luar100 pertama, dan pinjaman yang sudah memiliki jam jatuh tempo. Hasil rinci tetap privat.
2. Backup terenkripsi dan salinan off-host sebelum migrasi/rilis. Gunakan bukti restore yang sah; jangan mengklaim lulus jika belum diuji pada perubahan yang membutuhkannya.
3. Perubahan schema hanya additive dan nullable/default kompatibel. Jalankan migration satu kali sebagai job rilis, bukan saat startup setiap replica.
4. Jalankan unit/domain, integrasi PostgreSQL termasuk koneksi terpisah, E2E role/perangkat, lint/typecheck/build web/worker dan fixture PDF yang terdampak.
5. Rilis per batch ke pilot dengan web/worker dari commit yang sama; health, fungsi utama, serta rekonsiliasi saldo/unit sebelum-sesudah dibuktikan. Image sebelumnya dipertahankan untuk rollback; tidak melakukan rollback dengan menghapus data baru.
6. Perbarui `UI_SPEC.md`, `MASTER_DATA_SPEC.md`/`PRINT_SPEC.md` sesuai dampak, dan buku panduan PDF beserta screenshot pada akhir batch yang mengubah alur. `STATUS_IMPLEMENTASI.md` tetap satu-satunya handoff implementasi.
7. Mode preparation, sign-off fisik/UAT dan pembatasan kalibrasi tidak dicabut hanya karena perubahan UX selesai.

Keterkaitan backlog awal: INV-04 untuk policy akses; INV-05/06 untuk master/katalog; INV-09 untuk penerimaan; INV-10/14 untuk permintaan/checkout; INV-15 untuk QR; INV-18 untuk snapshot/nota; INV-23/24 untuk kalibrasi/reminder; INV-25 untuk dashboard/laporan; INV-29/30 untuk regresi/concurrency dan UAT. Rencana feedback ini tidak menandai seluruh item V1 selesai.

## Keputusan terbuka

- FB-08 sudah diarahkan oleh pemilik pada label `Ruang kerja MTC`; karena pemilik menyebutnya sebagai kemungkinan, verifikasi singkat dengan pelapor tetap dilakukan saat UAT. Tidak menjadi alasan menahan batch lain.
- Kanal reminder sudah ditetapkan pemilik: notifikasi di aplikasi. Tidak memerlukan integrasi layanan pesan eksternal pada batch ini.
- Instruksi eksekusi pemilik 25 Oktober menerima rancangan cutoff akhir hari untuk tanggal baru dan lokasi penggunaan bebas sebagai metadata transaksi. Deadline lama tidak dikonversi.
- Format tag mengikuti pola existing MTC-SKU-urutan. Perubahan pola baru atau rename label lama harus diputuskan terpisah sebelum menyentuh identitas fisik.

Catatan alat desain: Impeccable melaporkan `.impeccable/design.json` lebih lama daripada `DESIGN.md`. Sidecar dapat disinkronkan lewat `impeccable document` setelah diminta; tidak diperbaiki sebagai efek samping analisis feedback. Arah visual pada DESIGN.md tetap berlaku.
