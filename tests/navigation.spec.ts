import "dotenv/config";
import { test, expect } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import pg from "pg";
import { mkdir, writeFile } from "node:fs/promises";
import { db } from "../src/server/db";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("Navigation tests require isolated DB");
// Separate simulated client so other suites do not exhaust the shared sign-in rate limit.
test.use({ extraHTTPHeaders: { "x-forwarded-for": "127.0.0.33" } });
const username = "nav_" + randomUUID().slice(0, 8),
  password = randomBytes(20).toString("base64url"),
  id = randomUUID();
test.beforeAll(async () => {
  await db.user.create({
    data: {
      id,
      name: "Navigation Review",
      username,
      email: username + "@test.invalid",
      role: "ADMIN",
      isActive: true,
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
});
test.afterAll(async () => {
  await db.$disconnect();
});
test("navigation reacts immediately, streams loading while data waits, and search avoids a document reload", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const signedIn = page.waitForResponse((response) =>
    response.url().endsWith("/api/auth/sign-in/username"),
  );
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  expect((await signedIn).status()).toBe(200);
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.waitForLoadState("networkidle");
  const hydrated = await page.evaluate(() => {
    (window as Window & { navigationTest?: string }).navigationTest =
      "preserved";
    return true;
  });
  expect(hydrated).toBeTruthy();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname === "/admin/items" && url.searchParams.has("_rsc"),
    async (route) => {
      await gate;
      await route.continue();
    },
  );
  const click = page.locator('.sidebar a[href="/admin/items"]').click();
  try {
    await expect(
      page.getByRole("status", { name: "Membuka halaman", exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
  await click;
  await page.waitForURL(/\/admin\/items/);
  await expect(
    page.getByRole("heading", { name: "Barang", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Membuka halaman", exact: true }),
  ).toHaveCount(0);
  await page.unrouteAll({ behavior: "wait" });
  let documentRequests = 0;
  page.on("request", (r) => {
    if (r.isNavigationRequest() && r.resourceType() === "document")
      documentRequests++;
  });
  await page
    .locator(".catalog-toolbar")
    .getByRole("textbox")
    .fill("not-present-navigation-check");
  let searchRelease!: () => void;
  const searchGate = new Promise<void>((resolve) => {
    searchRelease = resolve;
  });
  await page.route(
    (url) =>
      url.pathname === "/admin/items" &&
      url.searchParams.get("q") === "not-present-navigation-check" &&
      url.searchParams.has("_rsc"),
    async (route) => {
      await searchGate;
      await route.continue();
    },
  );
  const searchButton = page
    .locator(".catalog-toolbar")
    .getByRole("button", { name: "Terapkan", exact: true });
  const searching = searchButton.click();
  try {
    await expect(searchButton).toHaveAttribute("aria-busy", "true");
  } finally {
    searchRelease();
  }
  await searching;
  await page.waitForURL(/q=not-present-navigation-check/);
  await expect(
    page.getByRole("heading", { name: "Barang tidak ditemukan", exact: true }),
  ).toBeVisible();
  expect(documentRequests).toBe(0);
  expect(
    await page.evaluate(
      () => (window as Window & { navigationTest?: string }).navigationTest,
    ),
  ).toBe("preserved");
  await page.unrouteAll({ behavior: "wait" });
  const lock = new pg.Client({
    connectionString: process.env.INVENTORY_DATABASE_URL,
  });
  await lock.connect();
  await lock.query("BEGIN");
  await lock.query('LOCK TABLE "Master" IN ACCESS EXCLUSIVE MODE');
  const navigating = page.goto("/admin/masters");
  try {
    await expect(
      page.getByRole("status", { name: "Memuat halaman", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Menu utama", exact: true }),
    ).toBeVisible();
    await mkdir(".impeccable/review/performance", { recursive: true });
    await page.screenshot({
      path: ".impeccable/review/performance/loading-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: ".impeccable/review/performance/loading-mobile.png",
      fullPage: true,
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page
        .locator(".loading-spinner")
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
  } finally {
    await lock.query("ROLLBACK");
    await lock.end();
  }
  await navigating;
  await expect(
    page.getByRole("heading", { name: "Master Data", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Memuat halaman", exact: true }),
  ).toHaveCount(0);
  // A slow camera module may finish after Stop; it must not turn the camera on.
  await db.user.update({ where: { id }, data: { role: "TECHNICIAN" } });
  await page.goto("/me/pickups");
  await page.addInitScript(() => {});
  await page.evaluate(() => {
    (window as Window & { cameraCalls?: number }).cameraCalls = 0;
    navigator.mediaDevices.getUserMedia = async () => {
      (window as Window & { cameraCalls?: number }).cameraCalls!++;
      throw new Error("test camera denied");
    };
  });
  let cameraRelease!: () => void;
  const cameraGate = new Promise<void>((resolve) => {
    cameraRelease = resolve;
  });
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    await cameraGate;
    await route.continue();
  });
  await page
    .getByRole("button", { name: "Aktifkan Kamera", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Menyiapkan kamera/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hentikan Kamera", exact: true })
    .click();
  cameraRelease();
  await page.unrouteAll({ behavior: "wait" });
  await expect(
    page.getByRole("button", { name: "Aktifkan Kamera", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => (window as Window & { cameraCalls?: number }).cameraCalls,
    ),
  ).toBe(0);
  await page
    .getByRole("button", { name: "Aktifkan Kamera", exact: true })
    .click();
  await expect(page.locator(".panel p[role=alert]")).toHaveText(
    "Akses kamera belum tersedia. Gunakan input kode manual.",
  );
  expect(
    await page.evaluate(
      () => (window as Window & { cameraCalls?: number }).cameraCalls,
    ),
  ).toBe(1);
  await writeFile(
    ".impeccable/review/performance/checks.json",
    JSON.stringify({
      navigationFeedback: true,
      streamedSkeleton: true,
      searchDocumentReloads: documentRequests,
      reducedMotion: true,
      cameraStop: true,
    }),
  );
});
