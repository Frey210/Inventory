import { readyUser } from "@/server/policy";
import { db } from "@/server/db";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
export async function POST(request: Request) {
  const user = await readyUser();
  if (!user)
    return Response.json({ error: "Sesi tidak valid." }, { status: 401 });
  if (user.role === "AUDITOR" || user.mustChangePassword)
    return Response.json({ error: "Akses upload ditolak." }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin !== process.env.BETTER_AUTH_URL)
    return Response.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      return Response.json(
        { error: "Foto harus JPEG/PNG/WebP, maksimum 5 MB." },
        { status: 400 },
      );
    const data = Buffer.from(await file.arrayBuffer());
    const decoder = sharp(data, { limitInputPixels: 20_000_000 });
    const meta = await decoder.metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format || ""))
      throw new Error("Format foto tidak valid.");
    const output = await decoder
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const key = randomUUID() + ".jpg";
    const storage = process.env.STORAGE_PATH || "./storage";
    await mkdir(storage, { recursive: true });
    await writeFile(join(storage, key), output, { flag: "wx", mode: 0o600 });
    const row = await db.$transaction(async (tx) => {
      const row = await tx.file.create({
        data: {
          ownerId: user.id,
          name: file.name.slice(0, 150),
          mime: "image/jpeg",
          storageKey: key,
          hash: createHash("sha256").update(output).digest("hex"),
          size: output.length,
        },
      });
      await tx.audit.create({
        data: {
          actorId: user.id,
          action: "PHOTO_UPLOADED",
          entityId: row.id,
          payload: { size: row.size },
        },
      });
      return row;
    });
    return Response.json({ id: row.id });
  } catch {
    return Response.json(
      { error: "Foto gagal diproses. Periksa format/dimensi lalu coba lagi." },
      { status: 400 },
    );
  }
}
