import { createHash } from "node:crypto";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { db, Prisma, type Tx } from "./db";
import { own, permit, type Actor } from "./capabilities";
import { assertReturn, eligible, ensureReason, quantity } from "./rules";
import { parseOpeningCsv } from "./opening";
import { businessDate } from "./business-date";
async function businessTimezone(tx: Tx) {
  const setting = await tx.record.findFirst({
    where: { kind: "settings" },
    orderBy: { createdAt: "desc" },
  });
  return String(
    (setting?.payload as { timezone?: string })?.timezone || "Asia/Makassar",
  );
}

const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));
const id = z.string().min(1).max(128);
const text = z.string().trim().min(1).max(500);
const lineSchema = z.object({
  itemId: id,
  locationId: id,
  quantity,
  assetId: id.optional(),
  tag: z.string().max(100).optional(),
  serial: z.string().max(150).optional(),
  condition: z
    .enum(["Baru", "Baik", "Rusak Ringan", "Rusak Berat"])
    .default("Baik"),
  calibrationRequired: z.boolean().default(false),
  validUntil: z.string().optional(),
});
async function audit(
  tx: Tx,
  actor: Actor,
  action: string,
  entityId: string,
  payload: unknown,
) {
  await tx.audit.create({
    data: { actorId: actor.id, action, entityId, payload: json(payload) },
  });
}
async function attachment(tx: Tx, actor: Actor, fileId: string) {
  const file = await tx.file.findUniqueOrThrow({ where: { id: fileId } });
  if (file.ownerId !== actor.id && !["ADMIN", "WAREHOUSE"].includes(actor.role))
    throw new Error("Bukti foto tidak dapat diakses.");
}
async function number(tx: Tx, prefix: string) {
  const setting = await tx.record.findFirst({
    where: { kind: "settings" },
    orderBy: { createdAt: "desc" },
  });
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: String(
      (setting?.payload as Record<string, unknown>)?.timezone ||
        "Asia/Makassar",
    ),
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .replace("-", "");
  const counter = await tx.counter.upsert({
    where: { key: `${prefix}-${month}` },
    create: { key: `${prefix}-${month}`, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}-${month}-${String(counter.value).padStart(4, "0")}`;
}
async function activeMaster(tx: Tx, masterId: string, kind: string) {
  const row = await tx.master.findUnique({ where: { id: masterId } });
  if (!row?.active || row.kind !== kind)
    throw new Error(`Referensi ${kind} tidak aktif atau tidak valid.`);
  return row;
}
async function allocateTags(
  tx: Tx,
  itemId: string,
  sku: string,
  pending: string[],
  count: number,
) {
  const prefix = `MTC-${sku}-`;
  const key = `asset-tag:${itemId}`;
  const [counter, assets, drafts] = await Promise.all([
    tx.counter.findUnique({ where: { key } }),
    tx.asset.findMany({
      where: { tag: { startsWith: prefix } },
      select: { tag: true },
    }),
    tx.line.findMany({
      where: { itemId, document: { kind: "receipt", status: "draft" } },
      select: { details: true },
    }),
  ]);
  const tags = [
    ...pending,
    ...assets.map((a) => a.tag),
    ...drafts.map((d) => String((d.details as { tag?: string }).tag || "")),
  ];
  const last = tags.reduce((n, tag) => {
    const suffix = tag.startsWith(prefix) ? tag.slice(prefix.length) : "";
    return /^\d+$/.test(suffix) ? Math.max(n, Number(suffix)) : n;
  }, counter?.value || 0);
  if (!Number.isSafeInteger(last) || last + count > 2147483647)
    throw new Error("Urutan tag melewati batas. Hubungi admin.");
  if (prefix.length + Math.max(3, String(last + count).length) > 100)
    throw new Error(
      "Kode SKU terlalu panjang untuk tag unit. Gunakan kode katalog lebih pendek.",
    );
  await tx.counter.upsert({
    where: { key },
    create: { key, value: last + count },
    update: { value: last + count },
  });
  return Array.from(
    { length: count },
    (_, index) => `${prefix}${String(last + index + 1).padStart(3, "0")}`,
  );
}
async function unfrozen(tx: Tx, location: string) {
  await activeMaster(tx, location, "location");
  if (await tx.freeze.findUnique({ where: { locationId: location } }))
    throw new Error("Lokasi sedang dibekukan untuk stock opname.");
}
async function movement(
  tx: Tx,
  actor: Actor,
  itemId: string,
  locationId: string,
  delta: Prisma.Decimal,
  reference: string,
  action: string,
) {
  await unfrozen(tx, locationId);
  const item = await tx.item.findUniqueOrThrow({ where: { id: itemId } });
  if (item.tracking !== "quantity")
    throw new Error(
      "Unit serialized tidak boleh dihitung sebagai saldo quantity.",
    );
  const balance = await tx.balance.upsert({
    where: { itemId_locationId: { itemId, locationId } },
    create: { itemId, locationId },
    update: {},
  });
  const next = balance.onHand.add(delta);
  if (next.lt(0) || next.lt(balance.reserved))
    throw new Error("Stok tersedia tidak cukup atau masih direservasi.");
  await tx.balance.update({
    where: { id: balance.id },
    data: { onHand: next },
  });
  await tx.ledger.create({
    data: {
      itemId,
      locationId,
      quantity: delta,
      referenceId: reference,
      action,
      actorId: actor.id,
    },
  });
}
async function validateQuantity(
  tx: Tx,
  itemId: string,
  amount: string,
  historical = false,
) {
  quantity.parse(amount);
  const item = await tx.item.findUniqueOrThrow({ where: { id: itemId } });
  if (!historical && !item.active) throw new Error("Barang tidak aktif.");
  if (!historical) {
    await activeMaster(tx, item.typeId, "type");
    await activeMaster(tx, item.categoryId, "category");
  }
  const unit = historical
    ? await tx.master.findUnique({ where: { id: item.unitId } })
    : await activeMaster(tx, item.unitId, "unit");
  if (!unit || unit.kind !== "unit")
    throw new Error("Referensi satuan tidak valid.");
  const details = unit.details as { fractional?: boolean };
  const qty = new Prisma.Decimal(amount);
  if (!details.fractional && !qty.isInteger())
    throw new Error("Satuan barang hanya menerima bilangan bulat.");
  return { item, qty };
}
async function validateLines<
  T extends {
    itemId: string;
    locationId: string;
    quantity: string | Prisma.Decimal;
  },
>(tx: Tx, lines: T[]) {
  const checked = new Map<
    string,
    Awaited<ReturnType<typeof validateQuantity>>
  >();
  const locations = new Set<string>();
  const result = [];
  for (const line of lines) {
    const amount = line.quantity.toString();
    const key = `${line.itemId}:${amount}`;
    if (!checked.has(key))
      checked.set(key, await validateQuantity(tx, line.itemId, amount));
    if (!locations.has(line.locationId)) {
      await unfrozen(tx, line.locationId);
      locations.add(line.locationId);
    }
    result.push({ line, ...checked.get(key)! });
  }
  return result;
}
async function snapshot(tx: Tx, loanId: string) {
  const loan = await tx.loan.findUniqueOrThrow({
    where: { id: loanId },
    include: { lines: true, events: { orderBy: { createdAt: "asc" } } },
  });
  const actors = await tx.user.findMany({
    where: { id: { in: loan.events.map((e) => e.actorId) } },
    select: { id: true, name: true },
  });
  const events = loan.events.map((e) => ({
    ...e,
    actorName:
      (e.payload as { actorName?: string }).actorName ||
      actors.find((a) => a.id === e.actorId)?.name ||
      e.actorId,
  }));
  const version = (await tx.snapshot.count({ where: { loanId } })) + 1;
  const payload = { ...loan, events, cutoffAt: new Date().toISOString() };
  const verificationCode = createHash("sha256")
    .update(JSON.stringify(json(payload)))
    .digest("hex")
    .slice(0, 20);
  const row = await tx.snapshot.create({
    data: { loanId, version, payload: json({ ...payload, verificationCode }) },
  });
  await tx.outbox.create({
    data: { type: "pdf", payload: { snapshotId: row.id } },
  });
}
async function atomic(
  actor: Actor,
  key: string,
  action: string,
  payload: unknown,
  run: (tx: Tx) => Promise<unknown>,
) {
  z.string().uuid().parse(key);
  const hash = createHash("sha256")
    .update(JSON.stringify({ action, payload }))
    .digest("hex");
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          // Small internal workload: one mutation lock gives a consistent lock order across stock, freeze and reservation.
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(178602, 1)`;
          const previous = await tx.idempotency.findUnique({ where: { key } });
          if (previous) {
            if (previous.actorId !== actor.id || previous.hash !== hash)
              throw new Error("Kunci retry telah dipakai dengan data berbeda.");
            return previous.result;
          }
          const current = await tx.user.findUnique({ where: { id: actor.id } });
          if (!current?.isActive || current.role !== actor.role)
            throw new Error("Akses berubah. Masuk kembali.");
          const result = await run(tx);
          await tx.idempotency.create({
            data: { key, actorId: actor.id, hash, result: json(result ?? {}) },
          });
          return result;
        },
        { isolationLevel: "Serializable", maxWait: 15000, timeout: 20000 },
      );
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034" ||
        attempt === 3
      )
        throw error;
    }
  }
}

export async function execute(
  actor: Actor,
  key: string,
  action: string,
  input: unknown,
) {
  return atomic(actor, key, action, input, async (tx) => {
    if (
      actor.role === "AUDITOR" &&
      ![
        "notification-read",
        "post-stocktake",
        "review-override",
        "close-exception",
      ].includes(action)
    )
      throw new Error("Akun auditor tidak memiliki izin mutasi ini.");
    if (action === "review-override") {
      permit(actor, "review");
      const p = z.object({ id, reason: text }).parse(input);
      const row = await tx.record.findUniqueOrThrow({ where: { id: p.id } });
      if (
        row.kind !== "emergency_override" ||
        row.status !== "pending_review" ||
        row.actorId === actor.id
      )
        throw new Error("Override tidak menunggu review pihak lain.");
      await tx.record.update({
        where: { id: row.id },
        data: {
          status: "reviewed",
          payload: json({
            ...(row.payload as Record<string, unknown>),
            reviewerId: actor.id,
            reviewedAt: new Date(),
            reviewReason: p.reason,
          }),
        },
      });
      await audit(tx, actor, "OVERRIDE_REVIEWED", row.id, p);
      return { id: row.id };
    }
    if (action === "opening-import") {
      permit(actor, "users");
      const p = z
        .object({
          batchId: z.string().regex(/^[A-Za-z0-9_-]{3,80}$/),
          csv: z.string().max(100_000),
          reason: text,
        })
        .parse(input);
      const checksum = createHash("sha256").update(p.csv).digest("hex");
      const previous = await tx.record.findFirst({
        where: { kind: "opening_import", referenceId: p.batchId },
      });
      if (previous) {
        const payload = previous.payload as {
          checksum: string;
          documentId?: string;
        };
        if (payload.checksum !== checksum)
          throw new Error(
            "Batch ID sudah digunakan dengan data berbeda. Gunakan batch baru setelah koreksi.",
          );
        return { id: payload.documentId || previous.id };
      }
      const rows = await parseOpeningCsv(p.csv);
      const items = await tx.item.findMany({
        where: { sku: { in: rows.map((r) => r.values.sku) } },
      });
      const masters = await tx.master.findMany({
        where: { kind: { in: ["location", "unit"] } },
      });
      const existing = await tx.asset.findMany({
        where: {
          OR: [
            { tag: { in: rows.map((r) => r.values.tag).filter(Boolean) } },
            {
              serial: { in: rows.map((r) => r.values.serial).filter(Boolean) },
            },
          ],
        },
        select: { tag: true, serial: true },
      });
      const tags = new Set<string>(),
        serials = new Set<string>();
      for (const row of rows) {
        const item = items.find((i) => i.sku === row.values.sku);
        const location = masters.find(
          (m) =>
            m.kind === "location" && m.code === row.values.location && m.active,
        );
        if (!item?.active)
          row.errors.push("SKU tidak ditemukan atau nonaktif.");
        if (!location)
          row.errors.push("Kode lokasi tidak ditemukan atau nonaktif.");
        if (item && !row.errors.length) {
          const qty = new Prisma.Decimal(row.values.quantity);
          const unit = masters.find((m) => m.id === item.unitId);
          if (
            !unit?.active ||
            (!(unit.details as { fractional?: boolean }).fractional &&
              !qty.isInteger())
          )
            row.errors.push(
              "Satuan tidak aktif atau jumlah pecahan tidak diizinkan.",
            );
          if (item.tracking === "serialized") {
            if (!qty.eq(1) || !row.values.tag)
              row.errors.push(
                "Serialized wajib satu unit dan asset tag per baris.",
              );
            if (
              tags.has(row.values.tag) ||
              existing.some((a) => a.tag === row.values.tag)
            )
              row.errors.push("Tag duplikat.");
            if (
              row.values.serial &&
              (serials.has(row.values.serial) ||
                existing.some((a) => a.serial === row.values.serial))
            )
              row.errors.push("Serial duplikat.");
            tags.add(row.values.tag);
            if (row.values.serial) serials.add(row.values.serial);
          }
        }
      }
      let documentId: string | undefined;
      if (!rows.some((r) => r.errors.length)) {
        const doc = await tx.document.create({
          data: {
            number: await number(tx, "IN"),
            kind: "receipt",
            actorId: actor.id,
            purpose: p.reason,
            reference: `OPENING:${p.batchId}`,
            lines: {
              create: rows.map((r) => {
                const item = items.find((i) => i.sku === r.values.sku)!;
                const location = masters.find(
                  (m) => m.kind === "location" && m.code === r.values.location,
                )!;
                return {
                  itemId: item.id,
                  locationId: location.id,
                  quantity: r.values.quantity,
                  details: json({
                    itemId: item.id,
                    locationId: location.id,
                    quantity: r.values.quantity,
                    tag: r.values.tag,
                    serial: r.values.serial,
                    condition: r.values.condition,
                    calibrationRequired:
                      r.values.calibration_required === "true",
                    validUntil: r.values.valid_until,
                  }),
                };
              }),
            },
          },
        });
        documentId = doc.id;
      }
      const result = await tx.record.create({
        data: {
          kind: "opening_import",
          actorId: actor.id,
          referenceId: p.batchId,
          status: documentId ? "validated" : "invalid",
          payload: json({ checksum, reason: p.reason, documentId, rows }),
        },
      });
      await audit(tx, actor, "OPENING_DRY_RUN", result.id, {
        batchId: p.batchId,
        documentId,
        errors: rows.filter((r) => r.errors.length).length,
      });
      return { id: documentId || result.id };
    }
    if (action === "notification-read") {
      const p = z.object({ id }).parse(input);
      const row = await tx.notification.findUniqueOrThrow({
        where: { id: p.id },
      });
      if (row.recipientId !== actor.id)
        throw new Error("Notifikasi tidak dapat diakses.");
      await tx.notification.update({
        where: { id: row.id },
        data: { readAt: row.readAt || new Date() },
      });
      return { id: row.id };
    }
    if (action === "master") {
      permit(actor, "master");
      const p = z
        .object({
          id: id.optional(),
          kind: z.enum([
            "location",
            "type",
            "category",
            "unit",
            "supplier",
            "project",
          ]),
          code: text,
          name: text,
          parentId: z.string().optional(),
          active: z.boolean().default(true),
          version: z.number().int().optional(),
          details: z
            .object({
              description: z.string().max(2000).optional(),
              locationType: z.string().optional(),
              tracking: z.enum(["quantity", "serialized"]).optional(),
              fractional: z.boolean().optional(),
              defaultTypeId: z.string().optional(),
              defaultUnitId: z.string().optional(),
              defaultLocationId: z.string().optional(),
              photoId: z.string().optional(),
              contact: z.string().max(500).optional(),
            })
            .default({}),
        })
        .parse(input);
      const before = p.id
        ? await tx.master.findUniqueOrThrow({ where: { id: p.id } })
        : null;
      if (before && (before.kind !== p.kind || before.version !== p.version))
        throw new Error("Master berubah. Muat ulang sebelum menyimpan.");
      if (
        p.kind === "type" &&
        (!before ||
          p.code !== before.code ||
          (before.details as { tracking?: string }).tracking !==
            p.details.tracking)
      )
        throw new Error(
          "Kode dan perilaku jenis sistem tidak dapat dibuat atau diubah melalui form.",
        );
      if (p.parentId) {
        if (p.kind !== "location")
          throw new Error("Parent hanya untuk lokasi.");
        let parent: string | null = p.parentId;
        const visited = new Set<string>();
        while (parent) {
          if (parent === p.id || visited.has(parent))
            throw new Error("Hierarki lokasi membentuk siklus.");
          visited.add(parent);
          const row = await activeMaster(tx, parent, "location");
          parent = row.parentId;
        }
      }
      if (
        before &&
        p.kind === "location" &&
        !p.active &&
        (await tx.master.count({
          where: { parentId: before.id, active: true },
        }))
      )
        throw new Error(
          "Nonaktifkan atau pindahkan lokasi turunan terlebih dahulu.",
        );
      for (const [field, kind] of [
        ["defaultTypeId", "type"],
        ["defaultUnitId", "unit"],
        ["defaultLocationId", "location"],
      ] as const)
        if (p.details[field]) await activeMaster(tx, p.details[field]!, kind);
      if (p.details.photoId) await attachment(tx, actor, p.details.photoId);
      if (
        before &&
        p.kind === "unit" &&
        (before.details as { fractional?: boolean }).fractional !==
          p.details.fractional &&
        (await tx.item.count({ where: { unitId: before.id } }))
      )
        throw new Error(
          "Sifat pecahan satuan yang sudah dipakai tidak dapat diubah.",
        );
      const data = {
        kind: p.kind,
        code: p.code.toUpperCase(),
        name: p.name,
        active: p.active,
        parentId: p.parentId || null,
        details: json(p.details),
      };
      const row = before
        ? await tx.master.update({
            where: { id: before.id },
            data: { ...data, version: { increment: 1 } },
          })
        : await tx.master.create({ data });
      await audit(tx, actor, "MASTER_SAVED", row.id, { before, after: row });
      return { id: row.id };
    }
    if (action === "item") {
      permit(actor, "master");
      const p = z
        .object({
          id: id.optional(),
          sku: text,
          name: text,
          typeId: id,
          categoryId: id,
          unitId: id,
          locationId: id,
          minStock: z.string().regex(/^\d{1,12}(\.\d{1,4})?$/),
          description: z.string().max(5000).default(""),
          photoId: z.string().optional(),
          active: z.boolean().default(true),
          version: z.number().int().optional(),
        })
        .parse(input);
      const type = await activeMaster(tx, p.typeId, "type");
      await activeMaster(tx, p.categoryId, "category");
      const unit = await activeMaster(tx, p.unitId, "unit");
      await activeMaster(tx, p.locationId, "location");
      const tracking = (type.details as { tracking: string }).tracking;
      if (
        (tracking === "serialized" ||
          !(unit.details as { fractional?: boolean }).fractional) &&
        !new Prisma.Decimal(p.minStock).isInteger()
      )
        throw new Error(
          "Minimum stok harus bilangan bulat sesuai satuan barang.",
        );
      if (!["quantity", "serialized"].includes(tracking))
        throw new Error("Jenis belum memiliki tracking valid.");
      if (p.photoId) await attachment(tx, actor, p.photoId);
      const before = p.id
        ? await tx.item.findUniqueOrThrow({ where: { id: p.id } })
        : null;
      if (
        before &&
        (before.version !== p.version ||
          before.tracking !== tracking ||
          before.unitId !== p.unitId)
      )
        throw new Error(
          "Versi/satuan/tracking barang tidak boleh diubah diam-diam.",
        );
      const { id: itemId, version: _version, ...data } = p;
      void _version;
      const row = itemId
        ? await tx.item.update({
            where: { id: itemId },
            data: {
              ...data,
              sku: p.sku.toUpperCase(),
              photoId: p.photoId || null,
              tracking,
              version: { increment: 1 },
            },
          })
        : await tx.item.create({
            data: {
              ...data,
              sku: p.sku.toUpperCase(),
              photoId: p.photoId || null,
              tracking,
            },
          });
      await audit(tx, actor, "ITEM_SAVED", row.id, { before, after: row });
      return { id: row.id };
    }
    if (
      action === "receipt" ||
      action === "request" ||
      action === "revise-request"
    ) {
      const revising = action === "revise-request";
      if (action === "receipt") permit(actor, "stock");
      else if (actor.role === "AUDITOR")
        throw new Error("Akun auditor hanya membaca.");
      const p = z
        .object({
          id: id.optional(),
          projectId: z.string().optional(),
          targetLocationId: z.string().optional(),
          targetLocationText: z.string().trim().max(200).optional(),
          reference: z.string().max(500).default(""),
          purpose: text,
          dueAt: z.string().optional(),
          lines: z.array(lineSchema).min(1).max(100),
        })
        .parse(input);
      if (p.targetLocationId && p.targetLocationText)
        throw new Error(
          "Pilih lokasi penggunaan atau isi lokasi lain, bukan keduanya.",
        );
      const dueDateOnly = !!p.dueAt && /^\d{4}-\d{2}-\d{2}$/.test(p.dueAt);
      const dueAt = p.dueAt
        ? businessDate(p.dueAt, await businessTimezone(tx), dueDateOnly)
        : null;
      if (action !== "receipt")
        await activeMaster(tx, p.projectId || "", "project");
      if (p.targetLocationId)
        await activeMaster(tx, p.targetLocationId, "location");
      const types = new Set<string>();
      const allocatedTags = new Map<string, string[]>();
      for (const { line, item, qty } of await validateLines(tx, p.lines)) {
        types.add(item.tracking);
        if (item.tracking === "serialized" && !qty.isInteger())
          throw new Error("Unit harus bilangan bulat.");
        if (
          action === "receipt" &&
          item.tracking === "serialized" &&
          !qty.eq(1)
        )
          throw new Error(
            "Penerimaan serialized memerlukan satu tag unik per baris.",
          );
        if (
          action === "receipt" &&
          item.tracking === "serialized" &&
          !line.tag
        ) {
          if (!allocatedTags.has(item.id))
            allocatedTags.set(
              item.id,
              await allocateTags(
                tx,
                item.id,
                item.sku,
                p.lines.map((l) => l.tag || ""),
                p.lines.filter((l) => l.itemId === item.id && !l.tag).length,
              ),
            );
          line.tag = allocatedTags.get(item.id)!.shift()!;
        }
      }
      if (action === "receipt") {
        const tags = p.lines
          .map((l) => l.tag)
          .filter((tag): tag is string => !!tag);
        const serials = p.lines
          .map((l) => l.serial)
          .filter((serial): serial is string => !!serial);
        if (
          new Set(tags).size !== tags.length ||
          new Set(serials).size !== serials.length
        )
          throw new Error("Tag atau nomor seri duplikat dalam penerimaan.");
        if (
          await tx.asset.count({
            where: { OR: [{ tag: { in: tags } }, { serial: { in: serials } }] },
          })
        )
          throw new Error("Tag atau nomor seri sudah dipakai unit lain.");
        const drafts = await tx.line.findMany({
          where: { document: { kind: "receipt", status: "draft" } },
          select: { details: true },
        });
        if (
          drafts.some((d) => {
            const v = d.details as { tag?: string; serial?: string };
            return (
              (v.tag && tags.includes(v.tag)) ||
              (v.serial && serials.includes(v.serial))
            );
          })
        )
          throw new Error(
            "Tag atau nomor seri sudah dialokasikan pada draft lain.",
          );
      }
      if (action !== "receipt" && types.size !== 1)
        throw new Error(
          "Consumable dan alat tidak boleh dicampur dalam request.",
        );
      if (
        action !== "receipt" &&
        types.has("serialized") &&
        (!dueAt || dueAt <= new Date())
      )
        throw new Error("Rencana kembali alat wajib di masa mendatang.");
      let original;
      if (revising) {
        original = await tx.document.findUniqueOrThrow({
          where: { id: p.id || "" },
          include: { lines: true },
        });
        if (
          original.actorId !== actor.id ||
          original.kind !== "request" ||
          !["submitted", "approved"].includes(original.status) ||
          original.lines.some((l) => l.fulfilled.gt(0))
        )
          throw new Error(
            "Hanya pemohon dapat merevisi request yang belum diserahkan.",
          );
        if (original.status === "approved") await release(tx, original.id);
        await tx.document.update({
          where: { id: original.id },
          data: { status: "superseded" },
        });
      }
      const row = await tx.document.create({
        data: {
          number: await number(tx, action === "receipt" ? "IN" : "REQ"),
          kind: action === "receipt" ? "receipt" : "request",
          actorId: actor.id,
          status: action === "receipt" ? "draft" : "submitted",
          purpose: p.purpose,
          projectId: p.projectId || null,
          targetLocationId: p.targetLocationId || null,
          targetLocationText: p.targetLocationText || null,
          dueDateOnly,
          reference: original ? `REV:${original.number}` : p.reference,
          dueAt,
          lines: {
            create: p.lines.map((l) => ({
              itemId: l.itemId,
              assetId: l.assetId,
              locationId: l.locationId,
              quantity: l.quantity,
              details: json(l),
            })),
          },
        },
      });
      if (original)
        await tx.record.create({
          data: {
            kind: "request_revision",
            actorId: actor.id,
            referenceId: original.id,
            payload: { newRequestId: row.id, previousNumber: original.number },
          },
        });
      await audit(tx, actor, action.toUpperCase() + "_CREATED", row.id, p);
      return { id: row.id, number: row.number };
    }
    if (
      [
        "post-receipt",
        "approve",
        "emergency-approve",
        "reject",
        "cancel",
        "acknowledge",
        "issue",
        "checkout",
      ].includes(action)
    ) {
      const p = z
        .object({
          id,
          reason: z.string().max(2000).default(""),
          approved: z.record(z.string(), quantity).optional(),
          conditions: z.record(z.string(), z.enum(["Baru", "Baik"])).optional(),
          completeness: z.record(z.string(), text).optional(),
        })
        .parse(input);
      const doc = await tx.document.findUniqueOrThrow({
        where: { id: p.id },
        include: { lines: true },
      });
      if (action === "acknowledge") {
        if (
          doc.actorId !== actor.id ||
          doc.kind !== "request" ||
          doc.status !== "approved"
        )
          throw new Error(
            "Hanya pemohon dapat mengonfirmasi request disetujui.",
          );
        await tx.document.update({
          where: { id: doc.id },
          data: { acknowledgedAt: new Date() },
        });
      } else if (action === "post-receipt") {
        permit(actor, "stock");
        if (doc.kind !== "receipt" || doc.status !== "draft")
          throw new Error("Penerimaan bukan draft.");
        const timezone = await businessTimezone(tx);
        const newAssets: Prisma.AssetCreateManyInput[] = [];
        for (const { line: l, item, qty } of await validateLines(
          tx,
          doc.lines,
        )) {
          if (item.tracking === "quantity")
            await movement(
              tx,
              actor,
              item.id,
              l.locationId,
              qty,
              doc.id,
              "RECEIPT",
            );
          else {
            const meta = lineSchema.parse(l.details);
            const good = ["Baru", "Baik"].includes(meta.condition);
            if (!meta.tag || !qty.eq(1))
              throw new Error("Draft unit memerlukan satu tag dan jumlah 1.");
            newAssets.push({
              itemId: item.id,
              tag: meta.tag!,
              serial: meta.serial || null,
              locationId: l.locationId,
              condition: meta.condition,
              availability: good ? "available" : "blocked",
              calibrationRequired: meta.calibrationRequired,
              validUntil: meta.validUntil
                ? businessDate(meta.validUntil, timezone, true)
                : null,
              technical: meta.calibrationRequired
                ? "Perlu Kalibrasi"
                : "Normal",
            });
          }
        }
        if (newAssets.length) await tx.asset.createMany({ data: newAssets });
        await tx.document.update({
          where: { id: doc.id },
          data: { status: "posted", postedAt: new Date() },
        });
      } else if (action === "approve" || action === "emergency-approve") {
        if (action === "emergency-approve") {
          const user = await tx.user.findUniqueOrThrow({
            where: { id: actor.id },
          });
          if (actor.role !== "ADMIN" || !user.emergencyIssue)
            throw new Error("Permission emergency issue belum diberikan.");
          ensureReason(p.reason);
          const items = await tx.item.findMany({
            where: { id: { in: doc.lines.map((l) => l.itemId) } },
          });
          if (items.some((i) => i.tracking !== "quantity"))
            throw new Error("Override ini hanya untuk consumable.");
        } else permit(actor, "approve");
        if (doc.actorId === actor.id)
          throw new Error("Persetujuan diri sendiri dilarang.");
        if (doc.status !== "submitted" || doc.kind !== "request")
          throw new Error("Request tidak menunggu approval.");
        for (const l of doc.lines) {
          const amount = p.approved?.[l.id] || l.quantity.toString();
          const { item, qty } = await validateQuantity(tx, l.itemId, amount);
          await unfrozen(tx, l.locationId);
          if (qty.gt(l.quantity)) throw new Error("Approval melebihi request.");
          if (!qty.eq(l.quantity)) ensureReason(p.reason);
          if (item.tracking === "quantity") {
            const b = await tx.balance.findUnique({
              where: {
                itemId_locationId: {
                  itemId: item.id,
                  locationId: l.locationId,
                },
              },
            });
            if (!b || b.onHand.sub(b.reserved).lt(qty))
              throw new Error("Stok tersedia tidak cukup.");
            await tx.balance.update({
              where: { id: b.id },
              data: { reserved: b.reserved.add(qty) },
            });
          } else {
            const units = await tx.asset.findMany({
              where: {
                itemId: item.id,
                locationId: l.locationId,
                availability: "available",
                ...(l.assetId ? { id: l.assetId } : {}),
              },
              orderBy: { tag: "asc" },
            });
            const chosen = units
              .filter((u) => eligible(u))
              .slice(0, qty.toNumber());
            if (chosen.length !== qty.toNumber())
              throw new Error("Unit layak/kalibrasi berlaku tidak mencukupi.");
            for (const unit of chosen)
              await tx.asset.update({
                where: { id: unit.id },
                data: { availability: "reserved", requestId: doc.id },
              });
          }
          await tx.line.update({
            where: { id: l.id },
            data: { approved: qty },
          });
        }
        const config = await tx.record.findFirst({
          where: { kind: "settings" },
          orderBy: { createdAt: "desc" },
        });
        const pickupHours = Number(
          (config?.payload as { pickupHours?: number } | undefined)
            ?.pickupHours || 24,
        );
        await tx.document.update({
          where: { id: doc.id },
          data: {
            status: "approved",
            approverId: actor.id,
            reason: p.reason,
            pickupDeadline: new Date(Date.now() + pickupHours * 3600 * 1000),
          },
        });
        if (action === "emergency-approve")
          await tx.record.create({
            data: {
              kind: "emergency_override",
              actorId: actor.id,
              referenceId: doc.id,
              status: "pending_review",
              payload: json({
                reason: p.reason,
                recipientId: doc.actorId,
                lines: doc.lines,
                approved: p.approved,
              }),
            },
          });
      } else if (action === "reject" || action === "cancel") {
        if (action === "reject") {
          permit(actor, "approve");
          ensureReason(p.reason);
          if (doc.actorId === actor.id)
            throw new Error("Tidak dapat review request sendiri.");
        } else if (doc.actorId !== actor.id) permit(actor, "stock");
        if (!["request", "receipt"].includes(doc.kind))
          throw new Error(
            "Gunakan pembatalan sesi khusus agar freeze dilepas.",
          );
        if (!["submitted", "approved", "draft"].includes(doc.status))
          throw new Error("Transaksi tidak dapat dibatalkan.");
        if (doc.lines.some((l) => l.fulfilled.gt(0)))
          throw new Error(
            "Barang sudah keluar; gunakan return/koreksi, bukan pembatalan.",
          );
        if (doc.status === "approved") await release(tx, doc.id);
        await tx.document.update({
          where: { id: doc.id },
          data: {
            status: action === "reject" ? "rejected" : "cancelled",
            reason: p.reason,
          },
        });
      } else {
        permit(actor, "stock");
        if (
          doc.kind !== "request" ||
          doc.status !== "approved" ||
          !doc.acknowledgedAt ||
          !doc.pickupDeadline ||
          doc.pickupDeadline < new Date()
        )
          throw new Error(
            "Request harus approved, belum expired dan dikonfirmasi penerima.",
          );
        const items = await tx.item.findMany({
          where: { id: { in: doc.lines.map((l) => l.itemId) } },
        });
        if (action === "issue") {
          if (items.some((i) => i.tracking !== "quantity"))
            throw new Error("Gunakan checkout untuk unit aset.");
          for (const l of doc.lines) {
            await unfrozen(tx, l.locationId);
            if (l.fulfilled.gt(0))
              throw new Error("Penyerahan sudah diposting.");
            const b = await tx.balance.findUniqueOrThrow({
              where: {
                itemId_locationId: {
                  itemId: l.itemId,
                  locationId: l.locationId,
                },
              },
            });
            await tx.balance.update({
              where: { id: b.id },
              data: { reserved: b.reserved.sub(l.approved) },
            });
            await movement(
              tx,
              actor,
              l.itemId,
              l.locationId,
              l.approved.neg(),
              doc.id,
              "ISSUE",
            );
            await tx.line.update({
              where: { id: l.id },
              data: { fulfilled: l.approved },
            });
          }
        } else {
          if (items.some((i) => i.tracking !== "serialized"))
            throw new Error("Gunakan pengeluaran consumable.");
          const units = await tx.asset.findMany({
            where: { requestId: doc.id, availability: "reserved" },
          });
          if (
            units.length !==
              doc.lines.reduce((n, l) => n + l.approved.toNumber(), 0) ||
            units.some((u) => !eligible(u, new Date(), true))
          )
            throw new Error("Alokasi atau kalibrasi unit berubah.");
          for (const u of units) await unfrozen(tx, u.locationId);
          const borrower = await tx.user.findUniqueOrThrow({
            where: { id: doc.actorId },
          });
          for (const u of units) {
            if (!p.conditions?.[u.id] || !p.completeness?.[u.id])
              throw new Error(
                "Periksa kondisi dan kelengkapan setiap unit sebelum checkout.",
              );
            await tx.asset.update({
              where: { id: u.id },
              data: { condition: p.conditions[u.id] },
            });
          }
          const verifiedUnits = units.map((u) => ({
            ...u,
            condition: p.conditions![u.id],
            completeness: p.completeness![u.id],
            verifiedAt: new Date(),
            verifiedBy: actor.id,
          }));
          const project = await tx.master.findUniqueOrThrow({
            where: { id: doc.projectId! },
          });
          const approver = doc.approverId
            ? await tx.user.findUnique({
                where: { id: doc.approverId },
                select: { id: true, name: true },
              })
            : null;
          const setting = await tx.record.findFirst({
            where: { kind: "settings" },
            orderBy: { createdAt: "desc" },
          });
          const approval = await tx.audit.findFirst({
            where: {
              entityId: doc.id,
              action: { in: ["APPROVE", "EMERGENCY-APPROVE"] },
            },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          });
          const usageLocation = doc.targetLocationId
            ? await tx.master.findUnique({
                where: { id: doc.targetLocationId },
                select: { id: true, name: true, code: true },
              })
            : doc.targetLocationText
              ? { name: doc.targetLocationText }
              : null;
          const loan = await tx.loan.create({
            data: {
              number: await number(tx, "LOAN"),
              requestId: doc.id,
              borrowerId: doc.actorId,
              projectId: doc.projectId!,
              dueAt: doc.dueAt!,
              dueDateOnly: doc.dueDateOnly,
              snapshot: json({
                request: doc,
                borrower: { id: borrower.id, name: borrower.name },
                handover: { id: actor.id, name: actor.name },
                items,
                units: verifiedUnits,
                project: {
                  id: project.id,
                  name: project.name,
                  code: project.code,
                },
                approver,
                approval,
                usageLocation,
                settings: setting?.payload || { timezone: "Asia/Makassar" },
              }),
              lines: {
                create: verifiedUnits.map((u) => ({
                  assetId: u.id,
                  initial: json(u),
                })),
              },
            },
          });
          await tx.asset.updateMany({
            where: { id: { in: units.map((u) => u.id) } },
            data: {
              availability: "borrowed",
              custodianId: doc.actorId,
              loanId: loan.id,
            },
          });
          await tx.loanEvent.create({
            data: {
              loanId: loan.id,
              type: "checkout",
              actorId: actor.id,
              payload: json({
                acknowledgedAt: doc.acknowledgedAt,
                units: verifiedUnits,
                actorName: actor.name,
              }),
            },
          });
          await snapshot(tx, loan.id);
          for (const l of doc.lines)
            await tx.line.update({
              where: { id: l.id },
              data: { fulfilled: l.approved },
            });
        }
        await tx.document.update({
          where: { id: doc.id },
          data: { status: "fulfilled", postedAt: new Date() },
        });
      }
      await audit(tx, actor, action.toUpperCase(), doc.id, {
        reason: p.reason,
      });
      return { id: doc.id, number: doc.number };
    }
    if (
      [
        "request-return",
        "receive-return",
        "inspect",
        "correct-loan",
        "close-exception",
      ].includes(action)
    ) {
      const p = z
        .object({
          id,
          assetIds: z.array(id).default([]),
          condition: z
            .enum(["Baik", "Rusak Ringan", "Rusak Berat", "Perlu Kalibrasi"])
            .default("Baik"),
          reason: z.string().max(5000).default(""),
          photoId: z.string().optional(),
        })
        .parse(input);
      const loan = await tx.loan.findUniqueOrThrow({
        where: { id: p.id },
        include: { lines: true },
      });
      own(actor, loan.borrowerId);
      if (loan.status !== "active" && action !== "correct-loan")
        throw new Error("Pinjaman tidak aktif.");
      if (action !== "request-return")
        permit(actor, action === "close-exception" ? "review" : "stock");
      else if (actor.id !== loan.borrowerId)
        throw new Error("Pengajuan dilakukan oleh peminjam.");
      if (["correct-loan", "close-exception"].includes(action)) {
        ensureReason(p.reason);
        if (action === "close-exception") {
          if (actor.id === loan.borrowerId)
            throw new Error(
              "Peminjam tidak dapat menyetujui pengecualian sendiri.",
            );
          for (const line of loan.lines.filter((l) => !l.receivedAt)) {
            await tx.asset.update({
              where: { id: line.assetId },
              data: {
                availability: "blocked",
                condition: "Hilang",
                technical: "Perlu Pemeriksaan",
              },
            });
            await tx.record.create({
              data: {
                kind: "incident",
                actorId: actor.id,
                referenceId: line.assetId,
                payload: json({
                  loanId: loan.id,
                  reason: p.reason,
                  type: "closed_with_exception",
                }),
              },
            });
          }
          await tx.loan.update({
            where: { id: loan.id },
            data: { status: "closed_with_exception" },
          });
        }
      } else {
        if (
          !p.assetIds.length ||
          new Set(p.assetIds).size !== p.assetIds.length
        )
          throw new Error("Pilih unit unik yang diproses.");
        for (const assetId of p.assetIds) {
          const line = loan.lines.find((l) => l.assetId === assetId);
          if (!line) throw new Error("Unit bukan bagian pinjaman.");
          const asset = await tx.asset.findUniqueOrThrow({
            where: { id: assetId },
          });
          if (action === "request-return" && line.receivedAt)
            throw new Error("Unit sudah diterima fisik.");
          if (action === "receive-return") {
            if (line.receivedAt || asset.loanId !== loan.id)
              throw new Error("Unit sudah diterima atau custody berubah.");
            await unfrozen(tx, asset.locationId);
            await tx.loanLine.update({
              where: { id: line.id },
              data: { receivedAt: new Date() },
            });
            await tx.asset.update({
              where: { id: assetId },
              data: { availability: "pending_inspection", custodianId: null },
            });
          }
          if (action === "inspect") {
            if (
              !line.receivedAt ||
              line.inspectedAt ||
              asset.availability !== "pending_inspection"
            )
              throw new Error(
                "Unit harus diterima fisik dan belum diinspeksi.",
              );
            if (p.condition !== "Baik") {
              ensureReason(p.reason);
              if (!p.photoId) throw new Error("Foto kondisi bermasalah wajib.");
              await attachment(tx, actor, p.photoId);
            }
            const good =
              p.condition === "Baik" &&
              (!asset.calibrationRequired ||
                (!!asset.validUntil && asset.validUntil >= new Date()));
            await tx.loanLine.update({
              where: { id: line.id },
              data: { inspectedAt: new Date(), inspection: json(p) },
            });
            await tx.asset.update({
              where: { id: assetId },
              data: {
                condition:
                  p.condition === "Perlu Kalibrasi" ? "Baik" : p.condition,
                technical: good
                  ? "Normal"
                  : p.condition === "Perlu Kalibrasi"
                    ? "Perlu Kalibrasi"
                    : "Perlu Pemeriksaan",
                availability: good ? "available" : "blocked",
                loanId: null,
                requestId: null,
              },
            });
            if (!good)
              await tx.record.create({
                data: {
                  kind: "incident",
                  actorId: actor.id,
                  referenceId: assetId,
                  payload: json(p),
                },
              });
          }
        }
      }
      await tx.loanEvent.create({
        data: {
          loanId: loan.id,
          type: action,
          actorId: actor.id,
          payload: json({ ...p, actorName: actor.name }),
        },
      });
      if (
        action === "inspect" &&
        (await tx.loanLine.count({
          where: { loanId: loan.id, inspectedAt: null },
        })) === 0
      )
        await tx.loan.update({
          where: { id: loan.id },
          data: { status: "completed" },
        });
      await snapshot(tx, loan.id);
      await audit(tx, actor, action.toUpperCase(), loan.id, p);
      return { id: loan.id, number: loan.number };
    }
    if (action === "consumable-return" || action === "waste") {
      const p = z
        .object({
          lineId: id,
          quantity,
          reason: text,
          receive: z.boolean().default(false),
        })
        .parse(input);
      const l = await tx.line.findUniqueOrThrow({
        where: { id: p.lineId },
        include: { document: true },
      });
      own(actor, l.document.actorId);
      if (l.fulfilled.lte(0)) throw new Error("Barang belum dikeluarkan.");
      const { item, qty } = await validateQuantity(
        tx,
        l.itemId,
        p.quantity,
        true,
      );
      if (item.tracking !== "quantity")
        throw new Error("Sisa/waste hanya untuk consumable quantity.");
      assertReturn(
        l.fulfilled.toString(),
        l.returned.toString(),
        l.waste.toString(),
        qty.toString(),
      );
      if (action === "consumable-return" && !p.receive) {
        const r = await tx.record.create({
          data: {
            kind: "consumable-return",
            actorId: actor.id,
            referenceId: l.id,
            payload: json(p),
          },
        });
        await audit(tx, actor, "RETURN_REQUESTED", r.id, p);
        return { id: r.id };
      }
      permit(actor, "stock");
      if (action === "consumable-return") {
        await movement(
          tx,
          actor,
          l.itemId,
          l.locationId,
          qty,
          l.id,
          "CONSUMABLE_RETURN",
        );
        await tx.line.update({
          where: { id: l.id },
          data: { returned: l.returned.add(qty) },
        });
      } else
        await tx.line.update({
          where: { id: l.id },
          data: { waste: l.waste.add(qty) },
        });
      await audit(tx, actor, action.toUpperCase(), l.id, p);
      return { id: l.documentId };
    }
    if (action === "receive-consumable") {
      permit(actor, "stock");
      const p = z.object({ id, reason: text }).parse(input);
      const record = await tx.record.findUniqueOrThrow({ where: { id: p.id } });
      if (record.kind !== "consumable-return" || record.status !== "open")
        throw new Error("Pengembalian sudah diproses.");
      const payload = z
        .object({ quantity, reason: text })
        .parse(record.payload);
      const l = await tx.line.findUniqueOrThrow({
        where: { id: record.referenceId! },
      });
      const { item, qty } = await validateQuantity(
        tx,
        l.itemId,
        payload.quantity,
        true,
      );
      if (item.tracking !== "quantity")
        throw new Error("Pengembalian ini bukan consumable.");
      assertReturn(
        l.fulfilled.toString(),
        l.returned.toString(),
        l.waste.toString(),
        qty.toString(),
      );
      await movement(
        tx,
        actor,
        l.itemId,
        l.locationId,
        qty,
        record.id,
        "CONSUMABLE_RETURN",
      );
      await tx.line.update({
        where: { id: l.id },
        data: { returned: l.returned.add(qty) },
      });
      await tx.record.update({
        where: { id: record.id },
        data: { status: "received" },
      });
      await audit(tx, actor, "RETURN_RECEIVED", record.id, p);
      return { id: record.id };
    }
    if (action === "transfer") {
      permit(actor, "stock");
      const p = z
        .object({
          itemId: id,
          sourceId: id,
          targetId: id,
          quantity,
          assetIds: z.array(id).default([]),
          reason: text,
        })
        .parse(input);
      if (p.sourceId === p.targetId)
        throw new Error("Asal dan tujuan harus berbeda.");
      await unfrozen(tx, p.sourceId);
      await unfrozen(tx, p.targetId);
      const { item, qty } = await validateQuantity(tx, p.itemId, p.quantity);
      const ref = await number(tx, "TRF");
      if (item.tracking === "quantity") {
        await movement(
          tx,
          actor,
          item.id,
          p.sourceId,
          qty.neg(),
          ref,
          "TRANSFER_OUT",
        );
        await movement(tx, actor, item.id, p.targetId, qty, ref, "TRANSFER_IN");
      } else {
        if (
          p.assetIds.length !== qty.toNumber() ||
          new Set(p.assetIds).size !== p.assetIds.length
        )
          throw new Error("Pilih unit unik sesuai jumlah.");
        for (const assetId of p.assetIds) {
          const a = await tx.asset.findUniqueOrThrow({
            where: { id: assetId },
          });
          if (
            a.itemId !== item.id ||
            a.locationId !== p.sourceId ||
            !["available", "blocked"].includes(a.availability)
          )
            throw new Error("Unit tidak dapat dipindahkan.");
          await tx.asset.update({
            where: { id: a.id },
            data: { locationId: p.targetId },
          });
        }
      }
      const r = await tx.record.create({
        data: {
          kind: "transfer",
          actorId: actor.id,
          status: "posted",
          payload: json({ ...p, number: ref }),
        },
      });
      await audit(tx, actor, "TRANSFER", r.id, p);
      return { id: r.id };
    }
    if (action === "stocktake") {
      permit(actor, "stock");
      const p = z.object({ locationId: id, reason: text }).parse(input);
      await unfrozen(tx, p.locationId);
      if (
        await tx.asset.count({
          where: {
            locationId: p.locationId,
            availability: { in: ["reserved", "pending_inspection"] },
          },
        })
      )
        throw new Error("Selesaikan reservasi/inspeksi sebelum opname lokasi.");
      const balances = await tx.balance.findMany({
        where: { locationId: p.locationId },
      });
      if (balances.some((b) => b.reserved.gt(0)))
        throw new Error("Selesaikan reservasi quantity sebelum opname lokasi.");
      const assets = await tx.asset.findMany({
        where: {
          locationId: p.locationId,
          availability: { in: ["available", "blocked"] },
        },
      });
      const doc = await tx.document.create({
        data: {
          number: await number(tx, "SO"),
          kind: "stocktake",
          actorId: actor.id,
          locationId: p.locationId,
          purpose: p.reason,
          lines: {
            create: [
              ...balances.map((b) => ({
                itemId: b.itemId,
                locationId: p.locationId,
                quantity: b.onHand,
                details: json({ system: b.onHand.toString() }),
              })),
              ...assets.map((a) => ({
                itemId: a.itemId,
                assetId: a.id,
                locationId: p.locationId,
                quantity: new Prisma.Decimal(1),
                details: json({
                  system: "1",
                  tag: a.tag,
                  availability: a.availability,
                  condition: a.condition,
                }),
              })),
            ],
          },
        },
      });
      await tx.freeze.create({
        data: { locationId: p.locationId, documentId: doc.id },
      });
      await audit(tx, actor, "STOCKTAKE_OPEN", doc.id, p);
      return { id: doc.id };
    }
    if (
      action === "count-stocktake" ||
      action === "post-stocktake" ||
      action === "cancel-stocktake"
    ) {
      const p = z
        .object({
          id,
          counts: z
            .record(z.string(), z.string().regex(/^\d+(\.\d{1,4})?$/))
            .default({}),
          reason: text,
        })
        .parse(input);
      const doc = await tx.document.findUniqueOrThrow({
        where: { id: p.id },
        include: { lines: true },
      });
      if (doc.kind !== "stocktake" || !["draft", "review"].includes(doc.status))
        throw new Error("Sesi tidak terbuka.");
      if (action === "count-stocktake") {
        permit(actor, "stock");
        for (const l of doc.lines) {
          const count = p.counts[l.id];
          if (count === undefined)
            throw new Error("Semua baris harus dihitung.");
          if (l.assetId && !["0", "1"].includes(count))
            throw new Error(
              "Unit beridentitas dihitung hadir (1) atau tidak ditemukan (0).",
            );
          const item = await tx.item.findUniqueOrThrow({
            where: { id: l.itemId },
          });
          const unit = await activeMaster(tx, item.unitId, "unit");
          if (
            !(unit.details as { fractional?: boolean }).fractional &&
            !new Prisma.Decimal(count).isInteger()
          )
            throw new Error("Satuan bulat tidak menerima pecahan.");
          await tx.line.update({
            where: { id: l.id },
            data: {
              details: json({
                ...(l.details as Record<string, unknown>),
                system: l.quantity.toString(),
                count,
                reason: p.reason,
                countedBy: actor.id,
              }),
            },
          });
        }
        await tx.document.update({
          where: { id: doc.id },
          data: { status: "review" },
        });
      } else {
        permit(actor, action === "post-stocktake" ? "review" : "stock");
        if (
          action === "post-stocktake" &&
          (doc.status !== "review" ||
            doc.actorId === actor.id ||
            doc.lines.some(
              (l) =>
                (l.details as { countedBy?: string }).countedBy === actor.id,
            ))
        )
          throw new Error("Review harus dilakukan pihak lain setelah hitung.");
        await tx.freeze.delete({ where: { locationId: doc.locationId! } });
        if (action === "post-stocktake")
          for (const l of doc.lines) {
            const d = l.details as { count: string };
            const delta = new Prisma.Decimal(d.count).sub(l.quantity);
            if (l.assetId) {
              if (d.count === "0") {
                await tx.asset.update({
                  where: { id: l.assetId },
                  data: {
                    availability: "blocked",
                    condition: "Hilang",
                    technical: "Perlu Pemeriksaan",
                  },
                });
                await tx.record.create({
                  data: {
                    kind: "incident",
                    actorId: actor.id,
                    referenceId: l.assetId,
                    payload: json({
                      reason: p.reason,
                      stocktakeId: doc.id,
                      result: "missing",
                    }),
                  },
                });
              }
              continue;
            }
            if (!delta.eq(0))
              await movement(
                tx,
                actor,
                l.itemId,
                l.locationId,
                delta,
                doc.id,
                "ADJUSTMENT",
              );
          }
        await tx.document.update({
          where: { id: doc.id },
          data: {
            status: action === "post-stocktake" ? "posted" : "cancelled",
            approverId: actor.id,
            reason: p.reason,
          },
        });
      }
      await audit(tx, actor, action.toUpperCase(), doc.id, p);
      return { id: doc.id };
    }
    if (action === "maintenance" || action === "incident") {
      const p = z
        .object({
          assetId: id,
          reason: text,
          result: z
            .enum(["pass", "fail", "installed", "blocked"])
            .default("blocked"),
          validUntil: z.string().optional(),
          photoId: z.string().optional(),
          method: z.string().max(500).optional(),
          projectId: z.string().optional(),
        })
        .parse(input);
      const asset = await tx.asset.findUniqueOrThrow({
        where: { id: p.assetId },
      });
      if (action === "maintenance") permit(actor, "stock");
      else if (actor.role === "TECHNICIAN") {
        if (asset.custodianId !== actor.id)
          throw new Error("Unit bukan tanggung jawab Anda.");
      } else permit(actor, "stock");
      if (p.photoId) await attachment(tx, actor, p.photoId);
      if (action === "maintenance") {
        const validUntil = p.validUntil
          ? businessDate(p.validUntil, await businessTimezone(tx), true)
          : null;
        if (!["available", "blocked", "installed"].includes(asset.availability))
          throw new Error("Unit masih dipinjam/direservasi/menunggu inspeksi.");
        await unfrozen(tx, asset.locationId);
        if (
          p.result === "pass" &&
          asset.calibrationRequired &&
          (!validUntil || validUntil <= new Date() || !p.method)
        )
          throw new Error("Metode dan masa berlaku kalibrasi wajib.");
        if (p.result === "installed") {
          if (!p.projectId)
            throw new Error("Referensi proyek instalasi wajib.");
          await activeMaster(tx, p.projectId, "project");
          if (!eligible(asset)) throw new Error("Unit belum layak instalasi.");
        }
        await tx.asset.update({
          where: { id: asset.id },
          data: {
            availability:
              p.result === "pass"
                ? "available"
                : p.result === "installed"
                  ? "installed"
                  : "blocked",
            condition: p.result === "pass" ? "Baik" : asset.condition,
            technical: ["pass", "installed"].includes(p.result)
              ? "Normal"
              : "Perlu Pemeriksaan",
            ...(validUntil ? { validUntil } : {}),
          },
        });
      }
      const row = await tx.record.create({
        data: {
          kind: action,
          actorId: actor.id,
          referenceId: asset.id,
          payload: json(p),
        },
      });
      await audit(tx, actor, action.toUpperCase(), row.id, p);
      return { id: row.id };
    }
    if (action === "user-access") {
      permit(actor, "users");
      const p = z
        .object({
          id,
          role: z.enum(["ADMIN", "WAREHOUSE", "TECHNICIAN", "AUDITOR"]),
          active: z.boolean(),
          emergencyIssue: z.boolean().default(false),
          reason: text,
        })
        .parse(input);
      ensureReason(p.reason);
      if (p.id === actor.id)
        throw new Error("Tidak dapat mengubah akses sendiri.");
      const before = await tx.user.findUniqueOrThrow({ where: { id: p.id } });
      await tx.user.update({
        where: { id: p.id },
        data: {
          role: p.role,
          isActive: p.active,
          emergencyIssue: p.role === "ADMIN" && p.emergencyIssue,
        },
      });
      await tx.session.deleteMany({ where: { userId: p.id } });
      await audit(tx, actor, "USER_ACCESS", p.id, {
        before: {
          role: before.role,
          active: before.isActive,
          emergencyIssue: before.emergencyIssue,
        },
        after: p,
      });
      return { id: p.id };
    }
    if (action === "user-create" || action === "user-reset") {
      permit(actor, "users");
      const p = z
        .object({
          id: z.string().optional(),
          username: z
            .string()
            .regex(/^[a-zA-Z0-9_.-]{3,50}$/)
            .optional(),
          name: z.string().min(2).max(150).optional(),
          role: z
            .enum(["ADMIN", "WAREHOUSE", "TECHNICIAN", "AUDITOR"])
            .default("TECHNICIAN"),
          password: z.string().min(16).max(128),
          reason: text,
        })
        .parse(input);
      ensureReason(p.reason);
      const password = await hashPassword(p.password);
      let userId: string;
      let role = p.role;
      if (action === "user-create") {
        if (!p.username || !p.name) throw new Error("Username dan nama wajib.");
        userId = crypto.randomUUID();
        await tx.user.create({
          data: {
            id: userId,
            name: p.name,
            username: p.username.toLowerCase(),
            displayUsername: p.username,
            email: `${p.username.toLowerCase()}@inventory.internal`,
            emailVerified: true,
            role: p.role,
            mustChangePassword: true,
          },
        });
        await tx.account.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            providerId: "credential",
            accountId: userId,
            password,
          },
        });
      } else {
        if (!p.id || p.id === actor.id)
          throw new Error("Gunakan Profil untuk password sendiri.");
        const user = await tx.user.findUniqueOrThrow({ where: { id: p.id } });
        if (user.role === "SYSTEM")
          throw new Error("Akun sistem tidak memiliki password interaktif.");
        userId = user.id;
        role = user.role as typeof role;
        const updated = await tx.account.updateMany({
          where: { userId, providerId: "credential" },
          data: { password },
        });
        if (updated.count !== 1)
          throw new Error(
            "Credential akun tidak konsisten; reset tidak diterapkan.",
          );
        await tx.user.update({
          where: { id: userId },
          data: { mustChangePassword: true },
        });
        await tx.session.deleteMany({ where: { userId } });
      }
      await audit(tx, actor, action.toUpperCase(), userId, {
        reason: p.reason,
        role,
      });
      return { id: userId };
    }
    if (action === "retry-pdf") {
      permit(actor, "stock");
      const p = z.object({ id }).parse(input);
      const snap = await tx.snapshot.findUniqueOrThrow({ where: { id: p.id } });
      if (snap.status !== "failed")
        throw new Error("Hanya bukti gagal yang dapat diulang.");
      await tx.snapshot.update({
        where: { id: snap.id },
        data: { status: "pending" },
      });
      await tx.outbox.create({
        data: { type: "pdf", payload: { snapshotId: snap.id } },
      });
      await audit(tx, actor, "PDF_RETRY", snap.id, { version: snap.version });
      return { id: snap.id };
    }
    if (action === "settings") {
      permit(actor, "users");
      const p = z
        .object({
          reason: text,
          pickupHours: z.number().int().min(1).max(720),
          timezone: z.enum(["Asia/Makassar", "Asia/Singapore", "Asia/Jakarta"]),
          formCode: z.string().max(50),
          formRevision: z.string().max(50),
        })
        .parse(input);
      const row = await tx.record.create({
        data: { kind: "settings", actorId: actor.id, payload: json(p) },
      });
      await audit(tx, actor, "SETTINGS_UPDATED", row.id, p);
      return { id: row.id };
    }
    throw new Error("Tindakan tidak dikenal.");
  });
}
async function release(tx: Tx, documentId: string) {
  const lines = await tx.line.findMany({ where: { documentId } });
  for (const l of lines) {
    const item = await tx.item.findUniqueOrThrow({ where: { id: l.itemId } });
    if (item.tracking === "quantity") {
      const b = await tx.balance.findUniqueOrThrow({
        where: {
          itemId_locationId: { itemId: l.itemId, locationId: l.locationId },
        },
      });
      await tx.balance.update({
        where: { id: b.id },
        data: { reserved: b.reserved.sub(l.approved.sub(l.fulfilled)) },
      });
    }
  }
  await tx.asset.updateMany({
    where: { requestId: documentId, availability: "reserved" },
    data: { availability: "available", requestId: null },
  });
}
export async function expireReservations() {
  const system = await db.user.findFirst({
    where: { id: "system-worker", isActive: true },
  });
  if (!system) return;
  const expired = await db.document.findMany({
    where: {
      kind: "request",
      status: "approved",
      pickupDeadline: { lt: new Date() },
    },
  });
  for (const doc of expired)
    await atomic(
      system,
      crypto.randomUUID(),
      "expire",
      { id: doc.id },
      async (tx) => {
        const current = await tx.document.findUniqueOrThrow({
          where: { id: doc.id },
        });
        if (current.status !== "approved") return {};
        await release(tx, doc.id);
        await tx.document.update({
          where: { id: doc.id },
          data: { status: "expired" },
        });
        await audit(tx, system, "RESERVATION_EXPIRED", doc.id, {});
        return { id: doc.id };
      },
    );
}
