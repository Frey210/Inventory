import { cache } from "react";
import { db } from "./db";
export const getSettings = cache(async () => {
  const row = await db.record.findFirst({
    where: { kind: "settings" },
    orderBy: { createdAt: "desc" },
  });
  return {
    timezone: "Asia/Makassar",
    pickupHours: 24,
    formCode: "",
    formRevision: "",
    ...((row?.payload as Record<string, unknown>) || {}),
  };
});
