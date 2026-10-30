import "dotenv/config";
import { test, expect, type Page } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/server/db";

if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("Isolated test database required");
const prefix = "feedback2-" + randomUUID().slice(0, 8);
const password = randomBytes(20).toString("base64url");
let loanId: string, assetId: string;
const shots = ".impeccable/review/feedback2";

test.beforeAll(async () => {
  for (const role of ["ADMIN", "TECHNICIAN"]) {
    const id = prefix + role;
    await db.user.create({
      data: {
        id,
        username: id.toLowerCase(),
        name: role === "ADMIN" ? "Admin latihan" : "Teknisi latihan",
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
  const location = await db.master.create({
    data: {
      kind: "location",
      code: prefix,
      name: "Rak alat latihan",
      details: { locationType: "Rak" },
    },
  });
  const category = await db.master.create({
    data: { kind: "category", code: prefix, name: "Alat kerja IoT" },
  });
  const project = await db.master.create({
    data: {
      kind: "project",
      code: prefix + "-WORK",
      name: "Perakitan perangkat IoT",
    },
  });
  const unit = await db.master.findUniqueOrThrow({
    where: { kind_code: { kind: "unit", code: "PCS" } },
  });
  const type = await db.master.findUniqueOrThrow({
    where: { kind_code: { kind: "type", code: "EQUIPMENT" } },
  });
  const item = await db.item.create({
    data: {
      sku: prefix,
      name: "Tang kombinasi mini",
      typeId: type.id,
      unitId: unit.id,
      categoryId: category.id,
      locationId: location.id,
      tracking: "serialized",
    },
  });
  const asset = await db.asset.create({
    data: {
      itemId: item.id,
      locationId: location.id,
      tag: prefix + "-MTC-AK003-001",
      availability: "borrowed",
      custodianId: prefix + "TECHNICIAN",
    },
  });
  assetId = asset.id;
  const request = await db.document.create({
    data: {
      kind: "request",
      number: prefix,
      status: "fulfilled",
      actorId: prefix + "TECHNICIAN",
    },
  });
  const loan = await db.loan.create({
    data: {
      number: prefix + "-LOAN",
      requestId: request.id,
      borrowerId: prefix + "TECHNICIAN",
      projectId: project.id,
      dueAt: new Date(Date.now() + 86400000 * 7),
      snapshot: {},
      lines: { create: { assetId, initial: { condition: "Baik" } } },
    },
  });
  loanId = loan.id;
  await db.asset.update({ where: { id: assetId }, data: { loanId } });
});
test.afterAll(async () => {
  await db.$disconnect();
});

async function login(page: Page, role: string) {
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": role === "ADMIN" ? "127.0.0.40" : "127.0.0.41",
  });
  await page.goto("/login");
  await page
    .getByLabel("Username", { exact: true })
    .fill((prefix + role).toLowerCase());
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(role === "ADMIN" ? /admin\/dashboard/ : /\/me$/);
}

test("success stays in the viewport, pauses, dismisses, repeats and never replaces validation errors", async ({
  page,
}) => {
  await login(page, "ADMIN");
  await page.goto("/admin/masters?tab=project");
  await page.getByRole("textbox", { name: /^Kode/ }).fill(prefix);
  await page.getByRole("textbox", { name: /^Nama/ }).fill("Riset sensor IoT");
  await page.clock.install();
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  const notice = page.locator(".action-feedback");
  await expect(notice).toContainText("Data berhasil disimpan.");
  await expect(page.locator(".data-form .alert.success")).toContainText(
    "berhasil disimpan",
  );
  await expect(page.getByRole("status")).toHaveCount(1);
  await page.getByRole("button", { name: "Tutup notifikasi" }).focus();
  await page.clock.fastForward(10000);
  await expect(notice).toBeVisible();
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await expect(notice).toBeInViewport();
    const box = await notice.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `${shots}/success-${width}.png`,
    });
  }
  await page.getByRole("button", { name: "Tutup notifikasi" }).click();
  await expect(notice).toHaveCount(0);
  await page.getByRole("textbox", { name: /^Kode/ }).fill(prefix + "-2");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(notice).toContainText("Data berhasil disimpan.");
  await page.getByRole("textbox", { name: /^Nama/ }).focus();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(9000);
  await expect(notice).toHaveCount(0);
  await expect(page.locator(".data-form .alert.success")).toBeVisible();
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  const error = page.locator("form.data-form").getByRole("alert");
  await expect(error).toBeVisible();
  await expect(notice).toHaveCount(0);
  await expect(error).toBeFocused();
});

test("return disclosure is a clear keyboard/touch action and submission leaves stock awaiting warehouse receipt", async ({
  page,
}) => {
  await login(page, "TECHNICIAN");
  await page.goto(`/me/loans/${loanId}`);
  const control = page.locator(".loan-return-option > summary");
  await expect(control).toContainText("Ajukan pengembalian");
  await expect(control).toContainText("MTC-AK003-001");
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await control.scrollIntoViewIfNeeded();
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `${shots}/return-${width}.png`,
      fullPage: true,
    });
  }
  await control.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Kondisi aktual")).toBeVisible();
  await page
    .getByLabel("Kondisi, kelengkapan dan catatan")
    .fill("Lengkap dan siap diserahkan ke petugas gudang.");
  await page
    .getByRole("button", { name: "Ajukan Pengembalian", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("berhasil disimpan");
  const asset = await db.asset.findUniqueOrThrow({ where: { id: assetId } });
  expect(asset.availability).toBe("borrowed");
  expect(asset.custodianId).toBe(prefix + "TECHNICIAN");
  const line = await db.loanLine.findUniqueOrThrow({
    where: { loanId_assetId: { loanId, assetId } },
  });
  expect(line.receivedAt).toBeNull();
  expect(line.inspectedAt).toBeNull();
  expect(
    await db.loanEvent.count({ where: { loanId, type: "request-return" } }),
  ).toBe(1);
  await page.getByRole("button", { name: "Tutup notifikasi" }).click();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBeTruthy();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `${shots}/return-open-390.png`,
    fullPage: true,
  });
});
