---
version: 1
slug: controls-navigation
primary_target: "src/components/back-navigation.tsx"
related_targets: ["src/components/unit-picker.tsx", "src/components/forms.tsx", "src/components/data.tsx", "src/components/shell.tsx", "src/components/scanner.tsx", "src/app/operations.css", "src/app/tokens.css"]
---

# Kontrol dan navigasi

Mode Operate, code-led refinement incumbent. Sumber: empat screenshot penolakan pengguna 31 Oktober 2026; PRODUCT.md, DESIGN.md dan docs/design/CONTROLS_NAVIGATION_SPEC.md. Tidak ada comp/seed baru.

THESIS: Tindakan terbaca sebagai tindakan, pilihan unit nyaman disentuh, dan pengguna PWA selalu dapat kembali dari halaman kerja.
OWN-WORLD: Logo/biru MTC, Jakarta, canvas dingin dan permukaan putih dipertahankan. Penyesuaian token control-border untuk kontras input termasuk scope; tidak merombak sidecar atau arah visual lain.
FIRST VIEWPORT: Kembali tersedia di chrome mobile/desktop sesuai konteks; ikon dan hierarki aksi jelas, scan/lokasi bukan tautan samar.
STORY: Cari barang, baca stok bersatuan, lakukan tindakan, kembali dengan konteks. Pilih unit sesuai rak; jumlah mengikuti unit tanpa Ctrl/Shift.
FORM: Native controls dan Lucide existing, shared component improvements; tidak menambah library atau mengganti workflow server. Header mobile tetap terlihat saat scroll dan tidak tertutup toast.
FINISH: Capture desktop/mobile katalog, detail, transfer, serta sampel halaman/form lain. Uji keyboard, filter/Back/forward, deep link aman, readonly/disabled/loading, pilihan unit dan posting. Review baru memakai screenshot pengguna, bukan approval lama sebagai bukti. Sinkronkan hanya token control-border pada sistem desain setelah diverifikasi; drift lain tetap di luar scope.
