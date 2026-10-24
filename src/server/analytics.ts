import "server-only";
import { db, Prisma } from "./db";
import { permit, type Actor } from "./capabilities";
import { analyticsPeriod } from "./analytics-period";
export async function getAnalytics(
  actor: Actor,
  value: string | undefined,
  timezone: string,
) {
  permit(actor, "read");
  const period = analyticsPeriod(value, timezone);
  const { from, to } = period;
  const demand = Prisma.sql`d.kind='request' AND d.status NOT IN ('cancelled','rejected','superseded') AND d."createdAt">=${from} AND d."createdAt"<${to}`;
  return db.$transaction(
    async (tx) => {
      const [counts, daily, items, users, procurement] = await Promise.all([
        tx.$queryRaw<
          {
            requests: number;
            users: number;
            handovers: number;
            units: number;
          }[]
        >(Prisma.sql`
        SELECT (SELECT count(*)::int FROM "Document" d WHERE ${demand}) requests,
          (SELECT count(DISTINCT d."actorId")::int FROM "Document" d WHERE ${demand}) users,
          (SELECT count(*)::int FROM "Document" WHERE kind='request' AND status='fulfilled' AND "postedAt">=${from} AND "postedAt"<${to}) handovers,
          (SELECT count(*)::int FROM "LoanLine" l JOIN "Loan" n ON n.id=l."loanId" WHERE n."createdAt">=${from} AND n."createdAt"<${to}) units`),
        tx.$queryRaw<
          { day: string; requests: number; handovers: number }[]
        >(Prisma.sql`
        WITH events AS (
          SELECT ((d."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timezone})::date::text AS "day",1 requests,0 handovers FROM "Document" d WHERE ${demand}
          UNION ALL
          SELECT (("postedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timezone})::date::text,0,1 FROM "Document"
          WHERE kind='request' AND status='fulfilled' AND "postedAt">=${from} AND "postedAt"<${to}
        ) SELECT "day",sum(requests)::int requests,sum(handovers)::int handovers FROM events GROUP BY "day" ORDER BY "day"`),
        tx.$queryRaw<
          { id: string; name: string; sku: string; requests: number }[]
        >(Prisma.sql`
        SELECT i.id,i.name,i.sku,count(DISTINCT d.id)::int requests
        FROM "Document" d JOIN "Line" l ON l."documentId"=d.id JOIN "Item" i ON i.id=l."itemId"
        WHERE ${demand} GROUP BY i.id ORDER BY requests DESC,i.sku LIMIT 8`),
        tx.$queryRaw<
          { id: string; name: string; requests: number }[]
        >(Prisma.sql`
        SELECT u.id,u.name,count(*)::int requests FROM "Document" d JOIN "User" u ON u.id=d."actorId"
        WHERE ${demand} GROUP BY u.id ORDER BY requests DESC,u.name,u.id LIMIT 8`),
        tx.$queryRaw<
          {
            id: string;
            sku: string;
            name: string;
            unit: string;
            available: Prisma.Decimal;
            minimum: Prisma.Decimal;
            issued: Prisma.Decimal;
            returned: Prisma.Decimal;
            transactions: number;
            total: number;
          }[]
        >(Prisma.sql`
        WITH movement AS (
          SELECT "itemId",sum(CASE WHEN action='ISSUE' THEN -quantity ELSE 0 END) issued,
            sum(CASE WHEN action='CONSUMABLE_RETURN' THEN quantity ELSE 0 END) returned,
            count(DISTINCT CASE WHEN action='ISSUE' THEN "referenceId" END)::int transactions
          FROM "Ledger" WHERE action IN ('ISSUE','CONSUMABLE_RETURN') AND "createdAt">=${from} AND "createdAt"<${to} GROUP BY "itemId"
        ), stock AS (
          SELECT "itemId",sum("onHand"-reserved) available FROM "Balance" GROUP BY "itemId"
        ), candidates AS (
          SELECT i.id,i.sku,i.name,u.name unit,coalesce(s.available,0) available,i."minStock" minimum,
            coalesce(m.issued,0) issued,coalesce(m.returned,0) returned,coalesce(m.transactions,0) transactions
          FROM "Item" i JOIN "Master" u ON u.id=i."unitId" LEFT JOIN stock s ON s."itemId"=i.id LEFT JOIN movement m ON m."itemId"=i.id
          WHERE i.active AND i.tracking='quantity'
        ) SELECT *,count(*) OVER()::int total FROM candidates WHERE available<=minimum OR transactions>0
          ORDER BY (available<=minimum) DESC,transactions DESC,sku LIMIT 12`),
      ]);
      const byDay = new Map(daily.map((row) => [row.day, row]));
      return {
        period,
        counts: counts[0],
        trend: period.dates.map(
          (day) => byDay.get(day) || { day, requests: 0, handovers: 0 },
        ),
        items,
        users,
        procurement,
      };
    },
    { isolationLevel: "RepeatableRead", timeout: 20000 },
  );
}
