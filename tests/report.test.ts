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

test("print context is readable and escaped", () => {
  const html = printReport("Aktivitas", [["Waktu"], ["uji"]], {
    generatedAt: "2 November 2026 18.00 (Asia/Makassar)",
    filters: "Periode: semua tanggal <script>",
  });
  assert.ok(html.includes("Asia/Makassar"));
  assert.ok(html.includes("Periode: semua tanggal &lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(
    printReport("Aktivitas", [["Waktu"]]).includes("Periode: semua tanggal"),
  );
});
