export function businessDate(
  value: string,
  timezone: string,
  endOfDay = false,
) {
  const offset = timezone === "Asia/Jakarta" ? "+07:00" : "+08:00";
  const local = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?$/.test(value);
  const date = new Date(
    local
      ? value +
          (value.length === 10
            ? endOfDay
              ? "T23:59:59.999"
              : "T00:00:00"
            : ":00") +
          offset
      : value,
  );
  if (!Number.isFinite(date.getTime())) throw new Error("Tanggal tidak valid.");
  if (local) {
    const actual = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    if (actual !== value.slice(0, 10))
      throw new Error("Tanggal kalender tidak valid.");
  } else if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value))
    throw new Error("Tanggal harus menyertakan timezone.");
  return date;
}
export function loanReminder(
  dueAt: Date,
  now: Date,
  timezone: string,
  dateOnly: boolean,
) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = day.format(now);
  const days = dateOnly
    ? Math.round((Date.parse(day.format(dueAt)) - Date.parse(today)) / 86400000)
    : Math.ceil((dueAt.getTime() - now.getTime()) / 86400000);
  if (days > 2) return null;
  const overdue = dueAt < now;
  return {
    phase: overdue ? `overdue:${today}` : `H${days}`,
    label: overdue
      ? "melewati jatuh tempo"
      : days === 0
        ? "jatuh tempo hari ini"
        : `jatuh tempo dalam ${days} hari`,
  };
}
