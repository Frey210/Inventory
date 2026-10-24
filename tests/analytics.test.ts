import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticsPeriod } from "../src/server/analytics-period";
test("analytics uses an inclusive company calendar and exclusive next-day boundary", () => {
  const period = analyticsPeriod(
    "30",
    "Asia/Makassar",
    new Date("2026-10-24T16:01:00Z"),
  );
  assert.equal(period.dates.at(-1), "2026-10-25");
  assert.equal(period.dates[0], "2026-09-26");
  assert.equal(period.from.toISOString(), "2026-09-25T16:00:00.000Z");
  assert.equal(period.to.toISOString(), "2026-10-25T16:00:00.000Z");
  assert.equal(new Set(analyticsPeriod("180", "Asia/Jakarta").dates).size, 180);
  assert.equal(analyticsPeriod("untrusted", "Asia/Jakarta").days, 30);
});
