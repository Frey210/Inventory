import { businessDate } from "./business-date";
export function analyticsPeriod(
  value: string | undefined,
  timezone: string,
  now = new Date(),
) {
  const days = value === "90" ? 90 : value === "180" ? 180 : 30;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const anchor = Date.parse(today + "T00:00:00Z");
  const dates = Array.from({ length: days }, (_, index) =>
    new Date(anchor - (days - index - 1) * 86400000).toISOString().slice(0, 10),
  );
  return {
    days,
    dates,
    from: businessDate(dates[0], timezone),
    to: new Date(businessDate(today, timezone, true).getTime() + 1),
  };
}
