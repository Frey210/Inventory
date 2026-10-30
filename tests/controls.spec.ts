import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/server/db";

if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("Isolated test database required");
const prefix = "controls-" + randomUUID().slice(0, 8);
const password = randomBytes(20).toString("base64url");
let toolId: string, componentId: string, sourceId: string, targetId: string;
const shots = ".impeccable/review/controls";
const toolName = "Obeng presisi untuk perakitan IoT";
const toolLabel = prefix + "-TOOL — " + toolName;
const componentLabel = prefix + "-PCB — PCB prototipe IoT";
const tags = [prefix + "-A001", prefix + "-A002"];

test.beforeAll(async () => {
  for (const role of ["ADMIN", "TECHNICIAN"]) {
    const id = prefix + role.toLowerCase();
    await db.user.create({
      data: {
        id,
        username: id,
        name: role === "ADMIN" ? "Admin kontrol" : "Teknisi kontrol",
        email: id + "@test.invalid",
        role,
        mustChangePassword: false,
        accounts: {
          create: {
            id,
            accountId: id,
            providerId: "credential",
            password: await hashPassword(password),
          },
        },
      },
    });
  }
  const from = await db.master.create({
    data: {
      kind: "location",
      code: prefix + "-A",
      name: "Rak alat A",
      details: { locationType: "Rak" },
    },
  });
  const to = await db.master.create({
    data: {
      kind: "location",
      code: prefix + "-B",
      name: "Rak alat B",
      details: { locationType: "Rak" },
    },
  });
  sourceId = from.id;
  targetId = to.id;
  const category = await db.master.create({
    data: { kind: "category", code: prefix, name: "Perakitan IoT" },
  });
  const unit = await db.master.findUniqueOrThrow({
    where: { kind_code: { kind: "unit", code: "PCS" } },
  });
  const type = await db.master.findUniqueOrThrow({
    where: { kind_code: { kind: "type", code: "EQUIPMENT" } },
  });
  const consumable = await db.master.findUniqueOrThrow({
    where: { kind_code: { kind: "type", code: "CONSUMABLE" } },
  });
  const tool = await db.item.create({
    data: {
      sku: prefix + "-TOOL",
      name: toolName,
      typeId: type.id,
      unitId: unit.id,
      categoryId: category.id,
      locationId: sourceId,
      tracking: "serialized",
    },
  });
  toolId = tool.id;
  const component = await db.item.create({
    data: {
      sku: prefix + "-PCB",
      name: "PCB prototipe IoT",
      typeId: consumable.id,
      unitId: unit.id,
      categoryId: category.id,
      locationId: sourceId,
      tracking: "quantity",
      balances: {
        create: { locationId: sourceId, onHand: "10", reserved: "0" },
      },
    },
  });
  componentId = component.id;
  const other = await db.item.create({
    data: {
      sku: prefix + "-OTHER",
      name: "Alat lain",
      typeId: type.id,
      unitId: unit.id,
      categoryId: category.id,
      locationId: sourceId,
      tracking: "serialized",
    },
  });
  await db.asset.createMany({
    data: [
      ...tags.map((tag) => ({ itemId: toolId, locationId: sourceId, tag })),
      { itemId: toolId, locationId: targetId, tag: prefix + "-OTHER-RACK" },
      { itemId: other.id, locationId: sourceId, tag: prefix + "-OTHER-SKU" },
    ],
  });
});
test.afterAll(async () => {
  await db.$disconnect();
});

async function login(page: Page, role = "admin") {
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": role === "admin" ? "127.0.0.42" : "127.0.0.43",
  });
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(prefix + role);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(role === "admin" ? /admin\/dashboard/ : /\/me$/);
}

test("Back preserves internal filters/forward and direct or reloaded entry never exits the app", async ({
  page,
}) => {
  await login(page);
  const catalog = `/admin/items?q=${prefix}`;
  await page.goto(catalog);
  await page.locator(`a[href="/admin/items/${toolId}"]`).first().click();
  await expect(
    page.getByRole("heading", { name: toolName, exact: true, level: 1 }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Kembali", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/items\\?q=${prefix}$`));
  await expect(
    page.getByRole("heading", { name: "Barang", exact: true, level: 1 }),
  ).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/items/${toolId}$`));
  await expect(
    page.getByRole("heading", { name: toolName, exact: true, level: 1 }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit barang", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/items/${toolId}/edit$`));
  await page.getByRole("link", { name: "Kembali", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/items/${toolId}$`));
  await page.getByRole("link", { name: "Kembali", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/items\\?q=${prefix}$`));
  await page.goto("about:blank");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://localhost:3030/admin/items/${toolId}/edit`);
  await page.reload();
  for (const destination of [
    `/admin/items/${toolId}`,
    "/admin/items",
    "/admin/dashboard",
  ]) {
    await page.getByRole("link", { name: "Kembali", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:3030" + destination);
  }
  await expect(
    page.getByRole("link", { name: "Kembali", exact: true }),
  ).toHaveCount(0);
});

test("unit checklist filters context, counts selections, clears stale values and posts serialized transfer without double stock", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/transfers");
  const item = page.getByRole("combobox", { name: /^Barang/ });
  const quantity = page.getByRole("spinbutton", { name: /^Jumlah/ });
  const save = page.getByRole("button", { name: "Simpan", exact: true });
  await item.fill(toolLabel);
  await page.getByLabel(/^Lokasi asal/).selectOption(sourceId);
  await page.getByLabel(/^Lokasi tujuan/).selectOption(targetId);
  await expect(page.locator(".unit-picker-option")).toHaveCount(2);
  await expect(quantity).toHaveAttribute("readonly", "");
  await expect(save).toBeDisabled();
  const search = page.getByRole("searchbox", {
    name: "Cari tag atau lokasi unit",
  });
  await search.fill("A001");
  await search.press("Enter");
  await expect(page.locator(".action-feedback")).toHaveCount(0);
  await page.locator(".unit-picker-option").getByRole("checkbox").check();
  await search.fill("A002");
  await page.locator(".unit-picker-option").getByRole("checkbox").check();
  await expect(quantity).toHaveValue("2");
  await search.fill("");
  await page.getByLabel(/^Lokasi asal/).selectOption(targetId);
  await expect(quantity).toHaveValue("0");
  await expect(page.locator(".unit-picker-option")).toHaveCount(1);
  await expect(page.locator(".unit-picker input:checked")).toHaveCount(0);
  await page.getByLabel(/^Lokasi asal/).selectOption(sourceId);
  for (const tag of tags)
    await page
      .locator(".unit-picker-option")
      .filter({ hasText: tag })
      .getByRole("checkbox")
      .check();
  await page.getByLabel(/^Alasan/).fill("Memindahkan alat ke rak perakitan.");
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `${shots}/transfer-${width}.png`,
      fullPage: true,
    });
  }
  await save.click();
  await expect(page.getByRole("status")).toContainText("berhasil disimpan");
  expect(
    await db.asset.count({
      where: {
        tag: { in: tags },
        locationId: targetId,
        availability: "available",
      },
    }),
  ).toBe(2);
  expect(await db.balance.count({ where: { itemId: toolId } })).toBe(0);
  const transfer = await db.record.findFirstOrThrow({
    where: { kind: "transfer", actorId: prefix + "admin" },
    orderBy: { createdAt: "desc" },
  });
  expect((transfer.payload as { assetIds: string[] }).assetIds.sort()).toEqual(
    (
      await db.asset.findMany({
        where: { tag: { in: tags } },
        select: { id: true },
      })
    )
      .map((a) => a.id)
      .sort(),
  );
  expect(
    await db.audit.count({
      where: { entityId: transfer.id, action: "TRANSFER" },
    }),
  ).toBe(1);
  await expect(quantity).toHaveValue("0");
  await expect(save).toBeDisabled();
  await expect(search).toHaveValue("");
  await item.fill(componentLabel);
  await expect(quantity).not.toHaveAttribute("readonly");
  await expect(page.locator(".unit-picker")).toHaveCount(0);
  const payload = JSON.parse(
    await page.locator('input[name="payload"]').inputValue(),
  );
  expect(payload.assetIds).toEqual([]);
  expect(payload.itemId).toBe(componentId);
});

test("shared controls stay usable across warehouse pages and mobile technician navigation", async ({
  page,
}) => {
  await login(page);
  for (const path of [
    "/admin/items",
    `/admin/items/${toolId}`,
    "/admin/masters",
    "/admin/receipts/new",
    "/admin/requests/new",
    "/admin/loans",
    "/admin/labels",
    "/admin/reports",
    "/admin/settings",
    "/profile",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBeTruthy();
      await expect(
        page.getByRole("link", { name: "Kembali", exact: true }),
      ).toBeVisible();
    }
  }
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/admin/items/${toolId}`);
    await expect(
      page.getByRole("heading", { level: 1, name: toolName }),
    ).toBeVisible();
    await page.screenshot({
      path: `${shots}/item-${width}.png`,
      fullPage: true,
    });
    await page.goto(`/admin/items?q=${prefix}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "Barang", exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: `${shots}/catalog-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  const back = page.getByRole("link", { name: "Kembali", exact: true });
  await expect(back).toBeInViewport();
  expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test("technician deep entry has an app back control on small mobile screens", async ({
  page,
}) => {
  await login(page, "technician");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(`/me/items/${toolId}`);
  await expect(
    page.getByRole("link", { name: "Kembali", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Edit barang", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Kembali", exact: true }).click();
  await expect(page).toHaveURL(/\/me\/items$/);
  await page.getByRole("link", { name: "Kembali", exact: true }).click();
  await expect(page).toHaveURL(/\/me$/);
});
