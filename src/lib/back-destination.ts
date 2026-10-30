export function backDestination(path: string, technician: boolean) {
  const home = technician ? "/me" : "/admin/dashboard";
  if (path === home) return null;
  const base = technician ? "/me" : "/admin";
  if (path.startsWith("/me/requests/"))
    return path === "/me/requests/new" ? "/me/items" : "/me/history";
  if (/^\/(admin|me)\/items\/[^/]+\/edit$/.test(path)) return path.slice(0, -5);
  if (
    /^\/(admin|me)\/(items|receipts|requests|loans|returns|stocktakes)\/[^/]+$/.test(
      path,
    )
  ) {
    return path.slice(0, path.lastIndexOf("/"));
  }
  if (path.startsWith("/admin/assets/")) return "/admin/items";
  if (path.startsWith(base + "/consumable-returns/"))
    return technician ? "/me/history" : "/admin/consumable-returns";
  return home;
}
