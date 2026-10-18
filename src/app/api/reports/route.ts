import { readyUser } from "@/server/policy";
import { db } from "@/server/db";
import { getSettings } from "@/server/settings";
import {
  csvReport,
  spreadsheetSafe,
  printReport,
} from "@/server/report-format";
import ExcelJS from "exceljs";
import { z } from "zod";
export async function GET(request: Request) {
  const user = await readyUser();
  if (!user || !["ADMIN", "WAREHOUSE", "AUDITOR"].includes(user.role))
    return new Response("Forbidden", { status: 403 });
  const date = z
    .string()
    .refine(
      (v) =>
        !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v))),
    )
    .default("");
  const parsed = z
    .object({
      type: z
        .enum([
          "stock",
          "assets",
          "loans",
          "waste",
          "reservations",
          "stocktakes",
          "audit",
          "projects",
        ])
        .default("stock"),
      format: z.enum(["xlsx", "csv", "print"]).default("xlsx"),
      location: z.string().max(128).default(""),
      project: z.string().max(128).default(""),
      from: date,
      to: date,
    })
    .safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success)
    return new Response("Filter laporan tidak valid.", { status: 400 });
  const p = parsed.data;
  if (p.from && p.to && p.from > p.to)
    return new Response("Rentang tanggal tidak valid.", { status: 400 });
  const settings = await getSettings();
  const formatDate = (v: Date | null) =>
    v
      ? new Intl.DateTimeFormat("id-ID", {
          timeZone: String(settings.timezone),
          dateStyle: "medium",
          timeStyle: "short",
        }).format(v)
      : "—";
  const [masters, users] = await Promise.all([
    db.master.findMany(),
    db.user.findMany({ select: { id: true, name: true } }),
  ]);
  const name = (id: string | null) =>
    masters.find((m) => m.id === id)?.name ||
    users.find((u) => u.id === id)?.name ||
    id ||
    "—";
  const offset =
    String(settings.timezone) === "Asia/Jakarta" ? "+07:00" : "+08:00";
  const createdAt =
    p.from || p.to
      ? {
          ...(p.from ? { gte: new Date(`${p.from}T00:00:00${offset}`) } : {}),
          ...(p.to
            ? {
                lt: new Date(
                  new Date(`${p.to}T00:00:00${offset}`).getTime() + 86400000,
                ),
              }
            : {}),
        }
      : undefined;
  let rows: string[][];
  let count = 0;
  if (p.type === "stock") {
    const data = await db.balance.findMany({
      where: p.location ? { locationId: p.location } : {},
      include: { item: true },
      take: 5001,
      orderBy: { itemId: "asc" },
    });
    count = data.length;
    rows = [
      [
        "SKU",
        "Nama",
        "Lokasi",
        "Fisik Layak",
        "Direservasi",
        "Tersedia",
        "Satuan",
      ],
      ...data.map((r) => [
        r.item.sku,
        r.item.name,
        name(r.locationId),
        r.onHand.toString(),
        r.reserved.toString(),
        r.onHand.sub(r.reserved).toString(),
        name(r.item.unitId),
      ]),
    ];
  } else if (p.type === "assets") {
    const data = await db.asset.findMany({
      where: p.location ? { locationId: p.location } : {},
      include: { item: true },
      take: 5001,
      orderBy: { tag: "asc" },
    });
    count = data.length;
    rows = [
      [
        "Tag",
        "Serial",
        "SKU",
        "Barang",
        "Lokasi",
        "Kondisi",
        "Teknis",
        "Ketersediaan",
        "Kalibrasi Berlaku",
        "Custody",
      ],
      ...data.map((a) => [
        a.tag,
        a.serial || "—",
        a.item.sku,
        a.item.name,
        name(a.locationId),
        a.condition,
        a.technical,
        a.availability,
        formatDate(a.validUntil),
        name(a.custodianId),
      ]),
    ];
  } else if (p.type === "loans") {
    const located = p.location
      ? await db.asset.findMany({
          where: { locationId: p.location },
          select: { id: true },
        })
      : null;
    const data = await db.loan.findMany({
      where: {
        ...(p.project ? { projectId: p.project } : {}),
        ...(located
          ? { lines: { some: { assetId: { in: located.map((a) => a.id) } } } }
          : {}),
        createdAt,
      },
      include: { lines: true },
      take: 5001,
      orderBy: { createdAt: "desc" },
    });
    count = data.length;
    rows = [
      [
        "LOAN",
        "Peminjam",
        "Proyek",
        "Status",
        "Jatuh Tempo",
        "Belum Kembali",
        "Menunggu Inspeksi",
        "Overdue",
      ],
      ...data.map((l) => [
        l.number,
        name(l.borrowerId),
        name(l.projectId),
        l.status,
        formatDate(l.dueAt),
        String(l.lines.filter((x) => !x.receivedAt).length),
        String(l.lines.filter((x) => x.receivedAt && !x.inspectedAt).length),
        l.status === "active" &&
        l.dueAt < new Date() &&
        l.lines.some((x) => !x.receivedAt)
          ? "Ya"
          : "Tidak",
      ]),
    ];
  } else if (p.type === "audit") {
    const data = await db.audit.findMany({
      where: { createdAt },
      take: 5001,
      orderBy: { createdAt: "desc" },
    });
    count = data.length;
    rows = [
      ["Waktu", "Aktor", "Aksi", "Objek", "Rekaman"],
      ...data.map((a) => [
        formatDate(a.createdAt),
        name(a.actorId),
        a.action,
        a.entityId,
        JSON.stringify(a.payload),
      ]),
    ];
  } else {
    const data = await db.document.findMany({
      where: {
        kind: p.type === "stocktakes" ? "stocktake" : "request",
        ...(p.type === "reservations" ? { status: "approved" } : {}),
        ...(p.project ? { projectId: p.project } : {}),
        createdAt,
      },
      include: { lines: true },
      take: 5001,
      orderBy: { createdAt: "desc" },
    });
    count = data.length;
    const items = await db.item.findMany();
    rows = [
      [
        "Dokumen",
        "Tanggal",
        "Proyek",
        "Pemohon",
        "Status",
        "SKU",
        "Lokasi",
        "Disetujui",
        "Diserahkan",
        "Sisa Diterima",
        "Waste",
        "Pemakaian Bersih",
        "Satuan",
        "Opname Sistem/Hitung",
      ],
      ...data.flatMap((d) =>
        d.lines
          .filter(
            (l) =>
              (!p.location || l.locationId === p.location) &&
              (p.type !== "waste" || l.waste.gt(0)),
          )
          .map((l) => {
            const item = items.find((i) => i.id === l.itemId);
            const detail = l.details as { count?: string };
            return [
              d.number,
              formatDate(d.createdAt),
              name(d.projectId),
              name(d.actorId),
              d.status,
              item?.sku || l.itemId,
              name(l.locationId),
              l.approved.toString(),
              l.fulfilled.toString(),
              l.returned.toString(),
              l.waste.toString(),
              item?.tracking === "quantity"
                ? l.fulfilled.sub(l.returned).toString()
                : "—",
              l.assetId || item?.tracking === "serialized"
                ? "unit"
                : name(item?.unitId || null),
              p.type === "stocktakes"
                ? `${l.quantity} / ${detail.count ?? "Belum dihitung"}`
                : "—",
            ];
          }),
      ),
    ];
  }
  if (count > 5000 || rows.length > 5001)
    return new Response(
      "Terlalu banyak data. Persempit filter/rentang tanggal.",
      { status: 413 },
    );
  await db.audit.create({
    data: {
      actorId: user.id,
      action: "REPORT_EXPORTED",
      entityId: p.type,
      payload: { filters: p, rows: rows.length - 1 },
    },
  });
  const headers = { "Cache-Control": "private, no-store" };
  if (p.format === "print")
    return new Response(printReport(`Laporan ${p.type}`, rows), {
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
    });
  if (p.format === "csv")
    return new Response(csvReport(rows), {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=inventory-${p.type}.csv`,
      },
    });
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Inventory");
  sheet.addRows(rows.map((row) => row.map(spreadsheetSafe)));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.columns.forEach((c) => (c.width = 24));
  return new Response(new Uint8Array(await book.xlsx.writeBuffer()), {
    headers: {
      ...headers,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=inventory-${p.type}.xlsx`,
    },
  });
}
