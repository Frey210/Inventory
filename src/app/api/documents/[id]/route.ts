import { readyUser } from "@/server/policy";
import { db } from "@/server/db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const u = await readyUser();
  if (!u) return new Response("Unauthorized", { status: 401 });
  const doc = await db.snapshot.findUnique({
    where: { id: (await params).id },
    include: { loan: true },
  });
  if (!doc || (u.role === "TECHNICIAN" && doc.loan.borrowerId !== u.id))
    return new Response("Not found", { status: 404 });
  if (doc.status !== "ready" || !doc.storageKey)
    return new Response("Bukti belum siap", { status: 409 });
  try {
    const data = await readFile(
      /* turbopackIgnore: true */ join(
        /* turbopackIgnore: true */ process.env.STORAGE_PATH || "./storage",
        doc.storageKey,
      ),
    );
    await db.audit.create({
      data: {
        actorId: u.id,
        action: "DOCUMENT_DOWNLOADED",
        entityId: doc.id,
        payload: { version: doc.version, loan: doc.loan.number },
      },
    });
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.loan.number}-v${doc.version}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Berkas belum dapat diakses", { status: 503 });
  }
}
