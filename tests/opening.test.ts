import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOpeningCsv, openingColumns } from "../src/server/opening";
test("opening CSV preserves codes, exact decimals, quoted fields and row errors", async () => {
  const rows = await parseOpeningCsv(
    openingColumns.join(",") +
      '\n001,"RAK,01",1.0001,,,Baik,false,\n002,R1,-1,,,Baik,false,',
  );
  assert.equal(rows[0].values.sku, "001");
  assert.equal(rows[0].values.location, "RAK,01");
  assert.equal(rows[0].values.quantity, "1.0001");
  assert.equal(rows[0].errors.length, 0);
  assert.equal(rows[1].row, 3);
  assert.ok(rows[1].errors.length);
  await assert.rejects(parseOpeningCsv("wrong,header\na,b"), /Header/);
});
