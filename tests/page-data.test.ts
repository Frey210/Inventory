import test from "node:test";
import assert from "node:assert/strict";
import { pageDataNeeds } from "../src/server/page-data";

test("light pages do not fetch the catalog or stock; stock stays scoped to pages that display it", () => {
  for (const path of [
    "/profile",
    "/notifications",
    "/admin/loans",
    "/admin/returns",
    "/me/history",
    "/me/pickups",
    "/admin/requests",
    "/admin/receipts",
    "/admin/audit",
    "/admin/overrides",
  ]) {
    const needs = pageDataNeeds(path);
    assert.equal(needs.items, false, path);
    assert.equal(needs.stock, false, path);
  }
  for (const path of ["/admin/dashboard", "/me", "/admin/items", "/me/items"])
    assert.deepEqual(
      pageDataNeeds(path),
      { masters: true, items: true, stock: true },
      path,
    );
  for (const path of [
    "/admin/requests/new",
    "/me/requests/new",
    "/admin/receipts/new",
    "/admin/receipts/a",
    "/admin/requests/a",
    "/me/requests/a",
    "/admin/issues/a",
    "/admin/transfers",
    "/admin/stocktakes/a",
    "/me/consumable-returns/new",
    "/admin/reports",
  ])
    assert.deepEqual(
      pageDataNeeds(path),
      { masters: true, items: true, stock: false },
      path,
    );
  for (const path of [
    "/admin/masters",
    "/admin/items/new",
    "/admin/items/a/edit",
    "/admin/items/a",
    "/me/items/a",
    "/admin/loans/a",
    "/admin/returns/a",
    "/me/loans/a",
    "/admin/users",
    "/admin/settings",
    "/admin/maintenance",
  ])
    assert.deepEqual(
      pageDataNeeds(path),
      { masters: true, items: false, stock: false },
      path,
    );
});
