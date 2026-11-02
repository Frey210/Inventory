import { tagAliasId } from "../src/server/tag-alias";
import "dotenv/config";
import { test, expect } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { hashPassword } from "better-auth/crypto";
import { createRequire } from "node:module";
import { db } from "../src/server/db";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("Isolated DB required");
const prefix = "f3web-" + randomUUID().slice(0, 8),
  password = randomBytes(20).toString("base64url");
let itemId: string,
  assetId: string,
  rackId: string,
  otherId: string,
  productId: string;
test.beforeAll(async () => {
  await mkdir(".impeccable/review/feedback3", { recursive: true });
  await db.user.create({
    data: {
      id: prefix,
      username: prefix,
      name: "Petugas uji",
      email: prefix + "@test.invalid",
      role: "ADMIN",
      mustChangePassword: false,
      accounts: {
        create: {
          id: prefix,
          accountId: prefix,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });
  const master = async (kind: string, code: string, details: object = {}) =>
    db.master.create({
      data: { kind, code: prefix + code, name: code, details },
    });
  const rack = await master("location", "Rak A"),
    other = await master("location", "Rak B"),
    cat = await master("category", "IoT"),
    project = await master("project", "Proyek");
  void project;
  rackId = rack.id;
  otherId = other.id;
  const pcs = await db.master.findUniqueOrThrow({
      where: { kind_code: { kind: "unit", code: "PCS" } },
    }),
    type = await db.master.findUniqueOrThrow({
      where: { kind_code: { kind: "type", code: "CONSUMABLE" } },
    }),
    product = await db.master.findUniqueOrThrow({
      where: { kind_code: { kind: "type", code: "PRODUCT" } },
    });
  const item = await db.item.create({
    data: {
      sku: prefix + "-PCB",
      name: "PCB uji komponen",
      typeId: type.id,
      unitId: pcs.id,
      categoryId: cat.id,
      locationId: rack.id,
      tracking: "quantity",
      balances: { create: { locationId: rack.id, onHand: 9 } },
    },
  });
  itemId = item.id;
  const prod = await db.item.create({
    data: {
      sku: prefix + "-PROD",
      name: "Produk IoT uji",
      typeId: product.id,
      unitId: pcs.id,
      categoryId: cat.id,
      locationId: rack.id,
      tracking: "serialized",
      assets: { create: { tag: prefix + "-LEGACY", locationId: rack.id } },
    },
  });
  productId = prod.id;
  assetId = (await db.asset.findFirstOrThrow({ where: { itemId: prod.id } }))
    .id;
  await db.record.create({
    data: {
      id: tagAliasId(prefix + "-LEGACY"),
      kind: "asset_tag_alias",
      actorId: prefix,
      referenceId: assetId,
      status: "active",
      payload: { tag: prefix + "-LEGACY" },
    },
  });
  await db.asset.update({
    where: { id: assetId },
    data: { tag: "MTC-" + prefix.replaceAll("-", "").toUpperCase() + "-001" },
  });
  await db.audit.create({
    data: {
      actorId: prefix,
      action: "ITEM_SAVED",
      entityId: item.id,
      payload: {
        before: { minStock: "0" },
        after: { minStock: "5" },
        password: "NeverExposeThisValue",
      },
    },
  });
});
test.afterAll(async () => {
  await db.$disconnect();
});
test("scan uses relative redirects; labels, human audit, filtered requests and stocktake findings work", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "127.0.0.71" });
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(prefix);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  for (const code of [
    `MTC:ITEM:${itemId}`,
    `MTC:ASSET:${assetId}`,
    prefix + "-LEGACY",
    prefix + "-PCB",
    "missing-code",
  ]) {
    const response = await page.request.get(
      "/scan?q=" + encodeURIComponent(code),
      {
        maxRedirects: 0,
        headers: {
          "x-forwarded-host": "evil.invalid",
          "x-forwarded-proto": "http",
        },
      },
    );
    expect(response.status()).toBe(303);
    expect(response.headers().location).toMatch(/^\/admin\/items/);
    expect(response.headers().location).not.toMatch(/0\.0\.0\.0|evil|https?:/);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
  await page.goto("/scan?q=" + encodeURIComponent(`MTC:ASSET:${assetId}`));
  await expect(page).toHaveURL(new RegExp(`/admin/items/${productId}\\?unit=`));
  await page.goto(`/admin/labels?type=ASSET&print=1&ids=${assetId}`);
  const label = page.locator(".asset-label");
  await expect(label).toContainText(
    "MTC-" + prefix.replaceAll("-", "").toUpperCase() + "-001",
  );
  await expect(label).toContainText("Rak A");
  await expect(label).not.toContainText("Produk IoT uji");
  await expect(label).not.toContainText("Unit alat");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(label).toBeVisible();
  await expect(page.locator(".page-loading")).toHaveCount(0);
  await page.screenshot({
    path: ".impeccable/review/feedback3/labels-desktop.png",
  });
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(label).toBeVisible();
  await expect(page.locator(".page-loading")).toHaveCount(0);
  await page.screenshot({
    path: ".impeccable/review/feedback3/labels-mobile.png",
  });
  await page.goto("/admin/audit");
  await expect(
    page.getByRole("heading", { name: "Riwayat aktivitas", exact: true }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText("Petugas uji");
  await expect(page.locator("main")).not.toContainText("NeverExposeThisValue");
  await expect(page.locator("main")).toContainText("Stok minimum: 0 menjadi 5");
  const report = await page.request.get("/api/reports?type=audit&format=csv");
  expect(report.status()).toBe(200);
  const body = await report.text();
  expect(body).toContain("Katalog barang diperbarui");
  expect(body).not.toContain("NeverExposeThisValue");
  expect(body).not.toContain('"before"');
  const xlsx = await page.request.get("/api/reports?type=audit&format=xlsx");
  expect(xlsx.status()).toBe(200);
  const ExcelJS = createRequire(import.meta.url)(
    "exceljs",
  ) as typeof import("exceljs");
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(new Uint8Array(await xlsx.body()).buffer);
  expect(JSON.stringify(book.worksheets[0].getSheetValues())).not.toContain(
    "NeverExposeThisValue",
  );
  const print = await page.request.get("/api/reports?type=audit&format=print");
  expect(print.status()).toBe(200);
  const printed = await print.text();
  expect(printed).toContain("Laporan aktivitas");
  const setting = await db.record.findFirst({
    where: { kind: "settings" },
    orderBy: { createdAt: "desc" },
  });
  const companyZone = String(
    (setting?.payload as { timezone?: string })?.timezone || "Asia/Makassar",
  );
  expect(printed.includes(companyZone)).toBe(true);
  expect(printed).toContain("Periode:");

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: `.impeccable/review/feedback3/audit-${width}.png`,
    });
  }
  await page.goto("/api/reports?type=audit&format=print");
  await expect(
    page.getByRole("heading", { name: "Laporan aktivitas", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: ".impeccable/review/feedback3/report-desktop.png",
  });
  await page.goto(`/admin/requests/new?item=${itemId}&mode=quantity`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Ambil dari rak", exact: true }),
  ).toHaveValue(rackId);
  await page
    .getByLabel("Filter rak pengambilan (opsional)")
    .selectOption(otherId);
  await expect(
    page.getByRole("combobox", { name: "Barang", exact: true }),
  ).toHaveValue("");
  const payload = JSON.parse(
    await page.locator('input[name="payload"]').inputValue(),
  );
  expect(payload.lines[0].itemId).toBe("");
  expect(payload.lines[0].locationId).toBe("");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: `.impeccable/review/feedback3/request-${width}.png`,
    });
  }
  await page.goto("/admin/maintenance");
  await expect(
    page.getByRole("combobox", { name: /Sensor \/ produk jadi/ }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: /Sensor \/ produk jadi/ })
    .fill(
      "MTC-" +
        prefix.replaceAll("-", "").toUpperCase() +
        "-001 - Produk IoT uji - Rak A - Tersedia",
    );
  await expect(page.getByLabel("Metode/standar/buffer")).toHaveCount(0);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: `.impeccable/review/feedback3/maintenance-${width}.png`,
    });
  }
  await page.goto("/admin/stocktakes");
  await page.getByLabel("Rak yang dihitung").selectOption(otherId);
  await page.getByLabel("Tujuan/periode hitung").fill("Uji rak kosong");
  await page
    .getByRole("button", { name: "Mulai Sesi & Bekukan Lokasi", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("berhasil disimpan");
  const session = await db.document.findFirstOrThrow({
    where: { kind: "stocktake", actorId: prefix, locationId: otherId },
    orderBy: { createdAt: "desc" },
  });
  await page.goto(`/admin/stocktakes/${session.id}`);
  await expect(
    page.getByRole("button", { name: "Ajukan Hasil Hitung", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: /^Barang \/ SKU/ })
    .fill(prefix + "-PCB - PCB uji komponen");
  await page
    .getByLabel("Alasan dan sumber temuan")
    .fill("Barang ditemukan saat hitung fisik");
  await page
    .getByRole("button", { name: "Tambahkan barang temuan", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("berhasil disimpan");
  await expect(
    page.getByRole("button", { name: "Ajukan Hasil Hitung", exact: true }),
  ).toBeVisible();
  expect(
    await db.balance.count({ where: { itemId, locationId: otherId } }),
  ).toBe(0);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("heading", { level: 1 }).click();
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.locator(".page-loading")).toHaveCount(0);
    await page.screenshot({
      path: `.impeccable/review/feedback3/stocktake-${width}.png`,
      fullPage: true,
    });
  }
  await page.goto("/admin/overrides");
  await expect(
    page.getByRole("heading", {
      name: "Tinjau persetujuan darurat",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText(
    "Baru saat itu stok fisik berkurang",
  );
});
