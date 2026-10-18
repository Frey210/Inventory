import { db } from "@/server/db";
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      mode: process.env.APP_MODE || "preparation",
    });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
