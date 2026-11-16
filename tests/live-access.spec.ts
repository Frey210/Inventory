import "dotenv/config";
import { test, expect } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/server/db";

if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("Isolated test database required");
const prefix = "live-" + randomUUID().slice(0, 8);
const password = randomBytes(20).toString("base64url");
const roles = ["ADMIN", "WAREHOUSE", "AUDITOR", "INITIAL", "DISABLED"];

test.beforeAll(async () => {
  const hashed = await hashPassword(password);
  for (const role of roles) {
    const id = prefix + role.toLowerCase();
    await db.user.create({
      data: {
        id,
        username: id,
        email: id + "@test.invalid",
        name: "Live access test",
        role: ["INITIAL", "DISABLED"].includes(role) ? "ADMIN" : role,
        mustChangePassword: role === "INITIAL",
        isActive: role !== "DISABLED",
        twoFactorEnabled: false,
        accounts: {
          create: {
            id,
            accountId: id,
            providerId: "credential",
            password: hashed,
          },
        },
      },
    });
  }
});
test.afterAll(async () => {
  await db.$disconnect();
});

test("live mode permits optional MFA while retaining password and inactive-account gates", async ({
  browser,
  request,
}) => {
  expect((await (await request.get("/api/health")).json()).mode).toBe("live");
  for (const role of roles) {
    // Give each simulated user its own client IP so other suites do not consume its login allowance.
    const context = await browser.newContext({
      extraHTTPHeaders: {
        "x-forwarded-for": `192.0.2.${roles.indexOf(role) + 1}`,
      },
    });
    try {
      const login = await context.request.post("/api/auth/sign-in/username", {
        data: { username: prefix + role.toLowerCase(), password },
      });
      if (role === "DISABLED") {
        const page = await context.newPage();
        await page.goto("/admin/dashboard");
        await expect(page).toHaveURL(/\/login$/);
        continue;
      }
      expect(login.status(), role).toBe(200);
      expect((await login.json()).twoFactorRedirect).not.toBe(true);
      const page = await context.newPage();
      await page.goto("/admin/dashboard");
      if (role === "INITIAL") {
        await expect(page).toHaveURL(/\/profile$/);
        expect(
          (
            await context.request.get("/api/reports?type=audit&format=csv")
          ).status(),
        ).toBe(403);
      } else {
        await expect(page).toHaveURL(/\/admin\/dashboard$/);
        expect(
          (
            await context.request.get("/api/reports?type=audit&format=csv")
          ).status(),
        ).toBe(200);
      }
    } finally {
      await context.close();
    }
  }
});
