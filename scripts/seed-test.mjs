import { Pool } from "pg";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw new Error("Test database required");
const pool = new Pool({ connectionString: process.env.INVENTORY_DATABASE_URL });
for (const [code, name, tracking] of [
  ["CONSUMABLE", "Consumable", "quantity"],
  ["EQUIPMENT", "Equipment", "serialized"],
])
  await pool.query(
    'INSERT INTO "Master" (id,kind,code,name,details,"updatedAt") VALUES ($1,\'type\',$2,$3,$4,now()) ON CONFLICT (kind,code) DO NOTHING',
    [crypto.randomUUID(), code, name, JSON.stringify({ tracking })],
  );
await pool.query(
  "INSERT INTO \"Master\" (id,kind,code,name,details,\"updatedAt\") VALUES ($1,'unit','PCS','Pcs','{\"fractional\":false}',now()) ON CONFLICT (kind,code) DO NOTHING",
  [crypto.randomUUID()],
);
await pool.end();
