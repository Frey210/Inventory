const actions: Record<string, string> = {
  ASSET_RETAGGED: "Kode unit diperbarui",
  ITEM_SAVED: "Katalog barang diperbarui",
  MASTER_SAVED: "Master data diperbarui",
  REPORT_EXPORTED: "Laporan diunduh",
  LABEL_EXPORTED: "Label QR disiapkan",
  STOCKTAKE_OPEN: "Hitung stok dimulai",
  STOCKTAKE_ITEM_ADDED: "Barang temuan ditambahkan",
  STOCKTAKE_FINDING: "Temuan unit dicatat",
  COUNT_STOCKTAKE: "Hasil hitung diajukan",
  "COUNT-STOCKTAKE": "Hasil hitung diajukan",
  "POST-STOCKTAKE": "Penyesuaian stok diposting",
  "CANCEL-STOCKTAKE": "Hitung stok dibatalkan",
  REQUEST_CREATED: "Permintaan diajukan",
  "REVISE-REQUEST_CREATED": "Permintaan direvisi",
  RECEIPT_CREATED: "Penerimaan dibuat",
  "POST-RECEIPT": "Barang masuk diposting",
  APPROVE: "Permintaan disetujui",
  "EMERGENCY-APPROVE": "Persetujuan darurat dicatat",
  ISSUE: "Komponen diserahkan",
  CHECKOUT: "Alat dipinjamkan",
  ACKNOWLEDGE: "Penerimaan diakui",
  REJECT: "Permintaan ditolak",
  CANCEL: "Transaksi dibatalkan",
  RETURN_REQUESTED: "Pengembalian diajukan",
  RETURN_RECEIVED: "Pengembalian diterima",
  "REQUEST-RETURN": "Pengembalian diajukan",
  "RECEIVE-RETURN": "Alat diterima",
  INSPECT: "Hasil pemeriksaan dicatat",
  TRANSFER: "Barang dipindahkan",
  MAINTENANCE: "Perawatan atau kalibrasi dicatat",
  INCIDENT: "Masalah dilaporkan",
  OVERRIDE_REVIEWED: "Persetujuan darurat ditinjau",
  USER_ACCESS: "Akses pengguna diperbarui",
  "USER-CREATE": "Akun dibuat",
  "USER-RESET": "Password direset",
  PASSWORD_CHANGED: "Password diubah",
  SETTINGS_UPDATED: "Pengaturan diperbarui",
  PDF_RETRY: "Pembuatan nota diulang",
  OPENING_DRY_RUN: "Saldo pembukaan divalidasi",
};
const fields: Record<string, string> = {
  tag: "Tag unit",
  name: "Nama",
  sku: "Kode barang",
  code: "Kode",
  minStock: "Stok minimum",
  active: "Aktif",
  role: "Peran",
  emergencyIssue: "Izin persetujuan darurat",
  description: "Keterangan",
  quantity: "Jumlah",
  reason: "Alasan",
  reviewReason: "Hasil tinjauan",
  method: "Metode",
  result: "Hasil",
  validUntil: "Berlaku sampai",
  pickupHours: "Batas waktu pengambilan (jam)",
  timezone: "Zona waktu",
};
const values: Record<string, string> = {
  true: "Ya",
  false: "Tidak",
  pass: "Lulus",
  fail: "Gagal",
  blocked: "Diblokir",
  installed: "Terpasang",
  ADMIN: "Admin",
  WAREHOUSE: "Petugas gudang",
  TECHNICIAN: "Teknisi",
  AUDITOR: "Auditor",
  stock: "Stok",
  audit: "Riwayat aktivitas",
  assets: "Unit alat",
  loans: "Pinjaman",
  reservations: "Reservasi",
  waste: "Waste",
  stocktakes: "Hitung stok",
  projects: "Proyek",
};
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const text = (v: unknown) =>
  v == null
    ? "Belum diisi"
    : typeof v === "string" || typeof v === "number" || typeof v === "boolean"
      ? values[String(v)] || String(v).slice(0, 1000)
      : "Data terstruktur";
export function describeAudit(
  action: string,
  payload: unknown,
  resolve: (id: string) => string = (id) => "Referensi " + id,
) {
  const p = object(payload),
    before = object(p.before),
    after = object(p.after);
  const details: string[] = [];
  for (const [key, label] of Object.entries(fields)) {
    if (
      key in after &&
      JSON.stringify(before[key]) !== JSON.stringify(after[key])
    )
      details.push(
        `${label}: ${text(before[key])} menjadi ${text(after[key])}`,
      );
    else if (key in p) details.push(`${label}: ${text(p[key])}`);
  }
  for (const [key, label] of Object.entries({
    locationId: "Lokasi",
    sourceId: "Lokasi asal",
    targetId: "Lokasi tujuan",
    typeId: "Jenis barang",
    unitId: "Satuan",
    categoryId: "Kategori",
    itemId: "Barang",
    assetId: "Unit",
    projectId: "Proyek",
  })) {
    const name = (v: unknown) =>
      typeof v === "string" && v ? resolve(v) : "Belum diisi";
    if (key in after && before[key] !== after[key])
      details.push(
        `${label}: ${name(before[key])} menjadi ${name(after[key])}`,
      );
    else if (key in p) details.push(`${label}: ${name(p[key])}`);
  }
  if (action === "REPORT_EXPORTED") {
    const f = object(p.filters);
    details.push(`Laporan ${text(f.type)}; ${text(p.rows)} baris`);
    if (f.from || f.to)
      details.push(`Periode: ${text(f.from)} sampai ${text(f.to)}`);
  }
  if (action === "LABEL_EXPORTED" && Array.isArray(p.ids))
    details.push(`${p.ids.length} label`);
  return {
    action: actions[action] || "Aktivitas sistem",
    details,
    summary:
      details.join("; ") ||
      "Tindakan tercatat. Rincian tambahan tidak ditampilkan.",
    reference: action,
  };
}
