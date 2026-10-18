---
version: 1
slug: "src-components-shell-tsx"
primary_target: "src/components/shell.tsx"
related_targets: ["src/app/globals.css", "src/app/tokens.css", "src/components/inventory-visuals.tsx", "src/app/[[...path]]/page.tsx"]
---

# Shell dan alur utama MTC Inventory

Mode: Operate. Instruksi pengguna 18 Oktober 2026 menggantikan gaya visual DOCX. Target aktual menggunakan shared shell dan route catch-all; brief target rencana lama tidak dipindah atau ditulis ulang. Acuan: PRODUCT.md, DESIGN.md, docs/design/REDESIGN_2026_10.md dan UI_SPEC.md. Tim <20 orang, satu gudang/rak; tugas harian konsumsi komponen dan peminjaman alat.

## Direction contract

THESIS: Jadikan pencarian barang dan Ambil komponen / Pinjam alat sebagai pintu kerja harian; tinggalkan susunan administratif padat sebagai pusat perhatian.

OWN-WORLD: Shell putih di canvas dingin, biru MTC, logo asli, Jakarta lokal, sudut lembut dan foto/ikon kategori konsisten. Semua role satu keluarga visual; status tetap bertulisan.

STORY: Pengguna mengenali barang, stok bersatuan dan rak, lalu mengajukan kebutuhan. Persetujuan, penyerahan dan pemeriksaan tetap tahap terpisah dengan service/policy server.

FIRST VIEWPORT: Desktop menampilkan sidebar putih, topbar pencarian/profil dan heading ringkas. Beranda memuat blok navy pencarian dengan dua pintasan, lalu ringkasan pekerjaan. Ponsel menampilkan brand, Semua menu, konten satu kolom dan bottom nav lima tujuan dengan safe-area. Katalog dua kolom visual pada ponsel, nama minimum 14 px.

FORM: Code-led dari referensi pengguna; source key user-redesign-mtc-20261018. Tidak ada seed acak, urutan tournament atau comp baru; jangan menciptakan bukti keputusan. Interaksi khas adalah pintasan komponen/alat yang memilih mode permintaan dan kartu barang yang membawa item ke form.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## States and acceptance

Cari/filter/view memakai URL, seluruh fungsi tetap terjangkau lewat Semua menu/Kelola gudang. Foto fallback berlabel ilustrasi kategori; file foto aktual tetap berpolicy. Input minimum 16 px, kontrol utama 44 px, nama/aksi utama minimum 14 px ponsel; metadata sekunder 11–13 px mengikuti DESIGN.md. Kartu transaksi ponsel mempertahankan label data dan aksi. Mode uji coba tetap dapat dibuka. `/admin/requests/new` berbagi service permintaan; mode quantity/serialized dan item hanya prefill, tanpa auto-posting atau self-approval.

Bukti render redesign lokal ada pada `.impeccable/review/redesign/`; hasil build dan review dicatat oleh batch di STATUS_IMPLEMENTASI.md. Dokumentasi token tersinkron dengan source. Tidak ada comp baru atau raster ilustrasi referensi yang dikirim sebagai aset aplikasi. Gate data fisik, perangkat, seluruh UAT dan cutover tetap membutuhkan bukti tersendiri.
