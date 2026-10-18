import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { db } from "../src/server/db";
import { execute } from "../src/server/inventory";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw new Error("Isolated inventory_test database required");
test("account reset preserves role, revokes sessions and never audits a password", async () => {
  const suffix = randomUUID();
  const admin = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Account Test Admin",
      email: `${suffix}@test.invalid`,
      role: "ADMIN",
      mustChangePassword: false,
    },
  });
  const first = randomBytes(20).toString("base64url"),
    second = randomBytes(20).toString("base64url");
  try {
    const created = (await execute(admin, randomUUID(), "user-create", {
      username: "reset_" + suffix.slice(0, 8),
      name: "Reset Test Gudang",
      role: "WAREHOUSE",
      password: first,
      reason: "Simulasi provisioning akun",
    })) as { id: string };
    await db.session.create({
      data: {
        id: randomUUID(),
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 86400000),
        userId: created.id,
      },
    });
    await execute(admin, randomUUID(), "user-reset", {
      id: created.id,
      password: second,
      reason: "Simulasi pemulihan akun",
    });
    const user = await db.user.findUniqueOrThrow({ where: { id: created.id } });
    assert.equal(user.role, "WAREHOUSE");
    assert.equal(user.mustChangePassword, true);
    assert.equal(await db.session.count({ where: { userId: user.id } }), 0);
    const audit = await db.audit.findMany({ where: { entityId: user.id } });
    assert.equal(
      (
        audit.find((a) => a.action === "USER-RESET")?.payload as {
          role: string;
        }
      ).role,
      "WAREHOUSE",
    );
    assert.ok(!JSON.stringify(audit).includes(first));
    assert.ok(!JSON.stringify(audit).includes(second));
  } finally {
    await db.$disconnect();
  }
});
