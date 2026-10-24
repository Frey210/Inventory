# Kontrak nota terpadu dan keluaran cetak

Baseline dari Template_Nota_Terintegrasi_Peminjaman_Pengembalian_MTC.docx serta Lampiran A revisi 1.1. Dokumen ini menetapkan implementasi PDF, bukan mengesahkan format QMS. Lihat placeholder asli dalam PRINT_FIELDS.json; nama placeholder dipertahankan untuk ketertelusuran, meskipun nama field internal boleh berbeda.

## Identitas dan halaman

- Perusahaan: PT MEDIA TEKNOLOGI CELEBES.
- Judul mengikuti template spesifik: **BUKTI SERAH TERIMA PEMINJAMAN DAN PENGEMBALIAN BARANG**. Lampiran utama memakai judul singkat “Bukti Peminjaman dan Pengembalian Alat”; template khusus menjadi acuan judul baseline. Perubahan judul final memerlukan keputusan QMS.
- Nama aplikasi MTC Inventory dicantumkan pada identitas aplikasi/metadata, tanpa mengubah nama perusahaan.
- Satu nomor LOAN tetap di semua halaman, event dan versi. Return memakai event ID terpisah, bukan nota induk baru.
- Kode/revisi formulir dan versi snapshot adalah tiga konsep berbeda. FR-INV-01 hanya usulan; jangan menampilkannya sebagai nomor resmi yang disahkan.

Ukuran halaman template dari OOXML: **Letter portrait, 215,9 × 279,4 mm** (12240 × 15840 twip), bukan A4. Margin atas sekitar 14,73 mm, kanan/kiri 17,27 mm, bawah 13,97 mm. Baseline PDF mempertahankan ukuran/margin ini. Jika printer perusahaan membutuhkan A4, keputusan perubahan dicatat dan layout diuji; jangan mengubah diam-diam.

Normal style template memakai Aptos 9 pt dan warna teks #263648. Baseline PDF memakai Arial 9 pt (diizinkan rancangan web dan lebih mudah dipaketkan), line-height 1,35; judul 13 pt bold, nama perusahaan 10 pt bold, heading bagian 10 pt bold navy. Ini substitusi engineering yang disengaja, bukan klaim identik pixel. Jangan mendistribusikan Aptos tanpa memastikan hak/font tersedia. Footer metadata minimum 8 pt.

Latar putih, garis tabel tipis, header tabel terang, tanpa sidebar/navigation/app buttons. Cetak tetap dapat dipahami grayscale. Bagian A–D di tahap awal, page break sebelum E; identitas perusahaan, judul dan kontrol dokumen diulang pada halaman tahap kembali seperti template. Tabel dapat berlanjut ke banyak halaman dengan header kolom berulang; hindari memotong satu baris unit. Header/footer lanjutan memuat LOAN, versi dan nomor halaman. Jangan mengecilkan font agar semua data masuk dua halaman.

## Bagian dan mapping data

| Bagian | Isi | Sumber rekaman |
|---|---|---|
| Header kontrol | kode/revisi, LOAN, tanggal cetak, status, versi snapshot | snapshot metadata + audit ekspor |
| A Identitas Peminjaman | peminjam/ID/unit kerja/proyek/keperluan/lokasi penggunaan, tanggal pinjam/rencana kembali | snapshot checkout; tidak join nama master terkini |
| B Daftar Barang dan Kondisi Awal | nomor, kode/SKU, nama/serial, qty+satuan, kondisi/kelengkapan awal | loan lines snapshot; serialized satu unit per baris |
| C Otorisasi dan Serah Terima Peminjaman | approver/waktu, petugas/waktu checkout, penerima/metode konfirmasi | approval + handover snapshot |
| D Status dan Referensi Bukti | status loan, outstanding, referensi foto awal, QR | state pada waktu snapshot + immutable file references |
| E Riwayat Pengembalian | timestamp/event ID, unit, qty+satuan, kondisi akhir, hasil verifikasi; ulang per event | return/receipt/inspection events sampai cutoff snapshot |
| F Hasil Pemeriksaan dan Penyelesaian | pemeriksa/waktu/pengembali/metode, status/outstanding, tiket/bukti/catatan | event inspeksi dan penutupan/exception |
| G Validasi Rekaman Digital | aktor/waktu approval, checkout, verifikasi terakhir, kode verifikasi dan nomor versi | audit/handover/inspection/snapshot metadata |

Template E berulang untuk setiap kejadian; F/G merangkum pemeriksaan terakhir serta penutupan. Detail siapa memeriksa tiap unit tetap ada pada event/rujukan, tidak diganti satu nama terakhir tanpa konteks. Tampilkan outstanding fisik dan menunggu inspeksi sebagai angka terpisah pada rekap tambahan bila diperlukan. Jangan menyamakan seluruh “kembali” dengan “diterima layak”. Unit rusak yang diterima fisik termasuk kembali fisik tetapi tetap blocked.

## Tahap dan data kosong

| Tahap | Perilaku |
|---|---|
| Checkout awal | A–D lengkap; E “Belum ada pengembalian”; field pemeriksaan F/G “Belum diverifikasi”; status aktif, outstanding sesuai checkout |
| Partial return | A–C tetap snapshot awal; E menambahkan event; D/F/G mengikuti cutoff baru; outstanding tidak nol bila ada unit belum kembali |
| Menunggu inspeksi | Jelaskan fisik sudah diterima tetapi verifikasi belum selesai; jangan mencetak semua layak/tersedia |
| Selesai | Seluruh kewajiban ditangani; kondisi akhir/tiket ditampilkan; unit rusak dapat tetap blocked |
| Exception | “Ditutup dengan Pengecualian”, keputusan/aktor/alasan/insiden; tidak membuat pengembalian/ttd fiktif |
| Koreksi | Versi baru dengan rujukan event koreksi dan alasan; versi checkout dan versi lama tetap diarsipkan |

Tidak mengisi tanda tangan, nama pemeriksa, waktu, nomor dokumen resmi atau hasil inspeksi yang belum ada. Acknowledgement akun/timestamp ditulis sebagai metode konfirmasi, bukan tanda tangan elektronik tersertifikasi.

## Snapshot, render dan arsip

Snapshot mencakup template revision, cutoff event, payload beku, versi unik, actor/time pembuat, checksum file dan storage key. Pengguna memilih **Bukti Awal** atau **Versi Terbaru** dan dapat melihat versi lain sesuai policy. Arsip lama diunduh apa adanya; jangan merender ulang dari master terkini.

Tanggal penerbitan yang tercetak milik snapshot; setiap download ulang mempunyai audit waktu/aktor terpisah dan tidak mengubah hash arsip. Jika kebijakan mengharuskan timestamp/actor cetak baru di PDF, buat ekspor/version metadata baru secara eksplisit, bukan menimpa file lama. Pengubahan nama master tidak memengaruhi PDF awal.

Worker merender HTML yang dikendalikan aplikasi, men-escape semua nama/catatan dan tidak membuka URL bebas. Foto dilayani dari storage tepercaya; tidak mengirim session pengguna ke URL eksternal. QR berisi identifier/URL verifikasi internal yang memerlukan login/policy, tanpa password/token permanen/PII lengkap. Kode verifikasi/checksum bukan sertifikasi dokumen.

Pending/failed render tidak membatalkan loan committed. Gunakan retry berizin pada snapshot yang sama; file final dipublikasikan atomik dan arsip ready tidak ditimpa tanpa jejak. Audit ekspor/download memuat actor, snapshot/version, waktu dan hasil; log tidak memuat credential.

## Ketentuan template

Teks pernyataan serah terima dan ketentuan digital pada template dipertahankan maknanya. Catatan untuk pengembang seperti “Baris tabel diulang otomatis”/instruksi placeholder tidak dicetak pada dokumen operasional. Pernyataan “format rancangan, belum disahkan” berlaku selama QMS belum menyetujui; dokumen simulasi diberi tanda **DATA SIMULASI — BELUM UNTUK OPERASIONAL**. Setelah pengesahan, status formulir/revisi mengikuti konfigurasi yang diaudit, bukan flag hardcoded.

Jangan mengartikan placeholder {{...}} sebagai kewajiban menghasilkan DOCX editable. PDF wajib V1; ekspor DOCX menunggu konfirmasi QMS seperti rencana utama.

## Acceptance cetak

Revisi feedback 25 Oktober 2026: nota versi baru menampilkan lokasi penggunaan yang dibekukan pada snapshot, baik referensi master maupun teks bebas. `dueDateOnly` menyembunyikan jam untuk kontrak tanggal baru; pinjaman/snapshot lama tetap memakai deadline jam dan PDF tersimpan tidak ditulis ulang. Label resmi memakai payload `MTC:ITEM:<id>` atau `MTC:ASSET:<id>` dari database aplikasi; kode SKU/tag tercetak sebagai teks. Cetak ulang mempertahankan identitas. Label lama raw tag/SKU masih dapat dibaca resolver. Ukuran kertas/camera fisik tetap membutuhkan UAT.

Uji satu unit, 30+ baris, nama/serial panjang, beberapa return event, kondisi bermasalah, foto gagal, signature belum ada, partial return+inspection, final/exception, dan koreksi versi. Verifikasi Letter, header tabel berulang, page break E, nomor halaman/LOAN/versi, karakter Indonesia, tabel tidak terpotong dan QR terbaca pada kertas. Cetak grayscale dan bandingkan dengan template sumber. UAT-11–16 dan akses file/audit harus lulus. Belum ada PDF hasil render yang diverifikasi pada tahap penyiapan spesifikasi ini.
