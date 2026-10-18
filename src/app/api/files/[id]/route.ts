import { readyUser } from "@/server/policy";
import { db } from "@/server/db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await readyUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const file = await db.file.findUnique({ where: { id: (await params).id } });
  if (!file) return new Response("Not found", { status: 404 });
  if (
    user.role === "TECHNICIAN" &&
    file.ownerId !== user.id &&
    !(await db.item.findFirst({ where: { photoId: file.id, active: true } })) &&
    !(await db.master.findFirst({
      where: {
        kind: "category",
        active: true,
        details: { path: ["photoId"], equals: file.id },
      },
    })) &&
    !(await db.loanEvent.findFirst({
      where: {
        loan: { borrowerId: user.id },
        payload: { path: ["photoId"], equals: file.id },
      },
    }))
  )
    return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(
      /* turbopackIgnore: true */ join(
        /* turbopackIgnore: true */ process.env.STORAGE_PATH || "./storage",
        file.storageKey,
      ),
    );
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": file.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
