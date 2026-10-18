import ExcelJS from "exceljs";
import { createHash } from "node:crypto";
import { quantity } from "./rules";

const categories: Record<string, string> = {
  Sensor: "SENSOR",
  "Produk jadi": "PRODUCT",
  APD: "EQUIPMENT",
  "Komponen elektronik": "CONSUMABLE",
  "Bahan habis pakai": "CONSUMABLE",
  "Aset/alat kerja": "EQUIPMENT",
  "Bahan kimia": "CONSUMABLE",
  "Perlengkapan laboratorium": "EQUIPMENT",
};
export type WorkbookItem = {
  row: number;
  sku: string;
  sourceSku: string;
  name: string;
  category: string;
  type: string;
  unit: string;
  location: string;
  quantity: string;
  sourceSerial: string;
  units: { tag: string; serial: string; row: number }[];
};

/** Only the primary list supplies quantities; the other rack/toolbox sheets repeat it. */
export async function planWorkbook(buffer: Buffer) {
  if (buffer.length > 20_000_000) throw Error("Workbook melebihi 20 MB.");
  const hash = createHash("sha256").update(buffer).digest("hex");
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(new Uint8Array(buffer).buffer);
  const sheet = book.getWorksheet("List Barang");
  const products = book.getWorksheet("Aquanotes");
  if (!sheet || !products || sheet.rowCount > 5000)
    throw Error("Struktur workbook tidak sesuai List Barang / Aquanotes.");
  const items: WorkbookItem[] = [];
  const held: { row: number; sku: string; reason: string }[] = [];
  sheet.eachRow((r, row) => {
    if (typeof r.getCell(1).value !== "number") return;
    const value = (col: number) => r.getCell(col).text.trim();
    const category = value(7),
      unit = value(4).toLowerCase();
    const item: WorkbookItem = {
      row,
      sku: value(9).toUpperCase(),
      sourceSku: value(9).toUpperCase(),
      name: value(2),
      category,
      type:
        category === "APD" && unit === "box"
          ? "CONSUMABLE"
          : categories[category],
      unit,
      // Owner confirmed the workbook typo C! = C1 on 19 October 2026.
      location:
        value(10).toUpperCase() === "C!" ? "C1" : value(10).toUpperCase(),
      quantity: value(3),
      sourceSerial: value(6),
      units: [],
    };
    // Owner confirmed cutter AK057 / knob AK058; the physical knob label must be replaced.
    if (
      item.sku === "AK057" &&
      item.name.toLowerCase() === "knob door (gagang pintu bulat)"
    )
      item.sku = "AK058";
    const reason =
      !item.name || item.name.length > 500
        ? "Nama tidak valid."
        : !item.type
          ? "Kategori belum dipetakan."
          : !["pcs", "roll", "box", "liter"].includes(unit)
            ? "Satuan belum dipetakan."
            : !quantity.safeParse(item.quantity).success ||
                (unit !== "liter" && !Number.isInteger(Number(item.quantity)))
              ? "Jumlah tidak valid."
              : !/^(?:[ABC][1-5](?:-T[BG])?|D1|WST|FLR)$/.test(item.location)
                ? "Lokasi perlu dikonfirmasi."
                : item.sku !== "SHEET 2" &&
                    !/^[A-Z0-9_-]{1,100}$/.test(item.sku)
                  ? "SKU tidak valid."
                  : "";
    if (reason) held.push({ row, sku: item.sku, reason });
    // Retain all rows until duplicate detection, including rows with invalid locations.
    items.push(item);
  });
  if (!items.length) throw Error("Tidak ada baris barang yang dapat dibaca.");
  const codes = new Map<string, number[]>();
  for (const i of items) codes.set(i.sku, [...(codes.get(i.sku) || []), i.row]);
  for (const i of items) {
    if (i.sku !== "SHEET 2" && codes.get(i.sku)!.length > 1)
      held.push({
        row: i.row,
        sku: i.sku,
        reason: "SKU dipakai lebih dari satu barang.",
      });
    if (i.sku !== "SHEET 2") continue;
    const model = /^Aquanotes ([1-5]|Continuous)$/.exec(i.name)?.[1];
    if (i.category !== "Produk jadi" || !model) {
      held.push({
        row: i.row,
        sku: i.sku,
        reason: "Model Aquanotes tidak dikenal.",
      });
      continue;
    }
    // Generated model SKU; the workbook's individual product codes remain asset tags.
    i.sku = model === "Continuous" ? "XLSX-AQNC" : `XLSX-AQNS-V${model}`;
    products.eachRow((r, row) => {
      if (typeof r.getCell(1).value !== "number") return;
      const tag = r.getCell(3).text.trim().toUpperCase();
      const serial = r.getCell(4).text.trim();
      if (
        model === "Continuous"
          ? /^AQNC\d+$/.test(tag)
          : new RegExp(`^AQNSV${model}B\\d+$`).test(tag)
      )
        i.units.push({ tag, serial, row });
    });
    if (i.units.length !== Number(i.quantity) || i.units.some((u) => !u.serial))
      held.push({
        row: i.row,
        sku: i.sku,
        reason: "Jumlah ringkasan dan rincian Aquanotes tidak cocok.",
      });
  }
  const tags = new Set<string>(),
    serials = new Set<string>();
  for (const i of items)
    for (const u of i.units) {
      if (tags.has(u.tag) || serials.has(u.serial))
        throw Error(
          "Identitas Aquanotes duplikat; hentikan impor untuk rekonsiliasi.",
        );
      tags.add(u.tag);
      serials.add(u.serial);
    }
  const accepted = items.filter((i) => !held.some((h) => h.row === i.row));
  if (new Set(accepted.map((i) => i.sku)).size !== accepted.length)
    throw Error("SKU hasil pemetaan duplikat.");
  return { hash, sourceRows: items.length, items: accepted, held };
}
