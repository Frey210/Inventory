import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticsPeriod } from "../src/server/analytics-period";
import { chartSku, requestShares } from "../src/lib/analytics-charts";

test("chart SKU labels are shortened deliberately without losing their prefix", () => {
  assert.equal(chartSku("AK001"), "AK001");
  assert.equal(chartSku("AK001-01"), "AK001-01");
  assert.equal(chartSku("AK001-0123456789"), "AK001-0…");
});

test("member donut includes everyone beyond the four visible leaders", () => {
  const members = Array.from({ length: 8 }, (_, i) => ({
    id: String(i),
    name: "Same display name",
    requests: 10 - i,
  }));
  const shares = requestShares(members, 60);
  assert.equal(shares.length, 5);
  assert.equal(shares.at(-1)?.requests, 26);
  assert.equal(
    shares.reduce((sum, row) => sum + row.requests, 0),
    60,
  );
  assert.equal(new Set(shares.map((row) => row.id)).size, 5);
  assert.deepEqual(requestShares([], 0), []);
  assert.deepEqual(requestShares(members.slice(0, 1), 10), members.slice(0, 1));
});
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
