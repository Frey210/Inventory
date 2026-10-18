import { db } from "./db";
export async function reminders() {
  const now = new Date();
  const settings = await db.record.findFirst({
    where: { kind: "settings" },
    orderBy: { createdAt: "desc" },
  });
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: String(
      (settings?.payload as { timezone?: string })?.timezone || "Asia/Makassar",
    ),
  }).format(now);
  const warehouse = await db.user.findMany({
    where: { role: "WAREHOUSE", isActive: true },
    select: { id: true },
  });
  const loans = await db.loan.findMany({
    where: { status: "active" },
    include: { lines: true },
  });
  for (const loan of loans) {
    if (!loan.lines.some((l) => !l.receivedAt)) continue;
    const days = (loan.dueAt.getTime() - now.getTime()) / 86400000;
    if (days > 2) continue;
    const label =
      days < 0
        ? "melewati jatuh tempo"
        : `jatuh tempo dalam ${Math.max(1, Math.ceil(days))} hari`;
    for (const recipientId of [
      loan.borrowerId,
      ...warehouse.map((w) => w.id),
    ]) {
      const eventKey = `loan:${loan.id}:${days < 0 ? "overdue:" + day : "H" + Math.ceil(days)}:${recipientId}`;
      await db.notification.upsert({
        where: { eventKey },
        create: {
          recipientId,
          eventKey,
          message: `${loan.number} ${label}.`,
          path:
            recipientId === loan.borrowerId
              ? `/me/loans/${loan.id}`
              : `/admin/loans/${loan.id}`,
        },
        update: {},
      });
    }
  }
  const assets = await db.asset.findMany({
    where: {
      calibrationRequired: true,
      OR: [
        { validUntil: null },
        { validUntil: { lte: new Date(now.getTime() + 30 * 86400000) } },
      ],
    },
  });
  for (const a of assets)
    for (const w of warehouse) {
      const days = a.validUntil
        ? Math.ceil((a.validUntil.getTime() - now.getTime()) / 86400000)
        : -1;
      const phase =
        days < 0
          ? "overdue:" + day
          : days <= 7
            ? "H7"
            : days <= 14
              ? "H14"
              : "H30";
      const eventKey = `calibration:${a.id}:${a.validUntil?.toISOString() || "unknown"}:${phase}:${w.id}`;
      await db.notification.upsert({
        where: { eventKey },
        create: {
          recipientId: w.id,
          eventKey,
          message: `Periksa masa kalibrasi ${a.tag}.`,
          path: `/admin/assets/${a.id}`,
        },
        update: {},
      });
    }
  const balances = await db.balance.findMany({ select: { id: true } });
  for (const balance of balances) await stockReminder(balance.id, warehouse);
}
export async function stockReminder(
  balanceId: string,
  warehouse: { id: string }[],
) {
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(178602, 1)`;
    const current = await tx.balance.findUniqueOrThrow({
      where: { id: balanceId },
      include: { item: true },
    });
    const below = current.onHand
      .sub(current.reserved)
      .lte(current.item.minStock);
    const state = await tx.counter.upsert({
      where: { key: `low-stock:${balanceId}` },
      create: { key: `low-stock:${balanceId}`, value: 0 },
      update: {},
    });
    if (below === (state.value % 2 === 1)) return;
    const revision = state.value + 1;
    await tx.counter.update({
      where: { key: state.key },
      data: { value: revision },
    });
    if (!below) return;
    for (const w of warehouse) {
      const eventKey = `stock:${balanceId}:${revision}:${w.id}`;
      await tx.notification.upsert({
        where: { eventKey },
        create: {
          recipientId: w.id,
          eventKey,
          message: `Stok tersedia ${current.item.name} mencapai minimum.`,
          path: `/admin/items/${current.itemId}`,
        },
        update: {},
      });
    }
  });
}
