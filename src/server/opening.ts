import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { z } from "zod";
import { quantity } from "./rules";

export const openingColumns = [
  "sku",
  "location",
  "quantity",
  "tag",
  "serial",
  "condition",
  "calibration_required",
  "valid_until",
];
export async function parseOpeningCsv(csv: string) {
  z.string().min(1).max(100_000).parse(csv);
  const book = new ExcelJS.Workbook();
  const sheet = await book.csv.read(
    Readable.from([csv.replace(/^\uFEFF/, "")]),
    {
      map: (value: string) => value.trim(),
      parserOptions: { ignoreEmpty: true },
    },
  );
  if (sheet.rowCount < 2 || sheet.rowCount > 101)
    throw new Error("CSV harus berisi 1–100 baris data.");
  if (
    openingColumns.some(
      (name, i) => sheet.getRow(1).getCell(i + 1).value !== name,
    ) ||
    sheet.columnCount !== openingColumns.length
  )
    throw new Error("Header CSV harus: " + openingColumns.join(","));
  return Array.from({ length: sheet.rowCount - 1 }, (_, i) => {
    const row = sheet.getRow(i + 2);
    const values = Object.fromEntries(
      openingColumns.map((key, col) => [
        key,
        String(row.getCell(col + 1).value || ""),
      ]),
    );
    values.sku = values.sku.toUpperCase();
    values.location = values.location.toUpperCase();
    const parsed = z
      .object({
        sku: z.string().min(1),
        location: z.string().min(1),
        quantity,
        tag: z.string().max(100),
        serial: z.string().max(150),
        condition: z.enum(["Baru", "Baik", "Rusak Ringan", "Rusak Berat"]),
        calibration_required: z.enum(["true", "false"]),
        valid_until: z
          .string()
          .refine(
            (v) => !v || Number.isFinite(Date.parse(v)),
            "Tanggal tidak valid",
          ),
      })
      .safeParse(values);
    return {
      row: i + 2,
      values,
      errors: parsed.success
        ? []
        : parsed.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
  });
}
