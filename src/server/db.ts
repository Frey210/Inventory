import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { inventoryDb?: PrismaClient };
export const db =
  globalDb.inventoryDb ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.INVENTORY_DATABASE_URL,
    }),
  });
if (process.env.NODE_ENV !== "production") globalDb.inventoryDb = db;
export type Tx = Prisma.TransactionClient;
export { Prisma };
