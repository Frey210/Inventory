import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { planWorkbook } from "../src/server/workbook-import";
import {
  applyWorkbook,
  postWorkbookQuantities,
} from "../src/server/workbook-apply";
import { db } from "../src/server/db";

async function fixture(duplicate = false) {
  const book = new ExcelJS.Workbook();
  const list = book.addWorksheet("List Barang");
  list.addRow([
    "No",
    "Nama",
    "Jumlah",
    "Satuan",
    "",
    "Seri",
    "Kategori",
    "Barcode",
    "Kode",
    "Lokasi",
  ]);
  list.addRow([
    1,
    "Resistor fixture",
    12,
    "pcs",
    "",
    "",
    "Komponen elektronik",
    "*TEST-R*",
    "TEST-R",
    "B1",
  ]);
  list.addRow([
    2,
    "Bor fixture",
    2,
    "pcs",
    "",
    "",
    "Aset/alat kerja",
    "*TEST-B*",
    "TEST-B",
    "C3-TB",
  ]);
  list.addRow([
    3,
    "Aquanotes 1",
    1,
    "pcs",
    "",
    "SOURCE-RANGE",
    "Produk jadi",
    "SHEET 2",
    "SHEET 2",
    "A1",
  ]);
  if (duplicate) {
    list.addRow([
      4,
      "Barang lain",
      1,
      "pcs",
      "",
      "",
      "Aset/alat kerja",
      "",
      "TEST-B",
      "C!",
    ]);
    list.addRow([
      5,
      "Pecahan pcs",
      1.5,
      "pcs",
      "",
      "",
      "Komponen elektronik",
      "",
      "TEST-F",
      "B1",
    ]);
  }
  const products = book.addWorksheet("Aquanotes");
  products.addRow(["No", "Nama", "Kode", "Serial"]);
  products.addRow([1, "Aquanotes Spot", "AQNSV1B1", " SERIAL-001 "]);
  // Rack/toolbox detail repeats the stock and must never supply additional quantities.
  book.addWorksheet("Toolbox").addRow([1, "Bor fixture", 999]);
  return Buffer.from(await book.xlsx.writeBuffer());
}

test("workbook parser holds conflicting rows, ignores repeated rack stock and resolves product units once", async () => {
  const buffer = await fixture(true);
  const plan = await planWorkbook(buffer);
  assert.equal(plan.sourceRows, 5);
  assert.deepEqual(
    plan.items.map((i) => i.sku),
    ["TEST-R", "XLSX-AQNS-V1"],
  );
  assert.equal(plan.items[0].quantity, "12");
  assert.deepEqual(plan.items[1].units, [
    { tag: "AQNSV1B1", serial: "SERIAL-001", row: 2 },
  ]);
  assert.equal(new Set(plan.held.map((i) => i.row)).size, 3);
  assert.deepEqual(await planWorkbook(buffer), plan);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(new Uint8Array(buffer).buffer);
  book
    .getWorksheet("List Barang")!
    .addRow([
      6,
      "cutter foam",
      1,
      "pcs",
      "",
      "",
      "Aset/alat kerja",
      "",
      "AK057",
      "C!",
    ]);
  book
    .getWorksheet("List Barang")!
    .addRow([
      7,
      "knob door (gagang pintu bulat)",
      1,
      "pcs",
      "",
      "",
      "Aset/alat kerja",
      "",
      "AK057",
      "C2",
    ]);
  const mapped = await planWorkbook(Buffer.from(await book.xlsx.writeBuffer()));
  assert.equal(mapped.items.find((i) => i.sku === "AK057")?.location, "C1");
  assert.equal(mapped.items.find((i) => i.sku === "AK058")?.sourceSku, "AK057");
  book
    .getWorksheet("Aquanotes")!
    .addRow([2, "Duplicate", "AQNSV1B2", "SERIAL-001"]);
  await assert.rejects(
    planWorkbook(Buffer.from(await book.xlsx.writeBuffer())),
    /duplikat/,
  );
  await assert.rejects(planWorkbook(Buffer.alloc(20_000_001)), /20 MB/);
});

test("PostgreSQL: workbook setup retries safely, creates opening drafts without stock and refuses overwritten SKU", async () => {
  if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
    throw Error("Isolated DB required");
  const suffix = randomUUID();
  const actor = await db.user.create({
    data: {
      id: suffix,
      email: suffix + "@test.invalid",
      name: "Workbook test",
      role: "ADMIN",
      mustChangePassword: false,
    },
  });
  const plan = await planWorkbook(await fixture());
  for (const row of plan.items) row.sku += "-" + suffix.toUpperCase();
  plan.hash = suffix.replaceAll("-", "");
  try {
    const before = {
      balance: await db.balance.count(),
      asset: await db.asset.count(),
      ledger: await db.ledger.count(),
    };
    const first = await applyWorkbook(plan, actor);
    assert.equal(first.createdItems, 3);
    assert.equal(first.quantityRows, 1);
    assert.equal(first.serializedRows, 2);
    assert.equal(first.stockPosted, false);
    assert.equal(first.drafts.length, 1);
    const again = await applyWorkbook(plan, actor);
    assert.equal(again.createdItems, 0);
    assert.equal(again.createdMasters, 0);
    assert.deepEqual(again.drafts, first.drafts);
    const documents = await db.document.findMany({
      where: { number: { in: first.drafts } },
      include: { lines: true },
    });
    assert.equal(documents[0].status, "draft");
    assert.equal(documents[0].lines.length, 1);
    assert.equal(documents[0].lines[0].quantity.toString(), "12");
    assert.deepEqual(
      {
        balance: await db.balance.count(),
        asset: await db.asset.count(),
        ledger: await db.ledger.count(),
      },
      before,
    );
    await assert.rejects(
      applyWorkbook(plan, { ...actor, role: "TECHNICIAN" }),
      /izin/,
    );
    await assert.rejects(
      postWorkbookQuantities(plan, actor, ""),
      /hitung fisik/,
    );
    assert.equal(
      await postWorkbookQuantities(
        plan,
        actor,
        "Owner confirmed physical count matches workbook.",
      ),
      1,
    );
    assert.equal(
      await postWorkbookQuantities(
        plan,
        actor,
        "Owner confirmed physical count matches workbook.",
      ),
      0,
    );
    assert.equal(await db.ledger.count(), before.ledger + 1);
    assert.equal(await db.asset.count(), before.asset);
    const balance = await db.balance.findFirstOrThrow({
      where: { item: { sku: plan.items[0].sku } },
    });
    assert.equal(balance.onHand.toString(), "12");
    plan.items[0].name = "Changed source";
    await assert.rejects(applyWorkbook(plan, actor), /tidak ditimpa/);
  } finally {
    await db.$disconnect();
  }
});
