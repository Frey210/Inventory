import "dotenv/config";
import { test, expect } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { mkdir } from "node:fs/promises";
import { db } from "../src/server/db";

if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("Isolated DB required");
const password = randomBytes(20).toString("base64url");
const users = ["ADMIN", "WAREHOUSE", "TECHNICIAN", "AUDITOR"].map((role) => ({
  role,
  id: randomUUID(),
  username: "account_" + randomUUID().slice(0, 8),
}));
test.beforeAll(async () => {
  for (const user of users)
    await db.user.create({
      data: {
        ...user,
        name: "Tim MTC Inventory",
        email: user.username + "@test.invalid",
        mustChangePassword: false,
        accounts: {
          create: {
            id: user.id,
            accountId: user.id,
            providerId: "credential",
            password: await hashPassword(password),
          },
        },
      },
    });
  await mkdir(".impeccable/review/profile-nav", { recursive: true });
});
test.afterAll(async () => {
  await db.$disconnect();
});

for (const [index, user] of users.entries())
  test(`${user.role}: account menu, separate Back and logout remain usable`, async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": "127.0.0." + (61 + index),
    });
    await page.goto("/login");
    await page.getByLabel("Username", { exact: true }).fill(user.username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    const catalog = user.role === "TECHNICIAN" ? "/me/items" : "/admin/items";
    await expect(page).toHaveURL(
      user.role === "TECHNICIAN" ? /\/me$/ : /admin\/dashboard/,
    );
    await page.goto(catalog);
    const heading = page.getByRole("heading", {
      level: 1,
      name: "Barang",
      exact: true,
    });
    await expect(heading).toBeVisible();
    const trigger = page.getByRole("button", {
      name: "Menu akun Tim MTC Inventory",
      exact: true,
    });
    const popup = page.getByRole("navigation", {
      name: "Menu akun",
      exact: true,
    });
    await expect(page.locator(".topbar .page-back")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Keluar", exact: true }),
    ).toBeHidden();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(popup).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await expect(
      popup.getByRole("link", { name: "Pengaturan akun", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
    for (const width of [320, 390, 768, 844, 1024, 1440]) {
      const height = width === 844 ? 390 : 844;
      await page.setViewportSize({ width, height });
      const back = page.getByRole("link", { name: "Kembali", exact: true });
      await expect(back).toBeVisible();
      if (width < 1024) {
        const header = (await page.locator(".topbar").boundingBox())!;
        const b = (await back.boundingBox())!;
        expect(b.y).toBeGreaterThanOrEqual(header.y + header.height);
        expect(b.height).toBeGreaterThanOrEqual(44);
      }
      await trigger.click();
      await expect(popup).toBeVisible();
      await expect(
        popup.getByRole("link", { name: "Pengaturan aplikasi", exact: true }),
      ).toHaveCount(user.role === "ADMIN" ? 1 : 0);
      const p = (await popup.boundingBox())!;
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + p.width).toBeLessThanOrEqual(width);
      expect(p.y + p.height).toBeLessThanOrEqual(height);
      for (const target of await popup.locator("a,button").all())
        expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (user.role === "ADMIN" && [390, 1440].includes(width))
        await page.screenshot({
          path: `.impeccable/review/profile-nav/menu-${width}.png`,
        });
      await page.keyboard.press("Escape");
      if (user.role === "ADMIN" && [390, 1440].includes(width))
        await page.screenshot({
          path: `.impeccable/review/profile-nav/navigation-${width}.png`,
        });
    }
    await trigger.click();
    await heading.click();
    await expect(popup).toBeHidden();
    await trigger.click();
    await popup
      .getByRole("link", { name: "Pengaturan akun", exact: true })
      .click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(popup).toBeHidden();
    await page.getByRole("link", { name: "Kembali", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(catalog + "$"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByText("Semua menu", { exact: true }).click();
    const mobile = page.getByRole("navigation", {
      name: "Menu mobile",
      exact: true,
    });
    await mobile
      .getByRole("link", { name: "Profil & keamanan", exact: true })
      .click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(mobile).toBeHidden();
    await page.getByText("Semua menu", { exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(mobile).toBeHidden();
    if (user.role === "ADMIN") {
      await page.route("**/api/auth/sign-out", (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ message: "Unavailable" }),
        }),
      );
      await trigger.click();
      await popup.getByRole("button", { name: "Keluar", exact: true }).click();
      await expect(popup.getByRole("alert")).toContainText("Coba lagi");
      await expect(
        popup.getByRole("button", { name: "Keluar", exact: true }),
      ).toBeEnabled();
      await expect(page).toHaveURL(/\/profile$/);
      await page.unroute("**/api/auth/sign-out");
    } else await trigger.click();
    await popup.getByRole("button", { name: "Keluar", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto(catalog);
    await expect(page).toHaveURL(/\/login$/);
  });
