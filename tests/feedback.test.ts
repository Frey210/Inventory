import { test } from "node:test";
import assert from "node:assert/strict";
import { readInventoryQr, inventoryQr } from "../src/lib/qr";
import { quantityInput } from "../src/lib/quantity-input";
import { businessDate, loanReminder } from "../src/server/business-date";
test("QR uses stable typed identities and preserves legacy codes without external navigation", () => {
  for (const type of ["ITEM", "ASSET"] as const)
    assert.deepEqual(readInventoryQr(inventoryQr(type, "abc-123")), {
      type,
      id: "abc-123",
    });
  assert.deepEqual(readInventoryQr("MTC-AK001-001"), {
    type: "LEGACY",
    id: "MTC-AK001-001",
  });
  for (const code of [
    "MTC:OTHER:x",
    "MTC:ASSET:",
    "MTC:ITEM:../x",
    "https://example.org",
    "//evil.example",
    "javascript:alert(1)",
    "",
    "x\n",
  ]) {
    if (code === "x\n") {
      assert.deepEqual(readInventoryQr(code), { type: "LEGACY", id: "x" });
      continue;
    }
    assert.equal(readInventoryQr(code), null);
  }
  assert.throws(() => inventoryQr("ITEM", "bad/id"));
});
test("quantity controls preserve fractional units and reminders follow company calendar", () => {
  assert.deepEqual(quantityInput(false), { step: "1", min: "1" });
  assert.deepEqual(quantityInput(true, true), { step: "0.0001", min: "0" });
  const due = businessDate("2026-10-28", "Asia/Makassar", true);
  assert.equal(due.toISOString(), "2026-10-28T15:59:59.999Z");
  for (const [date, phase] of [
    ["2026-10-26T00:00:00Z", "H2"],
    ["2026-10-27T15:00:00Z", "H1"],
    ["2026-10-28T00:00:00Z", "H0"],
    ["2026-10-28T16:00:00Z", "overdue:2026-10-29"],
  ])
    assert.equal(
      loanReminder(due, new Date(date), "Asia/Makassar", true)?.phase,
      phase,
    );
  assert.equal(
    loanReminder(due, new Date("2026-10-25T00:00:00Z"), "Asia/Makassar", true),
    null,
  );
  assert.equal(
    loanReminder(
      new Date("2026-10-28T01:00:00Z"),
      new Date("2026-10-28T02:00:00Z"),
      "Asia/Makassar",
      false,
    )?.phase,
    "overdue:2026-10-28",
  );
});
