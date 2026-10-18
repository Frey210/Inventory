import "dotenv/config";
import { test, expect } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { randomUUID, randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { db } from "../src/server/db";
import { auth } from "../src/server/auth";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw new Error("E2E requires isolated test database");
const username = "smoke_" + randomUUID().slice(0, 8);
const password = randomBytes(20).toString("base64url");
test.beforeAll(async () => {
  const id = randomUUID();
  await db.user.create({
    data: {
      id,
      email: `${username}@test.invalid`,
      name: "Smoke Test Admin",
      username,
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
      accounts: {
        create: {
          id: randomUUID(),
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
test("login, master setup, private access and desktop/mobile layout", async ({
  page,
  request,
}) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  expect((await request.get("/api/reports")).status()).toBe(403);
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.getByRole("link", { name: "Master Data", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Master Data", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: /^Kode/ })
    .fill("SMOKE-" + Date.now());
  await page.getByRole("textbox", { name: /^Nama/ }).fill("Gudang Smoke Test");
  await page.getByLabel("Tipe lokasi").selectOption("Gudang");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("berhasil disimpan");
  await mkdir(".impeccable/review", { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("heading", { name: "Master Data", exact: true })
    .evaluate((e) => {
      e.setAttribute("tabindex", "-1");
      (e as HTMLElement).focus();
    });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: ".impeccable/review/desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: ".impeccable/review/mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  for (const width of [768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `.impeccable/review/master-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.goto("/admin/settings");
  await page
    .getByRole("combobox", { name: /^Timezone/ })
    .selectOption("Asia/Jakarta");
  await page.getByLabel("Masa reservasi").fill("36");
  await page.getByLabel("Kode formulir QMS").fill("UJI-QMS");
  await page
    .getByLabel("Dasar keputusan")
    .fill("Pengujian simpan dan buka ulang");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("berhasil disimpan");
  await page.reload();
  await expect(page.getByRole("combobox", { name: /^Timezone/ })).toHaveValue(
    "Asia/Jakarta",
  );
  await expect(page.getByLabel("Masa reservasi")).toHaveValue("36");
  await expect(page.getByLabel("Kode formulir QMS")).toHaveValue("UJI-QMS");
  await page.goto("/admin/items/new");
  await expect(
    page.getByRole("heading", { name: "Tambah Katalog Barang" }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: /^Kategori/ })).toBeVisible();
  const csv = await page.request.get("/api/reports?type=loans&format=csv");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("LOAN");
  expect((await page.request.get("/api/reports?from=invalid")).status()).toBe(
    400,
  );
  const enrollment = await page.request.post("/api/auth/two-factor/enable", {
    headers: { Origin: "http://localhost:3030" },
    data: { password },
  });
  expect(enrollment.status()).toBe(200);
  const data = await enrollment.json();
  const encoded = new URL(data.totpURI).searchParams.get("secret")!;
  const bits = Array.from(encoded, (c) =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c).toString(2).padStart(5, "0"),
  ).join("");
  const secret = Buffer.from(
    bits.match(/.{8}/g)!.map((byte) => parseInt(byte, 2)),
  ).toString("utf8");
  const generated = await auth.api.generateTOTP({ body: { secret } });
  const verified = await page.request.post("/api/auth/two-factor/verify-totp", {
    headers: { Origin: "http://localhost:3030" },
    data: { code: generated.code },
  });
  expect(verified.status()).toBe(200);
  await page.request.post("/api/auth/sign-out", {
    headers: { Origin: "http://localhost:3030" },
    data: {},
  });
  const login = await page.request.post("/api/auth/sign-in/username", {
    headers: { Origin: "http://localhost:3030" },
    data: { username, password },
  });
  expect((await login.json()).twoFactorRedirect).toBe(true);
  const recovery = await page.request.post(
    "/api/auth/two-factor/verify-backup-code",
    {
      headers: { Origin: "http://localhost:3030" },
      data: { code: data.backupCodes[0] },
    },
  );
  expect(recovery.status()).toBe(200);
});
