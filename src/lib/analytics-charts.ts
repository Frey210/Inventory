export type RequestMember = { id: string; name: string; requests: number };

export const chartSku = (sku: string) =>
  sku.length > 8 ? `${sku.slice(0, 7)}…` : sku;

// The query returns eight members; the remainder still belongs in the denominator.
export function requestShares(rows: RequestMember[], total: number) {
  const leaders = rows.slice(0, 4);
  const others = total - leaders.reduce((sum, row) => sum + row.requests, 0);
  return others > 0
    ? [
        ...leaders,
        { id: "other-members", name: "Anggota lainnya", requests: others },
      ]
    : leaders;
}
