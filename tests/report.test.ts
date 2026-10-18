import { test } from "node:test";
import assert from "node:assert/strict";
import {
  spreadsheetSafe,
  csvReport,
  printReport,
} from "../src/server/report-format";
test("export prevents spreadsheet formulas and escapes printable user content", () => {
  assert.equal(spreadsheetSafe("=HYPERLINK(x)"), "'=HYPERLINK(x)");
  assert.ok(
    csvReport([["a,b", '"quoted"', "+cmd"]]).includes(
      '"a,b","""quoted""","\'+cmd"',
    ),
  );
  const html = printReport("<script>bad</script>", [
    ["Nama"],
    ["<img onerror=x>"],
  ]);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;img onerror=x&gt;"));
});
