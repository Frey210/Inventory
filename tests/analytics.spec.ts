import "dotenv/config";
import { test, expect, type Response } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { mkdir } from "node:fs/promises";
import { db } from "../src/server/db";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("Isolated test database required");
const prefix = "analytics-" + randomUUID().slice(0, 8),
  password = randomBytes(20).toString("base64url");
let locationId: string, itemId: string;
test.use({ extraHTTPHeaders: { "x-forwarded-for": "127.0.0.38" } });
test.beforeAll(async () => {
  await db.user.create({
    data: {
      id: prefix,
      username: prefix,
      name: "Tim Analitik",
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
  const location = await db.master.create({
    data: {
      kind: "location",
      code: prefix,
      name: "Rak komponen IoT",
      details: { locationType: "Rak" },
    },
  });
  locationId = location.id;
  const category = await db.master.create({
    data: { kind: "category", code: prefix, name: "Komponen uji" },
  });
  const unit = await db.master.findUniqueOrThrow({
    where: { kind_code: { kind: "unit", code: "PCS" } },
  });
  const type = await db.master.findUniqueOrThrow({
    where: { kind_code: { kind: "type", code: "CONSUMABLE" } },
  });
  const item = await db.item.create({
    data: {
      sku: prefix,
      name: "Konektor JST untuk prototipe IoT",
      tracking: "quantity",
      typeId: type.id,
      unitId: unit.id,
      categoryId: category.id,
      locationId,
      minStock: "8",
      balances: { create: { locationId, onHand: "11", reserved: "3" } },
    },
  });
  itemId = item.id;
  const tool = await db.item.create({
    data: {
      sku: prefix + "-TOOL",
      name: "Tang kombinasi mini dengan pegangan isolasi untuk perakitan perangkat IoT dan pekerjaan lapangan",
      tracking: "serialized",
      typeId: type.id,
      unitId: unit.id,
      categoryId: category.id,
      locationId,
    },
  });
  await db.asset.createMany({
    data: Array.from({ length: 25 }, (_, n) => ({
      itemId: tool.id,
      locationId,
      tag: prefix + "-MTC-AK001-" + String(n + 1).padStart(3, "0"),
    })),
  });
  await mkdir(".impeccable/review/label-analytics", { recursive: true });
});
test.afterAll(async () => {
  await db.$disconnect();
});
test("analytics separates demand from posting and label choices remain compact and usable", async ({
  page,
}) => {
  const scripts: Promise<string>[] = [];
  const trackScript = (response: Response) => {
    if (
      response.url().includes("/_next/static/") &&
      response.url().endsWith(".js")
    )
      scripts.push(response.text());
  };
  page.on("response", trackScript);
  await page.goto("/login", { waitUntil: "networkidle" });
  expect(
    (await Promise.all(scripts)).some((script) =>
      script.includes("recharts-surface"),
    ),
  ).toBe(false);
  page.off("response", trackScript);
  await page.getByLabel("Username", { exact: true }).fill(prefix);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.goto("/admin/analytics");
  await expect(
    page.getByRole("heading", { name: "Analitik gudang", exact: true }),
  ).toBeVisible();
  const counts = async () =>
    (
      await page.locator(".analytics-kpis .stat > strong").allTextContents()
    ).map((v) => Number(v.replaceAll(".", "")));
  const before = await counts();
  if (before[0] === 0 && before[1] === 0) {
    await expect(page.locator(".analytics-users")).toContainText(
      "Belum ada permintaan",
    );
    await expect(page.locator('[data-chart="members"]')).toHaveCount(0);
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({
        path: `.impeccable/review/modern-charts/empty-${width}.png`,
        fullPage: true,
      });
    }
  }
  const now = new Date(),
    old = new Date(now.getTime() - 40 * 86400000);
  const line = { itemId, locationId, quantity: "2" };
  const submitted = await db.document.create({
    data: {
      kind: "request",
      number: prefix + "-REQ",
      status: "submitted",
      actorId: prefix,
      lines: { create: [line, line] },
    },
  });
  await db.document.create({
    data: {
      kind: "request",
      number: prefix + "-APP",
      status: "approved",
      actorId: prefix,
      lines: { create: line },
    },
  });
  for (const status of ["rejected", "cancelled", "superseded"])
    await db.document.create({
      data: {
        kind: "request",
        number: prefix + "-" + status,
        status,
        actorId: prefix,
        lines: { create: line },
      },
    });
  const issued = await db.document.create({
    data: {
      kind: "request",
      number: prefix + "-OLD",
      status: "fulfilled",
      actorId: prefix,
      createdAt: old,
      postedAt: now,
      lines: {
        create: {
          ...line,
          quantity: "4",
          approved: "4",
          fulfilled: "4",
          returned: "1",
        },
      },
    },
  });
  await db.document.create({
    data: {
      kind: "receipt",
      number: prefix + "-IN",
      status: "posted",
      actorId: prefix,
      postedAt: now,
    },
  });
  await db.ledger.createMany({
    data: [
      {
        itemId,
        locationId,
        quantity: "14",
        action: "RECEIPT",
        referenceId: prefix + "-OPEN",
        actorId: prefix,
        createdAt: old,
      },
      ...[1, 2].map(() => ({
        itemId,
        locationId,
        quantity: "-2",
        action: "ISSUE",
        referenceId: issued.id,
        actorId: prefix,
      })),
      {
        itemId,
        locationId,
        quantity: "1",
        action: "CONSUMABLE_RETURN",
        referenceId: issued.id,
        actorId: prefix,
      },
      {
        itemId,
        locationId,
        quantity: "9",
        action: "TRANSFER",
        referenceId: submitted.id,
        actorId: prefix,
      },
      {
        itemId,
        locationId,
        quantity: "-9",
        action: "TRANSFER",
        referenceId: submitted.id,
        actorId: prefix,
      },
    ],
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Analitik gudang", exact: true }),
  ).toBeVisible();
  expect(await counts()).toEqual([
    before[0] + 2,
    before[1] + 1,
    before[2] + 1,
    before[3],
  ]);
  const row = page
    .locator(".table-wrap tbody tr")
    .filter({ hasText: prefix })
    .first();
  await expect(row).toContainText("1 transaksi");
  expect(await row.locator("td").allTextContents()).toEqual(
    expect.arrayContaining(["4", "1", "8", "Stok menipis"]),
  );
  await page.setViewportSize({ width: 1366, height: 900 });
  for (const chart of ["demand", "items", "members"]) {
    await expect(
      page.locator(`[data-chart="${chart}"] .recharts-surface`),
    ).toBeVisible();
  }
  await expect(
    page.locator('[data-chart="items"] text').filter({ hasText: "…" }).first(),
  ).toContainText("…");
  const itemDetails = page.getByText("Lihat nama dan rincian barang", {
    exact: true,
  });
  await itemDetails.click();
  const firstItem = page
    .locator(".analytics-grid .analytics-ranking li")
    .first();
  const firstSku = await firstItem.locator(".rank-title small").innerText();
  const firstName = await firstItem.locator(".rank-title a").innerText();
  await itemDetails.click();
  await page.locator('[data-chart="items"] .recharts-surface').focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.locator('[data-chart="items"] .recharts-tooltip-wrapper'),
  ).toContainText(firstSku);
  await expect(
    page.locator('[data-chart="items"] .recharts-tooltip-wrapper'),
  ).toContainText(firstName);
  const chart = page.locator('[data-chart="demand"] .recharts-surface');
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.locator('[data-chart="demand"] .recharts-tooltip-wrapper'),
  ).toBeVisible();
  await expect(
    page.locator('[data-chart="demand"] .recharts-tooltip-wrapper'),
  ).toContainText("Permintaan");
  await page
    .getByRole("heading", { name: "Analitik gudang", exact: true })
    .click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: ".impeccable/review/modern-charts/analytics-desktop.png",
    fullPage: true,
  });
  await page.locator(".analytics-grid").screenshot({
    path: ".impeccable/review/modern-charts/charts-desktop.png",
  });
  await page.locator(".analytics-users").screenshot({
    path: ".impeccable/review/modern-charts/members-desktop.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: ".impeccable/review/modern-charts/analytics-mobile.png",
    fullPage: true,
  });
  await page.locator(".analytics-grid").screenshot({
    path: ".impeccable/review/modern-charts/charts-mobile.png",
    style: ".bottom-nav, .skip-link { visibility: hidden !important; }",
  });
  await page.locator(".analytics-users").screenshot({
    path: ".impeccable/review/modern-charts/members-mobile.png",
    style: ".bottom-nav, .skip-link { visibility: hidden !important; }",
  });
  const touch = await page
    .context()
    .browser()!
    .newContext({
      storageState: await page.context().storageState(),
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      reducedMotion: "reduce",
    });
  const phone = await touch.newPage();
  await phone.goto("http://localhost:3030/admin/analytics");
  await phone
    .locator('[data-chart="demand"] .recharts-surface')
    .tap({ position: { x: 150, y: 100 } });
  await expect(
    phone.locator('[data-chart="demand"] .recharts-tooltip-wrapper'),
  ).toBeVisible();
  await touch.close();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBeTruthy();
  }
  await page.goto("/admin/analytics?days=90");
  await expect(
    page.getByRole("link", { name: "90 hari", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.goto(`/admin/labels?q=${prefix}`);
  await expect(page.locator(".label-option")).toHaveCount(25);
  const first = page.locator(".label-option").first();
  await first.getByRole("checkbox").check();
  for (const width of [1366, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    const geometry = await first.evaluate((row) => {
      const input = row.querySelector("input")!.getBoundingClientRect();
      const name = row
        .querySelector(".label-identity")!
        .getBoundingClientRect();
      const rect = row.getBoundingClientRect();
      return {
        aligned: input.right < name.left,
        height: rect.height,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(geometry.aligned).toBeTruthy();
    expect(geometry.height).toBeGreaterThanOrEqual(44);
    expect(geometry.height).toBeLessThan(220);
    expect(geometry.overflow).toBeFalsy();
    if (width !== 320)
      await page.screenshot({
        path: `.impeccable/review/label-analytics/labels-${width === 390 ? "mobile" : "desktop"}.png`,
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".label-option").last().scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("link", { name: "Siapkan cetak", exact: true }),
  ).toBeInViewport();
  await db.user.update({ where: { id: prefix }, data: { role: "TECHNICIAN" } });
  const denied = await page.goto("/admin/analytics");
  expect(denied?.status()).toBe(404);
});
