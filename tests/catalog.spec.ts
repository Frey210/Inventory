import "dotenv/config";
import { test, expect } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { randomUUID, randomBytes } from "node:crypto";
import { db } from "../src/server/db";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("UI tests require isolated DB");
const suffix = randomUUID();
const admin = "catalog_" + suffix.slice(0, 8);
const password = randomBytes(20).toString("base64url");
const prefix = "CAT-" + suffix;
const item = prefix + "-item",
  tool = prefix + "-tool",
  location = prefix + "-rack",
  category = prefix + "-category";
test.beforeAll(async () => {
  await db.user.create({
    data: {
      id: prefix,
      name: "Catalog Review",
      username: admin,
      email: admin + "@test.invalid",
      role: "ADMIN",
      isActive: true,
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
  for (const [id, kind, name] of [
    [location, "location", "B2"],
    [category, "category", prefix],
    [prefix + "-unit", "unit", "pcs"],
    [prefix + "-type", "type", "Komponen"],
    [prefix + "-project", "project", "Riset IoT"],
  ])
    await db.master.create({
      data: {
        id,
        kind,
        code: id,
        name,
        details: kind === "location" ? { locationType: "Rak" } : {},
      },
    });
  await db.item.create({
    data: {
      id: item,
      sku: prefix + "-PCB",
      name: "PCB " + prefix,
      categoryId: category,
      typeId: prefix + "-type",
      unitId: prefix + "-unit",
      locationId: location,
      tracking: "quantity",
      minStock: 3,
      balances: { create: { locationId: location, onHand: 2 } },
    },
  });
  await db.master.create({
    data: {
      id: location + "-other",
      kind: "location",
      code: location + "-other",
      name: "B3",
    },
  });
  await db.balance.create({
    data: { itemId: item, locationId: location + "-other", onHand: 4 },
  });
  await db.item.create({
    data: {
      id: tool,
      sku: prefix + "-TOOL",
      name: "Sensor " + prefix,
      categoryId: category,
      typeId: prefix + "-type",
      unitId: prefix + "-unit",
      locationId: location,
      tracking: "serialized",
      assets: {
        create: {
          tag: prefix,
          locationId: location,
          condition: "Baik",
          technical: "Normal",
          calibrationRequired: true,
          validUntil: new Date("2020-01-01"),
        },
      },
    },
  });
});
test.afterAll(async () => {
  await db.$disconnect();
});
test("catalog filters, eligible stock, mobile cards and request shortcuts", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(admin);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.goto(
    "/admin/items?category=" +
      encodeURIComponent(category) +
      "&location=" +
      encodeURIComponent(location),
  );
  await expect(page.locator(".inventory-card")).toHaveCount(2);
  await expect(
    page.locator(`a.inventory-card[href='/admin/items/${tool}'] .stock-status`),
  ).toHaveText("Habis");
  await expect(
    page.locator(`a.inventory-card[href='/admin/items/${item}'] .stock-status`),
  ).toHaveText("Menipis");
  await page
    .getByRole("link", { name: "Komponen & bahan", exact: true })
    .click();
  await expect(page.locator(".inventory-card")).toHaveCount(1);
  await expect(page.locator(".inventory-card .item-stock strong")).toHaveText(
    "2pcs",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("link", { name: "Tampilan daftar", exact: true })
    .click();
  await expect(page.locator(".inventory-list")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.goto(`/admin/items/${item}`);
  await page.getByRole("link", { name: "Ambil komponen", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ambil komponen", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Kapan alat akan dikembalikan?")).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Barang", exact: true }),
  ).toHaveValue(item);
  await page
    .getByRole("combobox", { name: /Proyek \/ pekerjaan/ })
    .selectOption(prefix + "-project");
  await page
    .getByRole("textbox", { name: /Tujuan penggunaan/ })
    .fill("Riset prototipe IoT tim");
  await page
    .getByRole("button", { name: "Kirim permintaan", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("berhasil disimpan");
  expect(
    (
      await db.balance.findUniqueOrThrow({
        where: { itemId_locationId: { itemId: item, locationId: location } },
      })
    ).onHand.toString(),
  ).toBe("2");
  await page
    .locator(".request-mode")
    .getByRole("link", { name: "Pinjam alat", exact: true })
    .click();
  await expect(page.getByLabel("Kapan alat akan dikembalikan?")).toBeVisible();
  await expect(
    page.getByLabel("Kapan alat akan dikembalikan?"),
  ).toHaveAttribute("required", "");
  for (const width of [375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.goto("/admin/masters");
  await page.setViewportSize({ width: 390, height: 844 });
  const edit = page
    .locator(".table-wrap")
    .getByRole("link", { name: "Edit", exact: true })
    .first();
  if (await edit.count()) {
    const rect = await edit.boundingBox();
    expect(rect?.height).toBeGreaterThanOrEqual(44);
  }
});
