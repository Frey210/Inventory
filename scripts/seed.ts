import "dotenv/config";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/server/db";
import { z } from "zod";
const file = process.env.SEED_USERS_FILE;
if (!file)
  throw new Error(
    "SEED_USERS_FILE must reference a local private account file.",
  );
const users = z
  .array(
    z.object({
      username: z.string().min(3),
      name: z.string().min(1),
      role: z.enum(["ADMIN", "WAREHOUSE", "TECHNICIAN", "AUDITOR"]),
      password: z.string().min(16),
    }),
  )
  .parse(JSON.parse(await readFile(file, "utf-8")));
for (const u of users) {
  if (await db.user.findUnique({ where: { username: u.username } })) continue;
  const userId = randomUUID();
  const password = await hashPassword(u.password);
  await db.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        email: `${u.username}@inventory.internal`,
        emailVerified: true,
        username: u.username,
        displayUsername: u.username,
        name: u.name,
        role: u.role,
        isActive: true,
        mustChangePassword: true,
      },
    });
    await tx.account.create({
      data: {
        id: randomUUID(),
        userId,
        providerId: "credential",
        accountId: userId,
        password,
      },
    });
    await tx.audit.create({
      data: {
        actorId: userId,
        action: "ACCOUNT_PROVISIONED",
        entityId: userId,
        payload: { source: "controlled bootstrap", role: u.role },
      },
    });
  });
}
await db.user.upsert({
  where: { id: "system-worker" },
  create: {
    id: "system-worker",
    name: "Inventory Scheduler",
    email: "worker@inventory.internal",
    role: "SYSTEM",
    isActive: true,
    mustChangePassword: false,
  },
  update: {},
});
for (const [code, name, tracking] of [
  ["CONSUMABLE", "Consumable", "quantity"],
  ["EQUIPMENT", "Equipment", "serialized"],
  ["SENSOR", "Sensor Terkontrol", "serialized"],
  ["PROTOTYPE", "Prototype", "serialized"],
  ["PRODUCT", "Produk Jadi", "serialized"],
])
  await db.master.upsert({
    where: { kind_code: { kind: "type", code } },
    create: { kind: "type", code, name, details: { tracking } },
    update: {},
  });
for (const [code, name, fractional] of [
  ["PCS", "Pcs", false],
  ["M", "Meter", true],
  ["L", "Liter", true],
] as const)
  await db.master.upsert({
    where: { kind_code: { kind: "unit", code } },
    create: { kind: "unit", code, name, details: { fractional } },
    update: {},
  });
console.log(
  "Account provisioning and system references complete. No operational stock seeded.",
);
await db.$disconnect();
