export type Actor = { id: string; name: string; role: string };
export function permit(
  actor: Actor,
  capability: "master" | "stock" | "approve" | "users" | "review" | "read",
) {
  const roles: Record<typeof capability, string[]> = {
    master: ["ADMIN", "WAREHOUSE"],
    stock: ["ADMIN", "WAREHOUSE"],
    approve: ["WAREHOUSE"],
    users: ["ADMIN"],
    review: ["WAREHOUSE", "AUDITOR"],
    read: ["ADMIN", "WAREHOUSE", "AUDITOR"],
  };
  if (!roles[capability].includes(actor.role))
    throw new Error("Anda tidak memiliki izin untuk tindakan ini.");
}
export function own(actor: Actor, owner: string) {
  if (actor.role === "TECHNICIAN" && actor.id !== owner)
    throw new Error("Data tidak ditemukan atau tidak dapat diakses.");
}
