import { test } from "node:test";
import assert from "node:assert/strict";
import { eligible, assertReturn, quantity } from "../src/server/rules";
import { loanHtml } from "../src/server/documents/template";
test("checkout rejects overdue calibration and unavailable unit", () => {
  const unit = {
    availability: "available",
    condition: "Baik",
    technical: "Normal",
    calibrationRequired: true,
    validUntil: new Date("2020-01-01"),
  };
  assert.equal(eligible(unit), false);
  assert.equal(eligible({ ...unit, calibrationRequired: false }), true);
  assert.equal(
    eligible({ ...unit, availability: "borrowed", calibrationRequired: false }),
    false,
  );
});
test("fractional and large consumption remain exact; waste cannot double count", () => {
  assertReturn("100000000000.0001", "100000000000", "0", "0.0001");
  assert.throws(() =>
    assertReturn("100000000000.0001", "100000000000", "0.0001", "0.0001"),
  );
  assert.equal(quantity.safeParse("1e5").success, false);
  assert.equal(quantity.safeParse("-1").success, false);
  assert.equal(quantity.safeParse("0").success, false);
});
test("PDF escapes user HTML and represents missing return honestly", () => {
  const html = loanHtml(
    {
      number: "LOAN-test",
      snapshot: {
        borrower: { name: "<script>alert(1)</script>" },
        request: { purpose: "<img onerror=x>" },
      },
      lines: [],
      events: [],
    },
    1,
    "data:image/png;base64,",
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Belum ada pengembalian"));
  assert.ok(html.includes("Letter"));
});
