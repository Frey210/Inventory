export function pageDataNeeds(path: string) {
  const stock = [
    "/admin/dashboard",
    "/me",
    "/admin/items",
    "/me/items",
  ].includes(path);
  const items =
    stock ||
    [
      "/admin/receipts/new",
      "/admin/requests/new",
      "/me/requests/new",
      "/admin/transfers",
      "/admin/consumable-returns",
      "/me/consumable-returns/new",
      "/admin/reports",
    ].includes(path) ||
    /^\/(admin\/(receipts|requests|issues)|me\/requests|admin\/stocktakes)\/[^/]+$/.test(
      path,
    );
  const masters =
    items ||
    [
      "/admin/masters",
      "/admin/items/new",
      "/admin/stocktakes",
      "/admin/maintenance",
      "/admin/incidents",
      "/me/incidents/new",
      "/admin/users",
      "/admin/settings",
    ].includes(path) ||
    /^\/(admin|me)\/items\/[^/]+(?:\/edit)?$/.test(path) ||
    /^\/(admin\/(loans|returns)|me\/loans)\/[^/]+$/.test(path);
  return { masters, items, stock };
}
