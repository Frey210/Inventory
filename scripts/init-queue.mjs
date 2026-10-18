import { PgBoss } from "pg-boss";
const boss = new PgBoss({
  connectionString: process.env.INVENTORY_DATABASE_URL,
  schema: "inventory_jobs",
  createSchema: false,
});
await boss.start();
await boss.createQueue("pdf", {
  retryLimit: 5,
  retryDelay: 30,
  retryBackoff: true,
});
await boss.stop();
console.log("Inventory PDF queue initialized");
