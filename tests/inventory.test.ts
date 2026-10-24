import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { execute } from "../src/server/inventory";
import { stockReminder, loanReminders } from "../src/server/reminders";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw new Error(
    "Integration tests require isolated inventory_test database.",
  );
test("PostgreSQL: atomic ledger, competing approvals, idempotency, loan partial return and immutable audit", async () => {
  const suffix = randomUUID().slice(0, 8);
  const admin = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Test Admin",
      email: `a-${suffix}@test.invalid`,
      role: "ADMIN",
      mustChangePassword: false,
    },
  });
  const warehouse = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Test Gudang",
      email: `w-${suffix}@test.invalid`,
      role: "WAREHOUSE",
      mustChangePassword: false,
    },
  });
  const tech = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Test Teknisi",
      email: `t-${suffix}@test.invalid`,
      role: "TECHNICIAN",
      mustChangePassword: false,
    },
  });
  const run = async (
    actor: typeof admin,
    action: string,
    payload: unknown,
    key = randomUUID(),
  ) => (await execute(actor, key, action, payload)) as { id: string };
  try {
    const location = await run(admin, "master", {
      kind: "location",
      code: "LOC-" + suffix,
      name: "Test Gudang",
      details: {},
    });
    const project = await run(admin, "master", {
      kind: "project",
      code: "PRJ-" + suffix,
      name: "Test Proyek",
      details: {},
    });
    const category = await run(admin, "master", {
      kind: "category",
      code: "CAT-" + suffix,
      name: "Test Kategori",
      details: {},
    });
    const type = await db.master.findUniqueOrThrow({
      where: { kind_code: { kind: "type", code: "CONSUMABLE" } },
    });
    const unit = await db.master.findUniqueOrThrow({
      where: { kind_code: { kind: "unit", code: "PCS" } },
    });
    const item = await run(admin, "item", {
      sku: "SKU-" + suffix,
      name: "Test Component",
      typeId: type.id,
      categoryId: category.id,
      unitId: unit.id,
      locationId: location.id,
      minStock: "0",
    });
    const line = { itemId: item.id, locationId: location.id, quantity: "5" };
    await assert.rejects(
      run(admin, "item", {
        sku: "FRACTION-" + suffix,
        name: "Invalid PCS threshold",
        typeId: type.id,
        categoryId: category.id,
        unitId: unit.id,
        locationId: location.id,
        minStock: "0.5",
      }),
      /Minimum stok/,
    );
    const receipt = await run(warehouse, "receipt", {
      purpose: "Test penerimaan",
      lines: [line],
    });
    assert.equal(
      await db.balance.count({ where: { itemId: item.id } }),
      0,
      "draft must not change stock",
    );
    const key = randomUUID();
    await run(warehouse, "post-receipt", { id: receipt.id }, key);
    await run(warehouse, "post-receipt", { id: receipt.id }, key);
    assert.equal(
      (
        await db.balance.findFirstOrThrow({ where: { itemId: item.id } })
      ).onHand.toString(),
      "5",
    );
    assert.equal(
      await db.ledger.count({ where: { referenceId: receipt.id } }),
      1,
    );
    await assert.rejects(
      run(
        warehouse,
        "post-receipt",
        { id: receipt.id, reason: "changed" },
        key,
      ),
      /retry/,
    );
    const requests = await Promise.all(
      [1, 2].map(() =>
        run(tech, "request", {
          projectId: project.id,
          purpose: "Test penggunaan",
          lines: [{ ...line, quantity: "3" }],
        }),
      ),
    );
    const approvals = await Promise.allSettled(
      requests.map((r) => run(warehouse, "approve", { id: r.id })),
    );
    assert.equal(
      approvals.filter((x) => x.status === "fulfilled").length,
      1,
      "only one competing approval succeeds",
    );
    const balance = await db.balance.findFirstOrThrow({
      where: { itemId: item.id },
    });
    assert.equal(balance.onHand.toString(), "5");
    assert.equal(balance.reserved.toString(), "3");
    const chosen = await db.document.findFirstOrThrow({
      where: { id: { in: requests.map((r) => r.id) }, status: "approved" },
    });
    await run(tech, "acknowledge", { id: chosen.id });
    await run(warehouse, "issue", { id: chosen.id });
    assert.equal(
      (
        await db.balance.findFirstOrThrow({ where: { itemId: item.id } })
      ).onHand.toString(),
      "2",
    );
    const issued = await db.line.findFirstOrThrow({
      where: { documentId: chosen.id },
    });
    await run(warehouse, "consumable-return", {
      lineId: issued.id,
      quantity: "2",
      reason: "Sisa layak diuji",
      receive: true,
    });
    await assert.rejects(
      run(warehouse, "waste", {
        lineId: issued.id,
        quantity: "2",
        reason: "Melebihi issue",
      }),
      /kumulatif/,
    );
    const equipment = await db.master.findUniqueOrThrow({
      where: { kind_code: { kind: "type", code: "EQUIPMENT" } },
    });
    const assetItem = await run(admin, "item", {
      sku: "EQ-" + suffix,
      name: "Test Equipment",
      typeId: equipment.id,
      categoryId: category.id,
      unitId: unit.id,
      locationId: location.id,
      minStock: "0",
    });
    const assetReceipt = await run(warehouse, "receipt", {
      purpose: "Test equipment",
      lines: [1, 2, 3].map((n) => ({
        itemId: assetItem.id,
        locationId: location.id,
        quantity: "1",
        ...(n === 1 ? { tag: `MTC-EQ-${suffix.toUpperCase()}-009` } : {}),
      })),
    });
    const bulkLocation = await run(admin, "master", {
      kind: "location",
      code: "BULK-" + suffix,
      name: "Rak batch uji",
      details: {},
    });
    const bulkItem = await run(admin, "item", {
      sku: "BULK-" + suffix,
      name: "Bulk tool",
      typeId: equipment.id,
      categoryId: category.id,
      unitId: unit.id,
      locationId: bulkLocation.id,
      minStock: "0",
    });
    const hundred = Array.from({ length: 100 }, () => ({
      itemId: bulkItem.id,
      locationId: bulkLocation.id,
      quantity: "1",
    }));
    await assert.rejects(
      run(warehouse, "receipt", {
        purpose: "Too many units",
        lines: [...hundred, hundred[0]],
      }),
    );
    const bulk = await run(warehouse, "receipt", {
      purpose: "One hundred units",
      lines: hundred,
    });
    assert.equal(await db.line.count({ where: { documentId: bulk.id } }), 100);
    await run(warehouse, "post-receipt", { id: bulk.id });
    assert.equal(await db.asset.count({ where: { itemId: bulkItem.id } }), 100);
    assert.equal(await db.balance.count({ where: { itemId: bulkItem.id } }), 0);
    const collision = await run(warehouse, "receipt", {
      purpose: "Atomic collision",
      lines: [{ ...hundred[0], serial: "SERIAL-" + suffix }, { ...hundred[0] }],
    });
    await db.asset.create({
      data: {
        itemId: bulkItem.id,
        locationId: bulkLocation.id,
        tag: "COLLISION-" + suffix,
        serial: "SERIAL-" + suffix,
      },
    });
    await assert.rejects(run(warehouse, "post-receipt", { id: collision.id }));
    assert.equal(await db.asset.count({ where: { itemId: bulkItem.id } }), 101);
    assert.equal(
      (await db.document.findUniqueOrThrow({ where: { id: collision.id } }))
        .status,
      "draft",
    );
    assert.equal(
      await db.ledger.count({ where: { referenceId: collision.id } }),
      0,
    );
    const receiptDraft = await db.line.findMany({
      where: { documentId: assetReceipt.id },
      orderBy: { id: "asc" },
    });
    assert.deepEqual(
      receiptDraft.map((l) => (l.details as { tag: string }).tag).sort(),
      [9, 10, 11]
        .map(
          (n) => `MTC-EQ-${suffix.toUpperCase()}-${String(n).padStart(3, "0")}`,
        )
        .sort(),
    );
    const parallel = await Promise.all(
      [1, 2].map(() =>
        run(warehouse, "receipt", {
          purpose: "Concurrent allocation",
          lines: [
            { itemId: assetItem.id, locationId: location.id, quantity: "1" },
          ],
        }),
      ),
    );
    const parallelLines = await db.line.findMany({
      where: { documentId: { in: parallel.map((r) => r.id) } },
    });
    assert.equal(
      new Set(parallelLines.map((l) => (l.details as { tag: string }).tag))
        .size,
      2,
    );
    const retryKey = randomUUID();
    const retryPayload = {
      purpose: "Retry allocation",
      lines: [{ itemId: assetItem.id, locationId: location.id, quantity: "1" }],
    };
    const retryDraft = await run(warehouse, "receipt", retryPayload, retryKey);
    assert.equal(
      (await run(warehouse, "receipt", retryPayload, retryKey)).id,
      retryDraft.id,
    );
    await assert.rejects(
      run(warehouse, "receipt", {
        purpose: "Invalid unit count",
        lines: [
          { itemId: assetItem.id, locationId: location.id, quantity: "2" },
        ],
      }),
      /satu tag/,
    );
    await run(warehouse, "post-receipt", { id: assetReceipt.id });
    const req = await run(tech, "request", {
      projectId: project.id,
      purpose: "Test equipment loan",
      dueAt: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      targetLocationText: "Lokasi proyek <MTC>",
      lines: [{ itemId: assetItem.id, locationId: location.id, quantity: "3" }],
    });
    await run(warehouse, "approve", { id: req.id });
    await run(tech, "acknowledge", { id: req.id });
    await assert.rejects(
      run(warehouse, "checkout", { id: req.id }),
      /kelengkapan/,
    );
    const allocated = await db.asset.findMany({ where: { requestId: req.id } });
    await run(warehouse, "checkout", {
      id: req.id,
      conditions: Object.fromEntries(allocated.map((a) => [a.id, "Baik"])),
      completeness: Object.fromEntries(
        allocated.map((a) => [a.id, "Unit dan kabel lengkap"]),
      ),
    });
    const loan = await db.loan.findUniqueOrThrow({
      where: { requestId: req.id },
      include: { lines: true },
    });
    assert.equal(loan.lines.length, 3);
    assert.equal(loan.dueDateOnly, true);
    assert.match(loan.dueAt.toISOString(), /T(?:15|16):59:59\.999Z$/);
    await loanReminders(new Date(), "Asia/Makassar", [warehouse]);
    const reminderCount = await db.notification.count({
      where: { eventKey: { startsWith: `loan:${loan.id}:` } },
    });
    assert.ok(reminderCount > 0);
    await loanReminders(new Date(), "Asia/Makassar", [warehouse]);
    assert.equal(
      await db.notification.count({
        where: { eventKey: { startsWith: `loan:${loan.id}:` } },
      }),
      reminderCount,
    );
    const frozen = loan.snapshot as {
      project: { name: string };
      approver: { name: string };
      units: { completeness: string }[];
    };
    assert.equal(frozen.project.name, "Test Proyek");
    assert.equal(frozen.approver.name, warehouse.name);
    assert.equal(frozen.units[0].completeness, "Unit dan kabel lengkap");
    assert.equal(
      (loan.snapshot as { usageLocation: { name: string } }).usageLocation.name,
      "Lokasi proyek <MTC>",
    );
    const ids = loan.lines.slice(0, 2).map((l) => l.assetId);
    await run(tech, "request-return", { id: loan.id, assetIds: ids });
    assert.equal(
      await db.asset.count({
        where: { loanId: loan.id, availability: "borrowed" },
      }),
      3,
    );
    const races = await Promise.allSettled(
      [1, 2].map(() =>
        run(warehouse, "receive-return", { id: loan.id, assetIds: ids }),
      ),
    );
    assert.equal(races.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      await db.asset.count({
        where: { loanId: loan.id, availability: "pending_inspection" },
      }),
      2,
    );
    await run(warehouse, "inspect", {
      id: loan.id,
      assetIds: ids,
      condition: "Baik",
    });
    assert.equal(
      (await db.loan.findUniqueOrThrow({ where: { id: loan.id } })).status,
      "active",
    );
    assert.equal(
      await db.asset.count({
        where: { itemId: assetItem.id, availability: "available" },
      }),
      2,
    );
    const last = loan.lines[2].assetId;
    await run(warehouse, "receive-return", { id: loan.id, assetIds: [last] });
    await run(warehouse, "inspect", {
      id: loan.id,
      assetIds: [last],
      condition: "Baik",
    });
    assert.equal(
      (await db.loan.findUniqueOrThrow({ where: { id: loan.id } })).status,
      "completed",
    );
    assert.ok((await db.snapshot.count({ where: { loanId: loan.id } })) >= 5);
    const afterReturn = await db.notification.count({
      where: { eventKey: { startsWith: `loan:${loan.id}:` } },
    });
    await loanReminders(new Date(), "Asia/Makassar", [warehouse]);
    assert.equal(
      await db.notification.count({
        where: { eventKey: { startsWith: `loan:${loan.id}:` } },
      }),
      afterReturn,
    );
    const record = await db.audit.findFirstOrThrow({
      where: { actorId: warehouse.id },
    });
    await assert.rejects(db.audit.delete({ where: { id: record.id } }));
    await assert.rejects(
      run(tech, "master", { kind: "location", code: "X", name: "Illegal" }),
      /izin/,
    );
    const take = await run(admin, "stocktake", {
      locationId: location.id,
      reason: "Uji hitung fisik",
    });
    await assert.rejects(
      run(warehouse, "receipt", { purpose: "Lokasi beku", lines: [line] }),
      /dibekukan/,
    );
    const counted = await db.line.findMany({ where: { documentId: take.id } });
    await run(admin, "count-stocktake", {
      id: take.id,
      reason: "Selisih fisik terverifikasi",
      counts: Object.fromEntries(
        counted.map((l) => [
          l.id,
          l.assetId === last ? "0" : l.assetId ? "1" : "0",
        ]),
      ),
    });
    await assert.rejects(
      run(admin, "post-stocktake", { id: take.id, reason: "Self review" }),
      /izin|pihak lain/,
    );
    await run(warehouse, "post-stocktake", {
      id: take.id,
      reason: "Review selisih dengan saksi",
    });
    assert.equal(
      (await db.asset.findUniqueOrThrow({ where: { id: last } })).condition,
      "Hilang",
    );
    assert.equal(
      await db.freeze.count({ where: { locationId: location.id } }),
      0,
    );
    assert.equal(
      (
        await db.balance.findUniqueOrThrow({
          where: {
            itemId_locationId: { itemId: item.id, locationId: location.id },
          },
        })
      ).onHand.toString(),
      "0",
    );
    const cancelled = await run(admin, "stocktake", {
      locationId: location.id,
      reason: "Uji sesi batal",
    });
    await run(admin, "cancel-stocktake", {
      id: cancelled.id,
      reason: "Jadwal hitung dibatalkan",
    });
    assert.equal(
      await db.freeze.count({ where: { locationId: location.id } }),
      0,
    );
    const csv = `sku,location,quantity,tag,serial,condition,calibration_required,valid_until\nSKU-${suffix},LOC-${suffix},2,,,Baik,false,`;
    const opening = await run(admin, "opening-import", {
      batchId: "BATCH-" + suffix,
      csv,
      reason: "Simulasi saldo pembukaan",
    });
    assert.equal(
      (await db.document.findUniqueOrThrow({ where: { id: opening.id } }))
        .status,
      "draft",
    );
    assert.equal(
      (
        await run(admin, "opening-import", {
          batchId: "BATCH-" + suffix,
          csv,
          reason: "Simulasi saldo pembukaan",
        })
      ).id,
      opening.id,
    );
    await run(warehouse, "post-receipt", { id: opening.id });
    const emergency = await run(tech, "request", {
      projectId: project.id,
      purpose: "Kebutuhan darurat simulasi",
      lines: [{ ...line, quantity: "1" }],
    });
    await assert.rejects(
      run(admin, "emergency-approve", {
        id: emergency.id,
        reason: "Kasus darurat simulasi",
      }),
      /Permission/,
    );
    await db.user.update({
      where: { id: admin.id },
      data: { emergencyIssue: true },
    });
    await run(admin, "emergency-approve", {
      id: emergency.id,
      reason: "Kasus darurat simulasi",
    });
    await run(tech, "acknowledge", { id: emergency.id });
    await run(warehouse, "issue", { id: emergency.id });
    const override = await db.record.findFirstOrThrow({
      where: { kind: "emergency_override", referenceId: emergency.id },
    });
    await run(warehouse, "review-override", {
      id: override.id,
      reason: "Keputusan darurat telah ditinjau",
    });
    assert.equal(
      (await db.record.findUniqueOrThrow({ where: { id: override.id } }))
        .status,
      "reviewed",
    );
    const originalRequest = await run(tech, "request", {
      projectId: project.id,
      purpose: "Request sebelum revisi",
      lines: [{ ...line, quantity: "1" }],
    });
    await run(warehouse, "approve", { id: originalRequest.id });
    const revised = await run(tech, "revise-request", {
      id: originalRequest.id,
      projectId: project.id,
      purpose: "Perubahan kebutuhan membutuhkan approval ulang",
      lines: [{ ...line, quantity: "2" }],
    });
    assert.equal(
      (
        await db.document.findUniqueOrThrow({
          where: { id: originalRequest.id },
        })
      ).status,
      "superseded",
    );
    assert.equal(
      (await db.document.findUniqueOrThrow({ where: { id: revised.id } }))
        .status,
      "submitted",
    );
    assert.equal(
      (
        await db.balance.findUniqueOrThrow({
          where: {
            itemId_locationId: { itemId: item.id, locationId: location.id },
          },
        })
      ).reserved.toString(),
      "0",
    );
    await assert.rejects(
      run(warehouse, "approve", { id: revised.id }),
      /cukup/,
    );
    const alertBalance = await db.balance.findUniqueOrThrow({
      where: {
        itemId_locationId: { itemId: item.id, locationId: location.id },
      },
    });
    await stockReminder(alertBalance.id, [{ id: warehouse.id }]);
    await run(admin, "item", {
      id: item.id,
      version: 1,
      sku: "SKU-" + suffix,
      name: "Test Component",
      typeId: type.id,
      categoryId: category.id,
      unitId: unit.id,
      locationId: location.id,
      minStock: "1",
    });
    await stockReminder(alertBalance.id, [{ id: warehouse.id }]);
    const count = await db.notification.count({
      where: {
        recipientId: warehouse.id,
        eventKey: { startsWith: `stock:${alertBalance.id}:` },
      },
    });
    assert.equal(count, 1);
    await stockReminder(alertBalance.id, [{ id: warehouse.id }]);
    assert.equal(
      await db.notification.count({
        where: {
          recipientId: warehouse.id,
          eventKey: { startsWith: `stock:${alertBalance.id}:` },
        },
      }),
      count,
    );
    await assert.rejects(
      db.loan.update({
        where: { id: loan.id },
        data: { snapshot: { tampered: true } },
      }),
      /Immutable/,
    );
  } finally {
    await db.$disconnect();
  }
});
