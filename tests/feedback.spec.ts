import "dotenv/config";
import { test, expect } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { mkdir } from "node:fs/promises";
import { db } from "../src/server/db";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("Isolated database required");
const prefix = "fb-" + randomUUID().slice(0, 8),
  password = randomBytes(20).toString("base64url");
let toolId: string, itemId: string, locationId: string;
test.use({ extraHTTPHeaders: { "x-forwarded-for": "127.0.0.36" } });
test.beforeAll(async () => {
  await db.user.create({
    data: {
      id: prefix,
      username: prefix,
      name: "Feedback Review",
      email: `${prefix}@test.invalid`,
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
  const location = await db.master.create({
    data: {
      kind: "location",
      code: prefix,
      name: "Rak uji " + prefix,
      details: { locationType: "Rak" },
    },
  });
  locationId = location.id;
  const category = await db.master.create({
    data: { kind: "category", code: prefix, name: prefix },
  });
  const unit = await db.master.findUniqueOrThrow({
    where: { kind_code: { kind: "unit", code: "PCS" } },
  });
  const equipment = await db.master.findUniqueOrThrow({
    where: { kind_code: { kind: "type", code: "EQUIPMENT" } },
  });
  const consumable = await db.master.findUniqueOrThrow({
    where: { kind_code: { kind: "type", code: "CONSUMABLE" } },
  });
  const base = {
    categoryId: category.id,
    unitId: unit.id,
    locationId,
    minStock: "0",
  };
  const tool = await db.item.create({
    data: {
      ...base,
      typeId: equipment.id,
      sku: prefix + "-TOOL",
      name: "Tang uji " + prefix,
      tracking: "serialized",
    },
  });
  toolId = tool.id;
  await db.item.createMany({
    data: Array.from({ length: 101 }, (_, i) => ({
      ...base,
      id: `${prefix}-item-${i}`,
      typeId: consumable.id,
      sku: `${prefix}-${String(i).padStart(3, "0")}`,
      name: `Komponen ${prefix} ${i}`,
      tracking: "quantity",
    })),
  });
  itemId = `${prefix}-item-100`;
  await db.asset.create({
    data: {
      id: prefix + "-asset",
      itemId: toolId,
      locationId,
      tag: prefix + "-LEGACY",
    },
  });
  await mkdir(".impeccable/review/feedback", { recursive: true });
});
test.afterAll(async () => {
  await db.$disconnect();
});
test("login cannot send credentials through a URL before JavaScript is ready", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("http://localhost:3030/login");
    await expect(page.locator("form.data-form")).toHaveAttribute(
      "method",
      "post",
    );
    await expect(
      page.getByRole("button", { name: "Menyiapkan form…" }),
    ).toBeDisabled();
  } finally {
    await context.close();
  }
});
test("feedback: searchable receipt, unit expansion, focus, QR selection and private PWA cache", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(prefix);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.setViewportSize({ width: 1366, height: 600 });
  await page
    .locator(".sidebar .management-menu")
    .evaluate((e) => ((e as HTMLDetailsElement).open = true));
  await expect(page.locator('.sidebar a[href="/admin/labels"]')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(
    await page.evaluate(
      () => scrollY + innerHeight >= document.documentElement.scrollHeight - 2,
    ),
  ).toBeTruthy();
  await page.goto(
    `/admin/masters?tab=location&q=${prefix}&edit=${locationId}#master-editor`,
  );
  await expect(page.locator("#master-editor")).toBeFocused();
  await expect(page.getByLabel(/^Nama/)).toHaveValue("Rak uji " + prefix);
  await page.goto("/admin/receipts/new");
  const choice = page.getByRole("combobox", { name: "Barang", exact: true });
  await choice.fill(`${prefix}-TOOL — Tang uji ${prefix}`);
  await expect(
    page.getByLabel("Jumlah", { exact: true }).first(),
  ).toHaveAttribute("readonly", "");
  await page
    .getByLabel(/Tambahkan unit serupa/)
    .first()
    .fill("2");
  await page
    .getByRole("button", { name: "Tambahkan rincian unit", exact: true })
    .first()
    .click();
  await expect(page.locator(".line-editor")).toHaveCount(3);
  await page.getByLabel(/Sumber\/supplier/).fill("Latihan penerimaan 3 unit");
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: ".impeccable/review/feedback/receipt-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: ".impeccable/review/feedback/receipt-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Simpan Draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("berhasil disimpan");
  const draft = await db.document.findFirstOrThrow({
    where: { actorId: prefix, kind: "receipt" },
    include: { lines: true },
  });
  expect(draft.lines).toHaveLength(3);
  expect(
    new Set(draft.lines.map((l) => (l.details as { tag: string }).tag)).size,
  ).toBe(3);
  expect(await db.asset.count({ where: { itemId: toolId } })).toBe(1);
  await page.goto(`/admin/labels?type=ITEM&q=${prefix}`);
  await expect(page.getByText(/102 hasil/)).toBeVisible();
  await page.getByRole("link", { name: "Berikutnya", exact: true }).click();
  await expect(page.getByText(/Halaman 2 dari/)).toBeVisible();
  await page.getByRole("link", { name: "Berikutnya", exact: true }).click();
  await expect(page.getByText(/Halaman 3 dari/)).toBeVisible();
  await page
    .locator(".label-option")
    .filter({ hasText: prefix + "-100" })
    .getByRole("checkbox")
    .check();
  await page.getByRole("link", { name: "Siapkan cetak", exact: true }).click();
  await expect(page.locator(".asset-label")).toHaveCount(1);
  await expect(page.locator(".asset-label")).toContainText(prefix + "-100");
  await page.screenshot({
    path: ".impeccable/review/feedback/labels-mobile.png",
    fullPage: true,
  });
  for (const [code, path] of [
    [`MTC:ITEM:${itemId}`, `/admin/items/${itemId}`],
    [`MTC:ASSET:${prefix}-asset`, `/admin/items/${toolId}`],
    [prefix + "-LEGACY", `/admin/items/${toolId}`],
    [prefix + "-100", `/admin/items/${itemId}`],
  ]) {
    await page.goto(`/scan?q=${encodeURIComponent(code)}`);
    expect(new URL(page.url()).pathname).toBe(path);
  }
  await expect(
    page.request.get("/manifest.webmanifest").then((r) => r.json()),
  ).resolves.toMatchObject({ display: "standalone", start_url: "/" });
  const worker = await page.request.get("/sw.js");
  expect(worker.headers()["cache-control"]).toContain("no-store");
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "Pasang MTC Inventory" }),
  ).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    return (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map(
            (r) => new URL(r.url).pathname,
          ),
        ),
      )
    ).flat();
  });
  expect(
    cached.every(
      (path) => path === "/offline.html" || path.startsWith("/icons/"),
    ),
  ).toBeTruthy();
  await context.setOffline(true);
  await page.goto("/admin/items?offline-test=1");
  await expect(
    page.getByRole("heading", { name: "Sambungkan kembali internet" }),
  ).toBeVisible();
  await context.setOffline(false);
});
