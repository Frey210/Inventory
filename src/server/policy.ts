import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";
export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  return user?.isActive ? user : null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
export async function readyUser() {
  const user = await currentUser();
  if (
    !user ||
    user.mustChangePassword ||
    (process.env.APP_MODE === "live" &&
      ["ADMIN", "WAREHOUSE", "AUDITOR"].includes(user.role) &&
      !user.twoFactorEnabled)
  )
    return null;
  return user;
}

export { permit, own, type Actor } from "./capabilities";
