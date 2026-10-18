import { createHash, randomUUID } from "node:crypto";
import { db } from "./db";
import { execute } from "./inventory";
import { permit, type Actor } from "./capabilities";
import { openingColumns } from "./opening";
import type { planWorkbook } from "./workbook-import";

type Plan = Awaited<ReturnType<typeof planWorkbook>>;
const categoryCode = (name: string) =>
  "XLSX-" +
  createHash("sha256").update(name).digest("hex").slice(0, 12).toUpperCase();
const description = (row: Plan["items"][number]) =>
  row.sourceSerial && row.type !== "PRODUCT"
    ? `Keterangan seri/model: ${row.sourceSerial}`
    : "";

/** Setup and quantity opening drafts only. Physical counts and asset inspections remain human gates. */
export async function applyWorkbook(plan: Plan, actor: Actor) {
  permit(actor, "users");
  const masters = await db.master.findMany();
  const existing = await db.item.findMany({
    where: { sku: { in: plan.items.map((i) => i.sku) } },
  });
  const types = new Map(
    masters
      .filter((m) => m.kind === "type" && m.active)
      .map((m) => [m.code, m]),
  );
  for (const row of plan.items) {
    const type = types.get(row.type);
    if (
      !type ||
      (type.details as { tracking?: string }).tracking !==
        (row.type === "CONSUMABLE" ? "quantity" : "serialized")
    )
      throw Error(`Jenis sistem ${row.type} belum siap.`);
    const before = existing.find((i) => i.sku === row.sku);
    const ref = (id: string, kind: string, code: string) =>
      masters.some(
        (m) => m.id === id && m.kind === kind && m.code === code && m.active,
      );
    if (
      before &&
      (before.name !== row.name ||
        before.description !== description(row) ||
        !before.active ||
        before.typeId !== type.id ||
        !ref(before.categoryId, "category", categoryCode(row.category)) ||
        !ref(
          before.unitId,
          "unit",
          row.unit === "liter" ? "L" : row.unit.toUpperCase(),
        ) ||
        !ref(before.locationId, "location", row.location))
    )
      throw Error(
        `SKU ${row.sku} sudah ada dengan data berbeda; tidak ditimpa.`,
      );
  }
  const run = async (label: string, action: string, input: unknown) => {
    const h = createHash("sha256")
      .update(`workbook-v1:${plan.hash}:${label}`)
      .digest("hex");
    const key = `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
    return (await execute(actor, key, action, input)) as { id: string };
  };
  let createdMasters = 0,
    createdItems = 0;
  const master = async (
    kind: string,
    code: string,
    name: string,
    details: Record<string, unknown>,
    parentId?: string,
  ) => {
    const before = masters.find((m) => m.kind === kind && m.code === code);
    if (before) {
      if (
        !before.active ||
        (kind === "location" && before.parentId !== (parentId || null)) ||
        (kind === "unit" &&
          !!(before.details as { fractional?: boolean }).fractional !==
            !!details.fractional) ||
        (kind === "category" && before.name !== name)
      )
        throw Error(
          `Master ${kind}/${code} berbeda; periksa sebelum melanjutkan.`,
        );
      return before.id;
    }
    const result = await run(`${kind}:${code}`, "master", {
      kind,
      code,
      name,
      details,
      parentId,
    });
    masters.push(
      await db.master.findUniqueOrThrow({ where: { id: result.id } }),
    );
    createdMasters++;
    return result.id;
  };
  const warehouse = await master("location", "MTC-GUDANG", "Gudang MTC", {
    locationType: "Gudang",
  });
  const locations = new Map<string, string>();
  for (const block of ["A", "B", "C", "D"])
    locations.set(
      block,
      await master(
        "location",
        `MTC-BLOK-${block}`,
        `Blok ${block}`,
        { locationType: "Lemari" },
        warehouse,
      ),
    );
  const locationCodes = [
    ...new Set(
      plan.items.flatMap((i) =>
        i.location.includes("-")
          ? [i.location.split("-")[0], i.location]
          : [i.location],
      ),
    ),
  ].sort();
  for (const code of locationCodes) {
    const toolbox = code.includes("-");
    const parentId = toolbox
      ? locations.get(code.split("-")[0])
      : locations.get(code[0]) || warehouse;
    if (!parentId) throw Error(`Parent lokasi ${code} belum tersedia.`);
    locations.set(
      code,
      await master(
        "location",
        code,
        code === "WST"
          ? "Workstation"
          : code === "FLR"
            ? "Area lantai"
            : toolbox
              ? `${code} · Toolbox ${code.endsWith("TB") ? "hitam" : "hijau"}`
              : `Rak ${code}`,
        { locationType: toolbox ? "Kotak" : "Rak" },
        parentId,
      ),
    );
  }
  const unitIds = new Map<string, string>(),
    categoryIds = new Map<string, string>();
  for (const row of plan.items) {
    if (!unitIds.has(row.unit))
      unitIds.set(
        row.unit,
        await master(
          "unit",
          row.unit === "liter" ? "L" : row.unit.toUpperCase(),
          row.unit,
          { fractional: row.unit === "liter" },
        ),
      );
    if (!categoryIds.has(row.category))
      categoryIds.set(
        row.category,
        await master("category", categoryCode(row.category), row.category, {}),
      );
    if (existing.some((i) => i.sku === row.sku)) continue;
    await run(`item:${row.sku}`, "item", {
      sku: row.sku,
      name: row.name,
      typeId: types.get(row.type)!.id,
      categoryId: categoryIds.get(row.category),
      unitId: unitIds.get(row.unit),
      locationId: locations.get(row.location),
      minStock: "0",
      description: description(row),
    });
    createdItems++;
  }
  const drafts: string[] = [];
  const quantities = plan.items.filter((i) => i.type === "CONSUMABLE");
  for (let offset = 0; offset < quantities.length; offset += 100) {
    const csv = [
      openingColumns.join(","),
      ...quantities
        .slice(offset, offset + 100)
        .map((i) =>
          [i.sku, i.location, i.quantity, "", "", "Baik", "false", ""].join(
            ",",
          ),
        ),
    ].join("\n");
    const batchId = `xlsx-${plan.hash.slice(0, 16)}-${offset / 100 + 1}`;
    const result = await run(batchId, "opening-import", {
      batchId,
      csv,
      reason: `Draf saldo Excel ${plan.hash.slice(0, 16)}; wajib rekonsiliasi fisik sebelum posting.`,
    });
    const document = await db.document.findUnique({ where: { id: result.id } });
    if (!document)
      throw Error(
        `Validasi draf ${batchId} gagal; periksa hasil opening import.`,
      );
    drafts.push(document.number);
  }
  return {
    createdMasters,
    createdItems,
    catalogRows: plan.items.length,
    quantityRows: quantities.length,
    serializedRows: plan.items.length - quantities.length,
    drafts,
    held: plan.held,
    stockPosted: false,
  };
}

export async function postWorkbookQuantities(
  plan: Plan,
  actor: Actor,
  reason: string,
) {
  permit(actor, "users");
  if (reason.trim().length < 15 || reason.length > 500)
    throw Error("Bukti konfirmasi hitung fisik wajib diisi sebelum posting.");
  const quantities = plan.items.filter((i) => i.type === "CONSUMABLE");
  let posted = 0;
  for (let offset = 0; offset < quantities.length; offset += 100) {
    const reference = `OPENING:xlsx-${plan.hash.slice(0, 16)}-${offset / 100 + 1}`;
    const docs = await db.document.findMany({
      where: { reference },
      include: { lines: true },
    });
    if (docs.length !== 1)
      throw Error("Dokumen pembukaan hilang atau duplikat.");
    const doc = docs[0];
    if (doc.kind !== "receipt" || !["draft", "posted"].includes(doc.status))
      throw Error("Status dokumen pembukaan tidak sesuai.");
    const expected = quantities.slice(offset, offset + 100);
    const items = await db.item.findMany({
      where: { sku: { in: expected.map((i) => i.sku) } },
    });
    const locations = await db.master.findMany({
      where: {
        kind: "location",
        code: { in: expected.map((i) => i.location) },
      },
    });
    if (
      doc.lines.length !== expected.length ||
      expected.some(
        (row) =>
          !doc.lines.some(
            (line) =>
              line.itemId === items.find((i) => i.sku === row.sku)?.id &&
              line.locationId ===
                locations.find((l) => l.code === row.location)?.id &&
              line.quantity.eq(row.quantity),
          ),
      )
    )
      throw Error("Rincian pembukaan tidak cocok dengan sumber.");
    if (doc.status === "posted") continue;
    await execute(actor, randomUUID(), "post-receipt", { id: doc.id, reason });
    posted++;
  }
  return posted;
}
