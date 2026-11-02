# Rencana perbaikan 3 - MTC Inventory

Tanggal: 2 November 2026. Status: implementasi berjalan; bukti gate/rilis pada STATUS_IMPLEMENTASI.md.
Sumber: `perbaikan 3.docx`, seluruh paragraf dan sepuluh gambar telah dibaca; kode lokal baseline rilis `e9cc9e5bf0e3ce4024e002f092f7d3e93c8c4413`. Bukti sumber diekstrak privat ke `.local/feedback3/`; tidak disalin ke public/repository.

## Sasaran dan batas

Tim teknisi cepat mengambil komponen/meminjam alat; gudang mudah menghitung, merawat, membaca jejak dan mencetak label. Mode Operate: identitas biru/logo MTC dan komponen existing dipertahankan. Tidak mengganti stack, menambah library UI, membangun audit kedua atau mengubah bukti historis.

Analisis berdasarkan DOCX dan source lokal, bukan reproduksi langsung di server pada sesi ini. Sebagian screenshot berasal dari sebelum rilis terakhir; klaim bug belum dianggap sudah teruji ulang. Tidak mengubah server, saldo, akun, credential atau schema dalam pekerjaan perencanaan ini.

## Daftar temuan dan solusi

### F3-01 - Hasil pengajuan kurang terlihat (gambar 1)

Bukti: screenshot teknisi masih memperlihatkan pesan sukses inline di atas form. `ActionFeedbackProvider` existing sudah menampilkan kartu hijau dengan CircleCheck di viewport setelah server sukses, satu live region, delapan detik dengan pause saat hover/fokus, serta dismiss. Jadi permintaan ini sebagian sudah terjawab rilis sebelumnya; perlu verifikasi aktual akun teknisi/PWA sebelum menambah UI.

Rencana: tes pengajuan komponen dan alat, termasuk saat form di-scroll bawah, koneksi lambat, sukses berulang dan error. Pastikan kartu tidak tertutup dua bar sticky mobile. Teks hasil menyebut nomor permintaan dan status nyata **Permintaan terkirim - menunggu persetujuan**, bukan barang sudah boleh diambil. Jika setelah uji masih perlu penekanan, gunakan satu kartu sukses existing dengan animasi centang singkat dan `prefers-reduced-motion`, tanpa dialog wajib OK atau toast kedua. Nomor/tautan ke detail permintaan hanya ditambah bila hasil action menyediakan identitas yang terverifikasi.

Lulus bila: tampil setelah commit, tidak ada sukses saat error, tidak mengambil fokus, dapat ditutup, hasil tetap terbaca inline. Persetujuan/penyerahan tetap proses terpisah.

### F3-02 - Lokasi menjadi filter pada permintaan (gambar 1)

Bukti: pilihan Barang dan Lokasi pada baris `ActionForm` sekarang independen; memilih barang memakai lokasi default katalog. Lokasi asal transaksi tetap wajib dan tidak boleh diganti menjadi filter yang tidak tersimpan.

Rencana: label **Ambil dari rak** untuk lokasi asal; pilihan lokasi di atas daftar menjadi filter opsional pada pencarian barang. Jika barang dipilih dulu, tampilkan rak yang relevan beserta stok tersedia dengan satuan. Jika hanya satu rak yang memenuhi, pilih otomatis dan tetap tampilkan. Jika ganti filter/item, kosongkan pilihan yang tidak cocok dan beri penjelasan. Lokasi penggunaan di bagian tujuan tetap terpisah, tidak ikut berubah. Jangan mengasumsikan jumlah default katalog adalah stok fisik atau menggabungkan saldo parent/child.

Lulus bila: filter membantu menemukan barang tanpa menghapus `locationId` pada setiap baris; payload konsisten, server validasi stok/reservasi/kelayakan tetap otoritas. Barang di dua rak, stok kosong, unit terkalibrasi kedaluwarsa, filter reset dan beberapa baris diuji. Gunakan data stok scoped hanya pada route permintaan; jangan membebani semua halaman.

### F3-03 - Cari/pindai mengarah ke 0.0.0.0 (gambar 2?3, prioritas pertama)

Bukti pasti screenshot: URL tujuan `https://0.0.0.0:3000/...` dan `ERR_ADDRESS_INVALID`. Source `/scan` membangun URL absolut dari `request.url`; ini konsisten dengan origin internal standalone/proxy yang ikut ke header Location. Penyebab runtime harus dibuktikan dengan respons redirect di lingkungan latihan/origin/proxy, bukan dianggap kesalahan kamera.

Rencana: perbaiki akar redirect pada route scan, termasuk ketika belum login. Gunakan tujuan relatif same-origin bila didukung/dibuktikan pada route; alternatif origin publik dari konfigurasi terverifikasi. Jangan mempercayai sembarang Host/X-Forwarded-Host atau membuka open redirect. Jangan mengubah hostname bind Docker menjadi hostname publik. Pertahankan payload `MTC:ITEM:<id>`/`MTC:ASSET:<id>`, legacy SKU/tag dan hash unit.

Pisahkan copy **Cari kode / hasil pindai** dari pencarian nama katalog. Input manual menerima kode/tag/SKU; nama bebas diarahkan ke pencarian katalog jika memang diinginkan, bukan dianggap QR valid. Sembunyikan area video kosong sebelum kamera aktif, sediakan fallback izin kamera gagal, dan rapikan hasil kode tidak ditemukan.

Lulus bila: login/missing/item/asset/legacy mengarah ke host yang sedang dipakai atau origin resmi, tidak pernah wildcard/localhost/port internal. Uji domain tunnel, origin LAN, forwarded header palsu, akun teknisi/nonteknisi, sesi habis dan cache no-store. Kamera nyata/scan USB harus diuji di perangkat gudang; tes browser saja tidak mengesahkan kamera fisik.

### F3-04 - Tidak bisa menambahkan barang saat hitung stok (gambar 4)

Bukti: sesi hanya membuat snapshot dari Balance serta unit available/blocked pada lokasi tepat yang dipilih. Lokasi katalog default tidak otomatis menciptakan saldo. Tabel kosong tidak membuktikan barang hilang; bisa lokasi yang salah, barang berada di rak anak/lain, belum ada saldo, atau unit tidak eligible. UI juga masih bisa menyajikan form hitung kosong.

Rencana minimum yang aman:

1. Sebelum mulai, tampilkan nama/kode lokasi, jumlah SKU/unit yang akan dihitung, dan penjelasan cakupan rak tepat. Gudang tidak perlu menebak bahwa memilih gudang induk tidak mencakup rak anak. Jika cakupan kosong, jelaskan dan sediakan pilih rak yang benar.
2. Dalam sesi draft, tombol **Tambahkan barang temuan**, dengan pencarian SKU dari katalog yang sama. Tidak mengetik nama bebas sebagai SKU baru. Tampilkan nama, SKU, satuan, saldo snapshot dan hasil fisik dalam satu tabel/form; angka nol tetap terlihat sebagai 0.
3. Untuk barang quantity aktif yang belum punya Balance di rak: tambah satu line snapshot nol dengan alasan/sumber temuan; jangan ubah Balance saat menambah/menghitung. Jika ternyata sudah punya line/saldo, gunakan line existing; jangan duplikasi snapshot nol. Adjustment baru diposting satu kali setelah review pihak lain.
4. Untuk unit serialized: pilih identitas unit existing yang memang seharusnya dihitung di rak tersebut; verifikasi status/lokasi. Unit dari rak lain menjadi temuan beda lokasi yang diselesaikan lewat transfer terkontrol setelah freeze dilepas, bukan adjustment quantity. Unit baru/tidak dikenal menjadi temuan tertahan untuk registrasi/penerimaan dan inspeksi terpisah; tidak langsung tersedia dari opname. Katalog yang belum ada dibuat melalui Master Data/penerimaan existing dan direkonsiliasi, bukan stok liar dari form hitung.
5. Penambahan hanya saat draft, role stock, lokasi sama, freeze milik sesi, audit/alasan serta idempotency sama dengan transaksi line. Lock/check sesi secara atomik terhadap submit/post/cancel. Tolak unit borrowed/reserved/pending inspection, duplikasi SKU/rak atau asset, dan penambahan pada review/posted/cancelled.
6. Sesi kosong tidak boleh diajukan/diposting sebagai hasil hitung valid. Ubah penjelasan freeze ke bahasa gudang, dan pertahankan tombol batal yang membukanya kembali.

Lulus bila: tambahan draft tidak mengubah fisik/reservasi, posting quantity menghasilkan ledger delta yang tepat, retry tidak menggandakan; reviewer bukan pembuat/penghitung. Uji tambah berbarengan, tambah versus submit/post/cancel, hasil nol, pecahan sesuai satuan, pembatalan, lokasi beku, temuan beda rak dan unit tak dikenal. Jangan memperluas fitur ini menjadi impor saldo atau penerimaan massal.

### F3-05 - Pilihan Perawatan & Kalibrasi terlalu luas (gambar 5)

Bukti: route mengirim seluruh asset dan hanya menampilkan tag/status teknis bahasa Inggris, tanpa nama barang; modul menggabungkan maintenance, release dan installed. Filter kategori saja tidak cukup menggambarkan kebutuhan kalibrasi.

Keputusan pemilik dikonfirmasi 2 November 2026: seluruh menu **Perawatan & Kalibrasi hanya untuk sensor dan produk jadi**. Batasi berdasarkan jenis master bisnis, bukan substring nama atau kategori bebas. Alat kerja, consumable dan prototype tidak dapat dipilih untuk tindakan baru pada menu ini; riwayat lama tetap dapat dibaca. Tidak perlu menambah tab Perawatan alat. Di dalam dua jenis yang diizinkan, kebutuhan metode/masa berlaku kalibrasi tetap ditentukan oleh `calibrationRequired`, bukan dianggap wajib untuk semua sensor/produk jadi. Pembatasan berlaku pada pilihan UI dan validasi server untuk action maintenance; pelaporan insiden existing tetap terpisah dan tidak ikut dihapus.

Pilih SKU/nama lalu unit melalui komponen searchable existing; label unit memuat tag, nama barang, rak dan status Indonesia. Pilihan action tidak memunculkan tanggal/metode kalibrasi pada alat nonkalibrasi. Filter kelayakan dan validasi server harus sama; jangan sekadar menyembunyikan alat di browser sambil menerima payload yang melanggar cakupan. Riwayat lama tetap terlihat. Status kalibrasi kedaluwarsa/borrowed/pending inspection dan freeze tetap memblokir release sesuai aturan.

Lulus bila: unit mudah dikenali, sensor/produk jadi diterima sesuai kelayakan, jenis lain ditolak server meski payload dikirim langsung, metode/masa berlaku wajib saat dibutuhkan, riwayat terjaga, teknik incident teknisi tetap hanya unit tanggung jawabnya.

### F3-06 - Audit Log berupa kode/JSON (gambar 6)

Bukti: halaman menampilkan actorId/action/entityId mentah dan `JSON.stringify(payload)`.

Rencana: renderer bersama server-side untuk **Riwayat aktivitas** dan laporan audit: waktu zona perusahaan, nama/peran pelaku, tindakan bahasa Indonesia, objek dengan nomor/SKU/tag yang dikenali, ringkasan dan perubahan sebelum/sesudah. Contoh: **Stok minimum diubah: 0 menjadi 5 pcs**; **Laporan stok diunduh - 264 baris, periode ...**. Detail dapat dibuka untuk daftar field relevan, bukan JSON panjang.

Payload audit existing tetap immutable. Resolver nama dibaca batch untuk halaman/baris yang diperlukan, bukan satu query per cell. Nama terkini diberi konteks bila snapshot historis tidak tersedia; tidak mengarang nama lama. ID yang tidak terpecahkan memakai label jujur dan referensi internal, tidak menghapus kejadian. Action tidak dikenal menjadi ringkasan aman **Aktivitas sistem** dengan kode referensi, bukan crash. Gunakan allowlist field dan masking sesuai hak; jangan menampilkan password, token, hash credential atau isi file rahasia dari nested payload. Detail teknis mentah bukan kebutuhan user dan tidak ditampilkan default.

Lulus bila: pelaku/tindakan/objek dan perubahan dipahami tanpa membaca kode, audit mentah tidak ditulis ulang, event lama/unknown/null tersaji aman, tidak ada kebocoran akses dan query N+1.

### F3-07 - Ekspor laporan audit masih kode dan tabel buruk (gambar 7)

Rencana: gunakan renderer audit F3-06 untuk print/PDF browser, XLSX dan CSV, sehingga istilah dan ringkasan tidak berbeda antara web/laporan. Judul **Laporan aktivitas**, waktu zona perusahaan, filter terpakai, kolom waktu/pelaku/tindakan/objek/ringkasan; keterangan panjang dibungkus, kepala tabel berulang, cetak landscape bila diperlukan. Lebar kolom tidak dibuat sama semua; hindari waktu/nama membungkus per huruf. Caption/empty state dan batas baris existing tetap.

Lulus bila: ringkasan manusiawi pada ketiga format, HTML di-escape, formula injection CSV/XLSX tetap dicegah, hak ekspor/audit REPORT_EXPORTED/no-store terjaga. Fixture 1/baris panjang/multipage/unknown event, timezone dan parser isi XLSX/CSV diuji; PDF browser diperiksa visual. Jangan mengubah seluruh generator nota pinjaman untuk kebutuhan laporan ini.

### F3-08 - Kode QR menampilkan deskripsi panjang (gambar 8)

Bukti: tag unit Meteran saat ini berisi teks seperti merek/panjang, sedangkan unit lain memakai MTC-AK... . Komponen label menampilkan `Asset.tag` apa adanya. Ini masalah kualitas identitas master/legacy, bukan sekadar menukar label teks.

Rencana: daftar pemilihan tetap membantu mengenali barang dengan **kode/tag unit** sebagai identitas utama dan nama barang sebagai informasi pendukung. Cetakan final mengikuti F3-09: hanya kode/tag dan lokasi, tanpa nama/deskripsi barang. SKU saja tidak boleh menggantikan tag unit karena satu SKU mempunyai banyak alat. Audit read-only tag legacy yang menyerupai deskripsi/duplikat/format tak seragam, buat daftar pemetaan untuk diverifikasi gudang. Pemetaan kode baru harus disetujui sebelum mutasi data; tag lama jangan diganti diam-diam, karena cetakan/scanner legacy mungkin masih dipakai. Jika diubah, simpan alias legacy yang unik dan diuji, plus audit. Payload QR berbasis id tetap valid; jangan beralih menjadi nama/lokasi.

Lulus bila: setiap unit memiliki identitas unik dan label terbaca; label lama yang memang harus tetap didukung masih menuju unit yang sama. Jika perlu tabel alias/migration, lakukan terpisah dari perbaikan visual dengan backup dan rencana rollback data. Jangan mengklaim masalah selesai hanya dengan memotong deskripsi.

### F3-09 - Cetakan label mencantumkan letak (gambar 9)

Keputusan pemilik dikonfirmasi 2 November 2026: isi teks label cetak **cukup kode/tag dan lokasi** di samping QR; tanpa nama/deskripsi barang maupun footer generik MTC - Unit alat. Unit memakai tag unik; barang quantity memakai SKU. Query lokasi juga saat printing; source saat ini sengaja melewatkan lookup lokasi pada mode cetak. Pada unit, gunakan `Asset.locationId`; label SKU memakai lokasi default katalog dan harus berlabel **Rak default**, bukan klaim seluruh stok SKU berada di sana. Lokasi adalah informasi cetak saat itu; pindah rak memerlukan cetak ulang, QR tetap mengarah ke identitas stabil.

Lulus bila: font/tag/lokasi terbaca pada ukuran label existing, quiet zone QR terjaga, teks panjang diatur tanpa menimpa QR, label massal/halaman/100% scale dan hasil scan diuji. Jangan mengganti payload QR dengan lokasi; pemindahan barang tidak boleh membatalkan identitas. Acceptance cetak memastikan nama/deskripsi dan footer generik tidak ikut tercetak; kode/tag serta lokasi tetap utuh dan terbaca.

### F3-10 - Pengambilan darurat belum dipahami (gambar 10)

Bukti: halaman daftar kosong hanya menjelaskan review setelah override. Source sebenarnya membuat record `pending_review` saat emergency approval/reservasi, sebelum pengakuan penerima dan posting issue. Maka judul/status tidak boleh mengklaim semua record sudah diserahkan.

Rencana: judul **Tinjau persetujuan darurat**, pengantar ringkas **Apa ini / Siapa / Kapan dipakai**, empty state serta langkah prosedur; akses tetap mengikuti policy existing. Daftar membedakan request baru direservasi, sudah diserahkan, dibatalkan/kedaluwarsa dan review selesai berdasarkan transaksi terkait, bukan hanya status record.

Prosedur existing yang perlu diterangkan:
1. Teknisi mengajukan kebutuhan consumable untuk pekerjaan/proyek.
2. Bila persetujuan normal terhambat dan kebutuhan mendesak, ADMIN dengan izin khusus `emergencyIssue` dapat mencatat alasan/dasar kewenangan. Tidak semua admin otomatis berhak; tidak boleh menyetujui permintaan sendiri, tidak berlaku unit serialized, tidak mengabaikan kecukupan stok/freeze.
3. Ini persetujuan/reservasi pengganti; penerima tetap mengakui, petugas gudang memposting penyerahan. Stok fisik turun pada issue, bukan saat override.
4. WAREHOUSE atau AUDITOR yang berbeda dari pelaku override memeriksa alasan/bukti/tindak lanjut dan menyelesaikan review. ADMIN pelaku bukan reviewer; teknisi tidak meninjau override.
5. Review tidak menghapus pengeluaran atau mengembalikan stok otomatis. Kesalahan diselesaikan transaksi koreksi berjejak.

Contoh penggunaan ditulis sebagai contoh SOP usulan: perbaikan IoT mendesak ketika approver normal tak tersedia. Pemilik menentukan definisi mendesak, orang yang diberi izin, dan tenggat review; aplikasi tidak mengaktifkan izin atau mengarang SLA dari rencana ini.

Lulus bila: halaman kosong tetap menjelaskan kegunaan/prosedur; actor/nomor request/alasan/status aktual/reviewer mudah dibaca; penerima sendiri, unit serialized, izin mati dan review diri sendiri ditolak server. Pending review sebelum issue tidak dilabeli barang sudah keluar.

## Urutan pelaksanaan dan batas batch

1. **Batch A - Pindai dan label**: F3-03 sebagai bug utama, kemudian F3-09 dan identitas tampilan F3-08. Audit/pemetaan tag terpisah; jangan menunggu koreksi data legacy untuk merilis redirect. Verifikasi F3-01 existing disertakan. Acuan INV-14/15/18/29.
2. **Batch B - Audit dan laporan**: F3-06/07 dalam satu batch karena satu formatter bersama, ditambah penjelasan darurat F3-10. Acuan INV-25/29/31. Tidak mengubah isi audit lama.
3. **Batch C - Pilihan barang/lokasi dan perawatan**: F3-02/05 dengan cakupan maintenance sensor/produk jadi yang sudah dikonfirmasi. Acuan INV-11/14/17/23/29. Reuse SearchChoice/UnitPicker, tanpa library baru.
4. **Batch D - Barang temuan opname**: F3-04, service+UI+policy+race tests+review gudang. Acuan INV-21/22/29; risiko tertinggi terhadap saldo, jadi batch mandiri. Temuan serialized di luar cakupan draft tidak otomatis dibuat available.

Tidak memberikan janji kalender sebelum spike/race check. Setiap batch reviewable dan dapat rilis sendiri dengan bukti CI yang tepat pada commit kandidat. Jangan menggabungkan koreksi tag massal dengan deploy UI.

## Peta perubahan teknis

- Pindai: `src/app/scan/route.ts`, `src/components/scanner.tsx`, tes scan/QR/proxy dan konfigurasi origin yang diperlukan tanpa menyalin secret.
- Permintaan/feedback: `src/components/forms.tsx`, `src/components/action-feedback.tsx` bila verifikasi membuktikan perlu, route permintaan di catch-all, `src/server/page-data.ts` serta tes data-needs/filter/payload.
- Hitung stok: catch-all, service `src/server/inventory.ts`, action dispatch/validation bila perlu, tests inventory/concurrency + UI. Model Document/Line/Record existing diprioritaskan. Migration hanya bila representasi temuan yang aman membutuhkannya, bukan menambah tabel stok kedua.
- Perawatan: catch-all, service inventory/policy validasi scope, pilihan metadata dan fixture sensor/alat/prototype/produk jadi. Jangan memilih lewat substring nama barang sebagai kebijakan otorisasi.
- Audit/laporan: catch-all, formatter audit kecil server-only bersama, `/api/reports`, `src/server/report-format.ts` sesuai kebutuhan, tes formatter/report/export. Semua caller dan export harus memakai istilah sama.
- Label: `src/components/labels.tsx`, `label-picker.tsx`, parser scan legacy bila alias disetujui; schema/migration/tes alias hanya pada batch data identitas.
- SOP/copy: UI_SPEC, PRINT_SPEC, MASTER_DATA_SPEC dan buku panduan diperbarui hanya bagian terdampak setelah perilaku final; source DOCX tidak ditimpa. STATUS_IMPLEMENTASI.md tetap handoff tunggal.

## Gate rilis dan UAT

Planning tidak menjalankan build/CI karena belum ada kode berubah. Saat implementasi, mulai dari tes gagal untuk bug nyata lalu tes domain/role/retry/race yang relevan; lint/typecheck/build web+worker, PDF dan browser desktop/mobile pada CI bersih. Refresh manual masih harus bekerja pada PWA. Gunakan data latihan, jangan contoh transaksi di database produksi.

Capture cukup satu batch desktop/mobile dan satu konfirmasi setelah koreksi, lalu review sesuai skill. Fokus visual pada hierarchy, satuan/lokasi/kode, keyboard, target 44px, input16, reduced motion, loading/error/empty; pertahankan palette dan logo. Jangan merombak sidecar hanya untuk mengejar advisory lama.

Sebelum aktivasi: backup terenkripsi terverifikasi/off-host, image rollback, migration job tunggal jika ada, dan rekonsiliasi sebelum/sesudah. Produksi tetap berjalan; perubahan data sah selama jeda harus ditelusuri audit, bukan ditimpa agar hash cocok. Smoke lewat domain Cloudflare dan origin, scan dari perangkat nyata, tanpa host internal pada Location. Jangan melepas gate preparation/UAT hanya karena batch UI lulus.

## Keputusan dikonfirmasi dan yang masih terbuka

- Dikonfirmasi pemilik: seluruh menu Perawatan & Kalibrasi hanya sensor/produk jadi; tindakan baru untuk jenis lain ditolak, riwayat tetap. Kalibrasi mengikuti flag unit.
- Dikonfirmasi pemilik: label QR cukup kode/tag dan lokasi, tanpa nama/deskripsi barang atau footer generik. QR tetap memakai identitas stabil.
- Disetujui pemilik pada sesi implementasi: Meteran AK005 menggunakan MTC-AK005-001 dengan alias tag lama. Hanya satu unit teridentifikasi; perubahan data lainnya tidak termasuk persetujuan ini.
- Definisi darurat, pemegang izin dan tenggat review ditetapkan pemilik; tidak mengaktifkan izin baru dalam batch copy.
