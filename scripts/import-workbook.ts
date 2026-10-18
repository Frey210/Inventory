import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { planWorkbook } from "../src/server/workbook-import";
import {
  applyWorkbook,
  postWorkbookQuantities,
} from "../src/server/workbook-apply";
import { db } from "../src/server/db";

try {
  const [file, mode, actorId] = process.argv.slice(2);
  if (
    !file ||
    (mode && !["--apply", "--post-quantities"].includes(mode)) ||
    (mode && !actorId)
  )
    throw Error(
      "Usage: tsx scripts/import-workbook.ts <private.xlsx> [--apply|--post-quantities <admin-id>]",
    );
  const plan = await planWorkbook(await readFile(file));
  await mkdir(".local", { recursive: true });
  await writeFile(
    `.local/workbook-${plan.hash.slice(0, 16)}.json`,
    JSON.stringify(plan, null, 2),
    { mode: 0o600 },
  );
  if (mode) {
    const actor = await db.user.findUniqueOrThrow({ where: { id: actorId } });
    if (!actor.isActive) throw Error("Akun pelaksana tidak aktif.");
    const reconciliation = process.env.INVENTORY_OPENING_RECONCILIATION?.trim();
    if (
      mode === "--post-quantities" &&
      (!reconciliation ||
        reconciliation.length < 15 ||
        reconciliation.length > 500)
    )
      throw Error(
        "INVENTORY_OPENING_RECONCILIATION harus berisi bukti konfirmasi hitung fisik sebelum posting.",
      );
    const result = await applyWorkbook(plan, actor);
    const posted =
      mode === "--post-quantities"
        ? await postWorkbookQuantities(plan, actor, reconciliation!)
        : 0;
    console.log(
      JSON.stringify({
        ...result,
        stockPosted: mode === "--post-quantities",
        posted,
      }),
    );
  } else
    console.log(
      JSON.stringify({
        mode: "dry-run",
        sourceRows: plan.sourceRows,
        accepted: plan.items.length,
        held: plan.held,
        serializedUnitsInSource: plan.items.reduce(
          (n, i) => n + i.units.length,
          0,
        ),
        hash: plan.hash,
      }),
    );
} finally {
  await db.$disconnect();
}
