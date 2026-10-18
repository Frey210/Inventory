import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { execute } from "../src/server/inventory";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw new Error("Isolated inventory_test database required");
test("inactive master blocks new transactions but historical consumable return remains receivable; auditor cannot submit mutations", async () => {
  const suffix = randomUUID().slice(0, 8);
  const actors = await Promise.all(
    ["ADMIN", "WAREHOUSE", "TECHNICIAN", "AUDITOR"].map((role) =>
      db.user.create({
        data: {
          id: randomUUID(),
          name: `Policy ${role}`,
          email: `${role}-${suffix}@test.invalid`,
          role,
          mustChangePassword: false,
        },
      }),
    ),
  );
  const [admin, warehouse, tech, auditor] = actors;
  const run = async (actor: typeof admin, action: string, payload: unknown) =>
    (await execute(actor, randomUUID(), action, payload)) as { id: string };
  try {
    const location = await run(admin, "master", {
      kind: "location",
      code: "POL-L-" + suffix,
      name: "Policy Location",
    });
    const child = await run(admin, "master", {
      kind: "location",
      code: "POL-C-" + suffix,
      name: "Policy Child",
      parentId: location.id,
    });
    await assert.rejects(
      run(admin, "master", {
        id: location.id,
        version: 1,
        kind: "location",
        code: "POL-L-" + suffix,
        name: "Policy Location",
        active: false,
      }),
      /turunan/,
    );
    const category = await run(admin, "master", {
      kind: "category",
      code: "POL-K-" + suffix,
      name: "Policy Category",
    });
    const project = await run(admin, "master", {
      kind: "project",
      code: "POL-P-" + suffix,
      name: "Policy Project",
    });
    const type = await db.master.findUniqueOrThrow({
      where: { kind_code: { kind: "type", code: "CONSUMABLE" } },
    });
    const unit = await db.master.findUniqueOrThrow({
      where: { kind_code: { kind: "unit", code: "PCS" } },
    });
    const item = await run(admin, "item", {
      sku: "POL-S-" + suffix,
      name: "Policy Item",
      typeId: type.id,
      categoryId: category.id,
      unitId: unit.id,
      locationId: child.id,
      minStock: "0",
    });
    const line = { itemId: item.id, locationId: child.id, quantity: "2" };
    const receipt = await run(warehouse, "receipt", {
      purpose: "Policy fixture",
      lines: [line],
    });
    await run(warehouse, "post-receipt", { id: receipt.id });
    const request = await run(tech, "request", {
      purpose: "Policy fixture",
      projectId: project.id,
      lines: [line],
    });
    await run(warehouse, "approve", { id: request.id });
    await run(tech, "acknowledge", { id: request.id });
    await run(warehouse, "issue", { id: request.id });
    const issued = await db.line.findFirstOrThrow({
      where: { documentId: request.id },
    });
    await run(admin, "master", {
      id: category.id,
      version: 1,
      kind: "category",
      code: "POL-K-" + suffix,
      name: "Policy Category",
      active: false,
    });
    await assert.rejects(
      run(tech, "request", {
        purpose: "Inactive category",
        projectId: project.id,
        lines: [line],
      }),
      /tidak aktif/,
    );
    await assert.rejects(
      run(auditor, "consumable-return", {
        lineId: issued.id,
        quantity: "1",
        reason: "Auditor must not mutate",
      }),
      /izin/,
    );
    await run(warehouse, "consumable-return", {
      lineId: issued.id,
      quantity: "1",
      reason: "Physical return after category retirement",
      receive: true,
    });
    assert.equal(
      (
        await db.balance.findUniqueOrThrow({
          where: {
            itemId_locationId: { itemId: item.id, locationId: child.id },
          },
        })
      ).onHand.toString(),
      "1",
    );
  } finally {
    await db.$disconnect();
  }
});
