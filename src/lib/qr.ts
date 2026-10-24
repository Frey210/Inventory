export function inventoryQr(type: "ITEM" | "ASSET", id: string) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id))
    throw new Error("Identitas QR tidak valid.");
  return `MTC:${type}:${id}`;
}
export function readInventoryQr(
  value: string,
): { type: "ITEM" | "ASSET" | "LEGACY"; id: string } | null {
  const text = value.trim();
  if (!text || text.length > 200 || /[\u0000-\u001f]/.test(text)) return null;
  if (text.startsWith("MTC:")) {
    const match = /^MTC:(ITEM|ASSET):([a-zA-Z0-9_-]{1,128})$/.exec(text);
    return match ? { type: match[1] as "ITEM" | "ASSET", id: match[2] } : null;
  }
  if (/^[a-z]+:|^\/\//i.test(text)) return null;
  return { type: "LEGACY", id: text };
}
