import { test } from "node:test";
import assert from "node:assert/strict";
import { businessDate } from "../src/server/business-date";
test("business dates use configured timezone and calibration remains valid through local day", () => {
  assert.equal(
    businessDate("2026-10-18T12:00", "Asia/Makassar").toISOString(),
    "2026-10-18T04:00:00.000Z",
  );
  assert.equal(
    businessDate("2026-10-18T12:00", "Asia/Jakarta").toISOString(),
    "2026-10-18T05:00:00.000Z",
  );
  assert.equal(
    businessDate("2026-10-18", "Asia/Makassar", true).toISOString(),
    "2026-10-18T15:59:59.999Z",
  );
  assert.throws(() => businessDate("2026-02-30", "Asia/Makassar"), /kalender/);
});
