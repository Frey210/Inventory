import "dotenv/config";
import { PgBoss } from "pg-boss";
import { mkdir, writeFile, rename, readFile } from "node:fs/promises";
import sharp from "sharp";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { db } from "../server/db";
import { expireReservations } from "../server/inventory";
import { renderLoanPdf } from "../server/documents/render";
import { reminders } from "../server/reminders";
const storage = process.env.STORAGE_PATH || "./storage";
await mkdir(storage, { recursive: true });
const boss = new PgBoss({
  connectionString: process.env.INVENTORY_DATABASE_URL!,
  schema: "inventory_jobs",
  createSchema: false,
  migrate: false,
});
boss.on("error", () =>
  console.error("Worker queue error; check database connectivity."),
);
await boss.start();
await boss.work<{ snapshotId: string }>(
  "pdf",
  { localConcurrency: 1 },
  async (jobs) => {
    for (const job of jobs) {
      const snap = await db.snapshot.findUniqueOrThrow({
        where: { id: job.data.snapshotId },
      });
      if (snap.status === "ready") continue;
      try {
        const events =
          (snap.payload as { events?: { payload?: { photoId?: string } }[] })
            .events || [];
        const photos: Record<string, string> = {};
        for (const id of new Set(
          events.map((e) => e.payload?.photoId).filter((v): v is string => !!v),
        )) {
          const file = await db.file.findUnique({ where: { id } });
          if (!file) continue;
          try {
            const data = await readFile(join(storage, file.storageKey));
            photos[id] =
              "data:image/jpeg;base64," +
              (
                await sharp(data)
                  .resize(500, 400, { fit: "inside" })
                  .jpeg({ quality: 70 })
                  .toBuffer()
              ).toString("base64");
          } catch {
            /* The archived reference remains visible if a photo cannot be loaded. */
          }
        }
        const pdf = await renderLoanPdf(
          snap.payload,
          snap.version,
          process.env.BETTER_AUTH_URL!,
          photos,
        );
        const key = `${snap.id}.pdf`;
        const temp = join(storage, `${snap.id}.tmp`);
        await writeFile(temp, pdf, { mode: 0o600 });
        await rename(temp, join(storage, key));
        await db.snapshot.update({
          where: { id: snap.id },
          data: {
            status: "ready",
            storageKey: key,
            checksum: createHash("sha256").update(pdf).digest("hex"),
          },
        });
      } catch {
        await db.snapshot.update({
          where: { id: snap.id },
          data: { status: "failed" },
        });
        throw new Error("PDF generation failed; retry scheduled.");
      }
    }
  },
);
let busy = false;
async function tick() {
  if (busy) return;
  busy = true;
  try {
    const events = await db.outbox.findMany({
      where: { sentAt: null },
      take: 50,
      orderBy: { createdAt: "asc" },
    });
    for (const event of events) {
      await boss.send(event.type, event.payload as object, {
        singletonKey: event.id,
        singletonSeconds: 3600,
      });
      await db.outbox.update({
        where: { id: event.id },
        data: { sentAt: new Date() },
      });
    }
    await expireReservations();
    await reminders();
    await writeFile(
      join(storage, "worker-heartbeat"),
      new Date().toISOString(),
    );
  } catch {
    console.error("Worker tick failed; will retry.");
  } finally {
    busy = false;
  }
}
await tick();
const interval = setInterval(tick, 10000);
async function stop() {
  clearInterval(interval);
  await boss.stop();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
console.log("Inventory worker ready");
