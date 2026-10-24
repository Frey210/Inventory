import { db } from "./db";
import { loanReminder } from "./business-date";
export async function reminders() {
  const now = new Date();
  const settings = await db.record.findFirst({
    where: { kind: "settings" },
    orderBy: { createdAt: "desc" },
  });
  const timezone = String(
    (settings?.payload as { timezone?: string })?.timezone || "Asia/Makassar",
  );
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
  }).format(now);
  const warehouse = await db.user.findMany({
    where: { role: "WAREHOUSE", isActive: true },
    select: { id: true },
  });
  await loanReminders(now, timezone, warehouse);
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

export async function loanReminders(
  now: Date,
  timezone: string,
  warehouse: { id: string }[],
) {
  const loans = await db.loan.findMany({
    where: { status: "active" },
    include: { lines: true },
  });
  for (const loan of loans) {
    if (!loan.lines.some((l) => !l.receivedAt)) continue;
    const reminder = loanReminder(loan.dueAt, now, timezone, loan.dueDateOnly);
    if (!reminder) continue;
    for (const recipientId of [
      loan.borrowerId,
      ...warehouse.map((w) => w.id),
    ]) {
      const eventKey = `loan:${loan.id}:${reminder.phase}:${recipientId}`;
      await db.notification.upsert({
        where: { eventKey },
        create: {
          recipientId,
          eventKey,
          message: `${loan.number} ${reminder.label}.`,
          path:
            recipientId === loan.borrowerId
              ? `/me/loans/${loan.id}`
              : `/admin/loans/${loan.id}`,
        },
        update: {},
      });
    }
  }
}
