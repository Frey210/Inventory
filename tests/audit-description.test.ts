import test from "node:test";
import assert from "node:assert/strict";
import { describeAudit } from "../src/lib/audit-description";
test("audit summary exposes useful changes without nested credentials or unknown payload", () => {
  const result = describeAudit("ITEM_SAVED", {
    before: { minStock: "0", password: "old" },
    after: { minStock: "5", password: "secret", accounts: { token: "hidden" } },
    token: "private",
  });
  assert.match(result.summary, /Stok minimum: 0 menjadi 5/);
  assert.doesNotMatch(JSON.stringify(result), /secret|hidden|private|password/);
  assert.equal(
    describeAudit("UNRECOGNIZED", { password: "secret" }).action,
    "Aktivitas sistem",
  );
  assert.equal(describeAudit("ISSUE", null).action, "Komponen diserahkan");
  assert.match(
    describeAudit("REPORT_EXPORTED", {
      rows: 264,
      filters: {
        type: "stock",
        from: "2026-11-01",
        to: "2026-11-02",
        token: "secret",
      },
    }).summary,
    /264 baris/,
  );
});
