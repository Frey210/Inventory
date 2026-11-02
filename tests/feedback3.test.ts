import { tagAliasId } from "../src/server/tag-alias";
import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/server/db";
import { execute } from "../src/server/inventory";
if (!process.env.INVENTORY_DATABASE_URL?.includes("inventory_test"))
  throw Error("Isolated database required");
test("stocktake findings stay draft, serialize against review, post once and maintenance enforces business type", async () => {
  const p = "f3-" + randomUUID();
  const actor = await db.user.create({
    data: {
      id: p,
      name: "Penghitung",
      email: p + "@test.invalid",
      role: "ADMIN",
      mustChangePassword: false,
    },
  });
  const reviewer = await db.user.create({
    data: {
      id: p + "r",
      name: "Reviewer",
      email: p + "r@test.invalid",
      role: "WAREHOUSE",
      mustChangePassword: false,
    },
  });
  const master = async (kind: string, code: string, details: object = {}) =>
    db.master.create({ data: { kind, code: p + code, name: code, details } });
  const rack = await master("location", "rack"),
    other = await master("location", "other"),
    cat = await master("category", "cat"),
    pcs = await master("unit", "pcs", { fractional: false });
  const types = await db.master.findMany({
    where: {
      kind: "type",
      code: { in: ["CONSUMABLE", "EQUIPMENT", "PRODUCT"] },
    },
  });
  const item = await db.item.create({
    data: {
      sku: p,
      name: "Temuan",
      typeId: types.find((t) => t.code === "CONSUMABLE")!.id,
      categoryId: cat.id,
      unitId: pcs.id,
      locationId: rack.id,
      tracking: "quantity",
    },
  });
  const run = async (
    action: string,
    input: unknown,
    who = actor,
    key = randomUUID(),
  ) => (await execute(who, key, action, input)) as { id: string };
  try {
    const take = await run("stocktake", {
      locationId: rack.id,
      reason: "Hitung fisik",
    });
    await assert.rejects(
      run("count-stocktake", { id: take.id, reason: "Kosong", counts: {} }),
      /Tambahkan/,
    );
    const key = randomUUID(),
      payload = {
        id: take.id,
        itemId: item.id,
        assetId: "",
        reason: "Ditemukan di rak",
      };
    await Promise.all([
      run("stocktake-add-item", payload, actor, key),
      run("stocktake-add-item", payload, actor, key),
    ]);
    assert.equal(await db.line.count({ where: { documentId: take.id } }), 1);
    assert.equal(await db.balance.count({ where: { itemId: item.id } }), 0);
    await assert.rejects(run("stocktake-add-item", payload), /sudah ada/);
    await run("stocktake-finding", {
      id: take.id,
      reason: "Unit asing perlu registrasi",
    });
    const line = await db.line.findFirstOrThrow({
      where: { documentId: take.id },
    });
    await assert.rejects(
      run("count-stocktake", {
        id: take.id,
        reason: "Pecahan",
        counts: { [line.id]: "0.5" },
      }),
      /pecahan/,
    );
    await run("count-stocktake", {
      id: take.id,
      reason: "Lima fisik",
      counts: { [line.id]: "5" },
    });
    await assert.rejects(run("stocktake-add-item", payload), /draft/);
    await assert.rejects(
      run("post-stocktake", { id: take.id, reason: "Sendiri" }),
      /izin|Review/,
    );
    const postKey = randomUUID();
    await Promise.all([
      run(
        "post-stocktake",
        { id: take.id, reason: "Diverifikasi" },
        reviewer,
        postKey,
      ),
      run(
        "post-stocktake",
        { id: take.id, reason: "Diverifikasi" },
        reviewer,
        postKey,
      ),
    ]);
    assert.equal(
      (
        await db.balance.findFirstOrThrow({ where: { itemId: item.id } })
      ).onHand.toString(),
      "5",
    );
    assert.equal(await db.ledger.count({ where: { referenceId: take.id } }), 1);
    assert.equal(await db.freeze.count({ where: { locationId: rack.id } }), 0);
    const tool = await db.item.create({
      data: {
        sku: p + "tool",
        name: "Alat",
        typeId: types.find((t) => t.code === "EQUIPMENT")!.id,
        categoryId: cat.id,
        unitId: pcs.id,
        locationId: other.id,
        tracking: "serialized",
      },
    });
    const asset = await db.asset.create({
      data: { itemId: tool.id, tag: p + "tag", locationId: other.id },
    });
    const newTag =
      "MTC-F3" +
      randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase() +
      "-001";
    const retagKey = randomUUID();
    const retagPayload = {
      id: asset.id,
      expectedTag: asset.tag,
      tag: newTag,
      reason: "Pemetaan disetujui",
    };
    await Promise.all([
      run("asset-retag", retagPayload, actor, retagKey),
      run("asset-retag", retagPayload, actor, retagKey),
    ]);
    assert.equal(
      (
        await db.record.findUniqueOrThrow({
          where: { id: tagAliasId(asset.tag) },
        })
      ).referenceId,
      asset.id,
    );
    assert.equal(
      (await db.asset.findUniqueOrThrow({ where: { id: asset.id } })).tag,
      newTag,
    );
    await assert.rejects(
      run("asset-retag", { ...retagPayload, expectedTag: newTag, tag: newTag }),
      /sudah dipakai/,
    );
    await assert.rejects(
      run("maintenance", { assetId: asset.id, result: "pass", reason: "Uji" }),
      /hanya untuk sensor/,
    );
    const take2 = await run("stocktake", {
      locationId: rack.id,
      reason: "Hitung kedua",
    });
    await assert.rejects(
      run("stocktake-add-item", {
        id: take2.id,
        itemId: tool.id,
        assetId: asset.id,
        reason: "Beda rak",
      }),
      /lokasi/,
    );
    await run("cancel-stocktake", { id: take2.id, reason: "Dibatalkan" });
    const raceItem = await db.item.create({
      data: {
        sku: p + "race",
        name: "Temuan kedua",
        typeId: item.typeId,
        categoryId: cat.id,
        unitId: pcs.id,
        locationId: rack.id,
        tracking: "quantity",
      },
    });
    const raceTake = await run("stocktake", {
      locationId: rack.id,
      reason: "Race tambah dengan pengajuan",
    });
    const previous = await db.line.findMany({
      where: { documentId: raceTake.id },
    });
    const race = await Promise.allSettled([
      run("stocktake-add-item", {
        id: raceTake.id,
        itemId: raceItem.id,
        reason: "Barang baru",
      }),
      run("count-stocktake", {
        id: raceTake.id,
        reason: "Hitung selesai",
        counts: Object.fromEntries(previous.map((l) => [l.id, "5"])),
      }),
    ]);
    assert.equal(
      race.filter((r) => r.status === "fulfilled").length,
      1,
      "submit or addition must lose safely",
    );
    const raceDoc = await db.document.findUniqueOrThrow({
      where: { id: raceTake.id },
      include: { lines: true },
    });
    if (raceDoc.status === "draft")
      assert.equal(raceDoc.lines.length, previous.length + 1);
    else {
      assert.equal(raceDoc.status, "review");
      assert.equal(raceDoc.lines.length, previous.length);
    }
    await run("cancel-stocktake", { id: raceTake.id, reason: "Selesai uji" });
    assert.equal(await db.balance.count({ where: { itemId: raceItem.id } }), 0);
    const product = await db.item.create({
      data: {
        sku: p + "prod",
        name: "Produk",
        typeId: types.find((t) => t.code === "PRODUCT")!.id,
        categoryId: cat.id,
        unitId: pcs.id,
        locationId: other.id,
        tracking: "serialized",
      },
    });
    const productAsset = await db.asset.create({
      data: {
        itemId: product.id,
        tag: p + "product",
        locationId: other.id,
        availability: "blocked",
      },
    });
    await run("maintenance", {
      assetId: productAsset.id,
      result: "pass",
      reason: "Pemeriksaan lulus",
    });
    assert.equal(
      (await db.asset.findUniqueOrThrow({ where: { id: productAsset.id } }))
        .availability,
      "available",
    );
  } finally {
    await db.$disconnect();
  }
});
