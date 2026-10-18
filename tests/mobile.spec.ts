import "dotenv/config";
import { test, expect } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { mkdir } from "node:fs/promises";
import { db } from "../src/server/db";

if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("Isolated DB required");
const password = randomBytes(20).toString("base64url");
const users = ["ADMIN", "TECHNICIAN"].map((role) => ({
  role,
  id: randomUUID(),
  username: "mobile_" + randomUUID().slice(0, 8),
}));
test.beforeAll(async () => {
  for (const u of users)
    await db.user.create({
      data: {
        ...u,
        name: "Mobile Review",
        email: u.username + "@test.invalid",
        isActive: true,
        mustChangePassword: false,
        accounts: {
          create: {
            id: u.id,
            accountId: u.id,
            providerId: "credential",
            password: await hashPassword(password),
          },
        },
      },
    });
  await mkdir(".impeccable/review/mobile", { recursive: true });
});
test.afterAll(async () => {
  await db.$disconnect();
});
for (const u of users)
  test(`${u.role}: mobile navigation stays aligned, readable and clear of content`, async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({
      "x-forwarded-for": u.role === "ADMIN" ? "127.0.0.34" : "127.0.0.35",
    });
    await page.goto("/login");
    await page.getByLabel("Username", { exact: true }).fill(u.username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page).toHaveURL(
      u.role === "ADMIN" ? /admin\/dashboard/ : /\/me$/,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: /^Halo,/ }),
    ).toBeVisible();
    await expect(page.locator("meta[name=viewport]")).toHaveAttribute(
      "content",
      /viewport-fit=cover/,
    );
    const nav = page.getByRole("navigation", { name: "Navigasi cepat" });
    for (const width of [320, 375, 390, 768, 844]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
      await expect(nav).toBeVisible();
      const geometry = await nav.evaluate((element) => {
        const navRect = element.getBoundingClientRect();
        const links = [...element.querySelectorAll("a")].map((link) => {
          const r = link.getBoundingClientRect(),
            label = link.querySelector("span")!;
          return {
            width: r.width,
            height: r.height,
            top: r.top,
            labelHeight: label.getBoundingClientRect().height,
            fits: label.scrollWidth <= r.width,
            nowrap: getComputedStyle(label).whiteSpace,
          };
        });
        return {
          links,
          bottom: navRect.bottom,
          height: navRect.height,
          overflow: document.documentElement.scrollWidth > innerWidth,
          clearance: parseFloat(
            getComputedStyle(document.querySelector("main")!).paddingBottom,
          ),
        };
      });
      expect(geometry.links).toHaveLength(5);
      expect(new Set(geometry.links.map((l) => l.top)).size).toBe(1);
      expect(new Set(geometry.links.map((l) => l.height)).size).toBe(1);
      for (const link of geometry.links) {
        expect(link.width).toBeGreaterThanOrEqual(44);
        expect(link.height).toBeGreaterThanOrEqual(48);
        expect(link.labelHeight).toBeLessThan(20);
        expect(link.fits).toBe(true);
        expect(link.nowrap).toBe("nowrap");
      }
      expect(geometry.overflow).toBe(false);
      expect(geometry.bottom).toBe(width === 844 ? 390 : 844);
      expect(geometry.clearance).toBeGreaterThan(geometry.height);
      if (width === 390)
        await page.screenshot({
          path: `.impeccable/review/mobile/${u.role}-390.png`,
          fullPage: true,
        });
    }
    if (u.role === "TECHNICIAN") {
      await nav.getByRole("link", { name: "Pinjaman", exact: true }).click();
      await expect(page).toHaveURL(/\/me\/loans$/);
      await expect(
        nav.getByRole("link", { name: "Pinjaman", exact: true }),
      ).toHaveAttribute("aria-current", "page");
    }
    await page.setViewportSize({ width: 1440, height: 960 });
    await expect(nav).toBeHidden();
    await expect(page.locator(".sidebar")).toBeVisible();
    await expect(
      page.getByRole("status", { name: "Memuat halaman", exact: true }),
    ).toBeHidden();
    await page.screenshot({
      path: `.impeccable/review/mobile/${u.role}-1440.png`,
      fullPage: true,
    });
  });
