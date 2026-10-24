import { NextRequest, NextResponse } from "next/server";
import { readyUser } from "@/server/policy";
import { db } from "@/server/db";
import { readInventoryQr } from "@/lib/qr";
export async function GET(request: NextRequest) {
  const actor = await readyUser();
  if (!actor) return NextResponse.redirect(new URL("/login", request.url));
  const parsed = readInventoryQr(request.nextUrl.searchParams.get("q") || "");
  const tech = actor.role === "TECHNICIAN";
  const base = tech ? "/me" : "/admin";
  let itemId: string | undefined;
  let assetId: string | undefined;
  if (parsed?.type === "ITEM") {
    const item = await db.item.findFirst({
      where: { id: parsed.id, ...(tech ? { active: true } : {}) },
      select: { id: true },
    });
    itemId = item?.id;
  } else if (parsed) {
    const asset = await db.asset.findFirst({
      where: {
        ...(parsed.type === "ASSET" ? { id: parsed.id } : { tag: parsed.id }),
        ...(tech ? { item: { active: true } } : {}),
      },
      select: { id: true, itemId: true },
    });
    itemId = asset?.itemId;
    assetId = asset?.id;
    if (!itemId && parsed.type === "LEGACY") {
      itemId = (
        await db.item.findFirst({
          where: {
            sku: { equals: parsed.id, mode: "insensitive" },
            ...(tech ? { active: true } : {}),
          },
          select: { id: true },
        })
      )?.id;
    }
  }
  const url = new URL(
    itemId ? `${base}/items/${itemId}` : `${base}/items`,
    request.url,
  );
  if (assetId) {
    url.searchParams.set("unit", assetId);
    url.hash = `unit-${assetId}`;
  }
  if (!itemId) url.searchParams.set("scan", "missing");
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
