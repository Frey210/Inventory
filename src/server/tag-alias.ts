import { createHash } from "node:crypto";
export const tagAliasId = (tag: string) =>
  "asset-tag-alias:" + createHash("sha256").update(tag).digest("hex");
