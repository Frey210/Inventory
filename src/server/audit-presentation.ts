import { db } from "./db";
import { describeAudit } from "@/lib/audit-description";
export async function presentAudits(
  rows: {
    actorId: string;
    action: string;
    entityId: string;
    payload: unknown;
  }[],
) {
  const references = (value: unknown): string[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const p = value as Record<string, unknown>;
    return [p, p.before, p.after].flatMap((v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.entries(v)
            .filter(
              ([key, value]) =>
                [
                  "locationId",
                  "sourceId",
                  "targetId",
                  "typeId",
                  "unitId",
                  "categoryId",
                  "itemId",
                  "assetId",
                  "projectId",
                ].includes(key) && typeof value === "string",
            )
            .map(([, v]) => String(v))
        : [],
    );
  };
  const ids = [
    ...new Set(
      rows.flatMap((r) => [r.actorId, r.entityId, ...references(r.payload)]),
    ),
  ];
  const [users, items, assets, documents, masters, records, loans] =
    await Promise.all([
      db.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, role: true },
      }),
      db.item.findMany({
        where: { id: { in: ids } },
        select: { id: true, sku: true, name: true },
      }),
      db.asset.findMany({
        where: { id: { in: ids } },
        select: { id: true, tag: true },
      }),
      db.document.findMany({
        where: { id: { in: ids } },
        select: { id: true, number: true },
      }),
      db.master.findMany({
        where: { id: { in: ids } },
        select: { id: true, code: true, name: true },
      }),
      db.record.findMany({
        where: { id: { in: ids } },
        select: { id: true, kind: true },
      }),
      db.loan.findMany({
        where: { id: { in: ids } },
        select: { id: true, number: true },
      }),
    ]);
  const names = new Map<string, string>([
    ...items.map((x) => [x.id, x.sku + " - " + x.name] as const),
    ...assets.map((x) => [x.id, x.tag] as const),
    ...documents.map((x) => [x.id, x.number] as const),
    ...loans.map((x) => [x.id, x.number] as const),
    ...masters.map((x) => [x.id, x.code + " - " + x.name] as const),
    ...records.map((x) => [x.id, "Catatan aktivitas"] as const),
    ...users.map((x) => [x.id, x.name] as const),
  ]);
  return rows.map((row) => ({
    ...describeAudit(
      row.action,
      row.payload,
      (id) => names.get(id) || "Referensi " + id,
    ),
    actor: (() => {
      const user = users.find((u) => u.id === row.actorId);
      return user
        ? user.name +
            " (" +
            (
              {
                ADMIN: "Admin",
                WAREHOUSE: "Gudang",
                TECHNICIAN: "Teknisi",
                AUDITOR: "Auditor",
              } as Record<string, string>
            )[user.role] +
            ")"
        : "Pengguna tidak ditemukan";
    })(),
    object:
      names.get(row.entityId) ||
      (
        {
          stock: "Stok",
          audit: "Riwayat aktivitas",
          assets: "Unit alat",
          loans: "Pinjaman",
          reservations: "Reservasi",
          "inventory-labels": "Label QR",
        } as Record<string, string>
      )[row.entityId] ||
      "Referensi " + row.entityId,
  }));
}
