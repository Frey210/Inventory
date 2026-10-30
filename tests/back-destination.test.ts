import { test } from "node:test";
import assert from "node:assert/strict";
import { backDestination } from "../src/lib/back-destination";

test("direct entry fallback stays inside valid role/module destinations", () => {
  for (const [path, tech, expected] of [
    ["/me", true, null],
    ["/admin/dashboard", false, null],
    ["/admin/items/abc/edit", false, "/admin/items/abc"],
    ["/admin/items/new", false, "/admin/items"],
    ["/me/items/abc", true, "/me/items"],
    ["/me/requests/new", true, "/me/items"],
    ["/me/requests/abc", true, "/me/history"],
    ["/me/loans/abc", true, "/me/loans"],
    ["/admin/returns/abc", false, "/admin/returns"],
    ["/admin/assets/abc", false, "/admin/items"],
    ["/me/consumable-returns/new", true, "/me/history"],
    ["/profile", true, "/me"],
    ["/notifications", false, "/admin/dashboard"],
    ["https://example.com", false, "/admin/dashboard"],
  ] as const)
    assert.equal(backDestination(path, tech), expected);
});
