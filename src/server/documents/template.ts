type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};
const list = (v: unknown): Obj[] => (Array.isArray(v) ? v.map(obj) : []);
export const escape = (v: unknown) =>
  String(v ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
export function loanHtml(
  data: unknown,
  version: number,
  qr: string,
  photos: Record<string, string> = {},
) {
  const loan = obj(data),
    initial = obj(loan.snapshot),
    borrower = obj(initial.borrower),
    request = obj(initial.request),
    handover = obj(initial.handover),
    units = list(initial.units),
    items = list(initial.items),
    lines = list(loan.lines),
    events = list(loan.events);
  const photoIds = [
    ...new Set(
      events
        .map((e) => obj(e.payload).photoId)
        .filter((v): v is string => typeof v === "string" && !!v),
    ),
  ];
  const date = (value: unknown) =>
    value
      ? new Intl.DateTimeFormat("id-ID", {
          timeZone: String(obj(initial.settings).timezone || "Asia/Makassar"),
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(String(value)))
      : "Belum diverifikasi";
  const statuses: Record<string, string> = {
    active: "Aktif",
    completed: "Selesai",
    closed_with_exception: "Ditutup dengan Pengecualian",
  };
  const eventNames: Record<string, string> = {
    "request-return": "Pengajuan kembali",
    "receive-return": "Penerimaan fisik",
    inspect: "Pemeriksaan",
    "correct-loan": "Koreksi historis",
    "close-exception": "Penutupan pengecualian",
  };
  const table = (heads: string[], rows: unknown[][], className = "") =>
    '<table class="' +
    className +
    '"><thead><tr>' +
    heads.map((h) => "<th>" + escape(h) + "</th>").join("") +
    "</tr></thead><tbody>" +
    rows
      .map(
        (r) =>
          "<tr>" +
          r.map((c) => "<td>" + escape(c) + "</td>").join("") +
          "</tr>",
      )
      .join("") +
    "</tbody></table>";
  const header =
    "<header><strong>PT MEDIA TEKNOLOGI CELEBES · MTC Inventory</strong><h1>BUKTI SERAH TERIMA PEMINJAMAN DAN PENGEMBALIAN BARANG</h1><p>DATA SIMULASI / PERSIAPAN — BELUM UNTUK OPERASIONAL</p>" +
    table(
      ["Kode formulir", "Revisi", "Nomor transaksi", "Versi bukti"],
      [
        [
          obj(initial.settings).formCode || "Belum disahkan",
          obj(initial.settings).formRevision || "Draft",
          loan.number,
          version,
        ],
      ],
    ) +
    "</header>";
  return (
    '<!doctype html><html lang="id"><meta charset="utf-8"><title>' +
    escape(loan.number) +
    "</title><style>@page{size:Letter;margin:14.73mm 17.27mm 13.97mm}body{font:9pt Arial,sans-serif;color:#263648;line-height:1.35}.items th:first-child,.items td:first-child{min-width:22pt;white-space:nowrap;overflow-wrap:normal}.items th:nth-child(4),.items td:nth-child(4){min-width:35pt;white-space:nowrap;overflow-wrap:normal}.status-qr{display:grid;grid-template-columns:1fr 75pt;gap:8pt;align-items:start}.status-qr table{margin-top:0}h1{font-size:13pt;color:#0b2e59}h2{font-size:10pt;color:#0b2e59;margin-top:18pt;break-after:avoid}table{width:100%;border-collapse:collapse;margin:8pt 0}th,td{border:1px solid #c3cddd;padding:5pt;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#edf2f7}thead{display:table-header-group}tr{break-inside:avoid}section.return{break-before:page}.validation{break-inside:avoid}img{width:70pt;height:70pt}footer{font-size:8pt}</style><body>" +
    header +
    "<h2>A. IDENTITAS PEMINJAMAN</h2>" +
    table(
      [
        "Peminjam / ID",
        "Proyek",
        "Keperluan / Lokasi penggunaan",
        "Tanggal pinjam",
        "Rencana kembali",
      ],
      [
        [
          borrower.name,
          obj(initial.project).name || request.projectId,
          String(request.purpose || "") +
            " / " +
            (obj(initial.usageLocation).name || "Belum dicatat"),
          date(loan.createdAt),
          date(loan.dueAt),
        ],
      ],
    ) +
    "<h2>B. DAFTAR BARANG DAN KONDISI AWAL</h2>" +
    table(
      [
        "No",
        "Kode aset / SKU",
        "Barang / identitas",
        "Qty",
        "Kondisi / kelengkapan",
      ],
      units.map((u, i) => [
        i + 1,
        u.tag,
        items.find((x) => x.id === u.itemId)?.name + " / " + (u.serial || "—"),
        "1 unit",
        String(u.condition) + (u.completeness ? "; " + u.completeness : ""),
      ]),
      "items",
    ) +
    "<h2>C. OTORISASI DAN SERAH TERIMA PEMINJAMAN</h2>" +
    table(
      [
        "Persetujuan / Waktu",
        "Petugas / Waktu checkout",
        "Penerima / Waktu konfirmasi",
      ],
      [
        [
          String(
            obj(initial.approver).name ||
              request.approverId ||
              "Belum diverifikasi",
          ) +
            " / " +
            date(obj(initial.approval).createdAt),
          String(handover.name || "") + " / " + date(loan.createdAt),
          String(borrower.name || "") + " / " + date(request.acknowledgedAt),
        ],
      ],
    ) +
    '<p>Kondisi dan kelengkapan diverifikasi petugas. Penerima mengakui melalui akun dan timestamp (baseline pilot).</p><section class="validation"><h2>D. STATUS DAN REFERENSI BUKTI</h2><div class="status-qr">' +
    table(
      ["Status", "Sisa belum kembali", "Menunggu pemeriksaan"],
      [
        [
          statuses[String(loan.status)] || loan.status,
          lines.filter((l) => !l.receivedAt).length,
          lines.filter((l) => l.receivedAt && !l.inspectedAt).length,
        ],
      ],
    ) +
    '<img alt="QR verifikasi internal" src="' +
    qr +
    '"></div></section>' +
    '<section class="return">' +
    header +
    "<h2>E. RIWAYAT PENGEMBALIAN BARANG</h2>" +
    (events.filter((e) => e.type !== "checkout").length
      ? table(
          ["Tanggal", "Tindakan / Aktor", "Unit / Kondisi / Catatan"],
          events
            .filter((e) => e.type !== "checkout")
            .map((e) => [
              date(e.createdAt),
              (eventNames[String(e.type)] || e.type) +
                " / " +
                (e.actorName || e.actorId),
              ((obj(e.payload).assetIds as string[] | undefined) || [])
                .map((id) => units.find((u) => u.id === id)?.tag || id)
                .join(", ") +
                "; " +
                String(obj(e.payload).condition || "") +
                "; " +
                String(obj(e.payload).reason || "Tidak ada catatan tambahan"),
            ]),
        )
      : "<p>Belum ada pengembalian</p>") +
    (photoIds.length
      ? "<h3>Bukti Foto Kejadian</h3>" +
        photoIds
          .map(
            (id) =>
              '<figure style="break-inside:avoid">' +
              (photos[id]
                ? '<img style="width:140pt;height:100pt;object-fit:contain" alt="Bukti kondisi" src="' +
                  photos[id] +
                  '">'
                : "<p>Foto tidak dapat dimuat; referensi tetap tersimpan.</p>") +
              "<figcaption>File " +
              escape(id) +
              "</figcaption></figure>",
          )
          .join("")
      : "") +
    "<h2>F. HASIL PEMERIKSAAN DAN PENYELESAIAN</h2>" +
    table(
      ["Unit", "Diterima fisik", "Verifikasi", "Hasil"],
      lines.map((l) => [
        units.find((u) => u.id === l.assetId)?.tag,
        l.receivedAt ? date(l.receivedAt) : "Belum diterima",
        date(l.inspectedAt),
        l.inspection
          ? String(obj(l.inspection).condition) +
            "; " +
            String(obj(l.inspection).reason || "Tidak ada catatan tambahan")
          : "Belum diverifikasi",
      ]),
    ) +
    '<p>Barang kembali belum otomatis Tersedia. Barang bermasalah diblokir dan ditindaklanjuti.</p><section class="validation"><h2>G. VALIDASI REKAMAN DIGITAL</h2>' +
    table(
      ["Nomor LOAN", "Versi", "Status", "Referensi"],
      [
        [
          loan.number,
          version,
          statuses[String(loan.status)] || loan.status,
          String(loan.verificationCode || loan.id) +
            " / cutoff " +
            date(loan.cutoffAt),
        ],
      ],
    ) +
    "<footer>Format rancangan belum disahkan QMS. Bukti awal dan seluruh versi perubahan disimpan. Akses arsip memerlukan autentikasi dan dicatat dalam audit.</footer></section></section></body></html>"
  );
}
