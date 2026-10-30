# Perbaikan feedback kedua

Sumber: perbaikan_2.docx, dua catatan dan screenshot pengguna, 31 Oktober 2026. Ini perluasan UI incumbent; DESIGN.md serta aturan transaksi tetap berlaku.

## Konfirmasi tindakan

Masalah: konfirmasi hanya berada di atas form sehingga mudah terlewat setelah pengguna mengisi form panjang dan menekan tombol di bawah.

- Setiap keberhasilan ActionForm yang telah dikonfirmasi server memunculkan satu notifikasi viewport dengan ikon sukses, judul, pesan server dan tombol tutup. Tidak ada sukses optimistis atau dialog pemblokir.
- Notifikasi tampil delapan detik; hover atau fokus menghentikan timer, lalu memberi waktu membaca lagi ketika interaksi berakhir. Aksi berikutnya mengganti notifikasi sebelumnya. Pesan sukses identik juga dapat ditampilkan ulang.
- Satu polite live region mengumumkan keberhasilan, tanpa mengambil fokus. Catatan sukses inline tetap ada, termasuk link review draft penerimaan; tidak menjadi live region kedua.
- Error tetap tampil dan menerima fokus pada form. Kegagalan tidak meninggalkan notifikasi sukses aksi sebelumnya. Toast tidak masuk hasil cetak.
- Posisi responsif memperhitungkan header dan safe area. Tombol tutup minimal 44 px; animasi masuk dinonaktifkan pada reduced motion. Tidak menambah dependency.

## Pengajuan pengembalian alat

Masalah: teks tag dan kata Pengembalian terlihat seperti status, sehingga teknisi sulit mengenali kontrol yang dapat dibuka.

- Bagian teknisi berjudul Pengembalian alat, disertai penjelasan bahwa gudang tetap menerima fisik dan memeriksa alat.
- Setiap unit memakai disclosure biru dengan ikon, kata kerja Ajukan pengembalian, tag unit dan chevron buka/tutup. Seluruh summary menjadi target sentuh dan dapat dibuka lewat keyboard.
- Kondisi, catatan, foto dan tombol konfirmasi tetap pada form existing. Label gudang membedakan Terima fisik alat dan Isi hasil pemeriksaan.
- Tidak mengubah policy pemilik/petugas, status loan, snapshot, ledger, idempotency maupun kapan alat menjadi tersedia.

## Bukti penerimaan

Tes browser harus mencakup konfirmasi saat scroll, dismiss, pengulangan sukses, timer/pause, error dan fokus, kontrol pengembalian keyboard, lebar 320-1440 serta asset masih borrowed dan LoanLine belum diterima/diperiksa sesudah pengajuan. Screenshot desktop/mobile wajib memperlihatkan kontrol tertutup dan form terbuka. Pengujian dan deployment dicatat di STATUS_IMPLEMENTASI.md; tidak dianggap UAT perangkat fisik.
