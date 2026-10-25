"use client";

import { useId } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  chartSku,
  requestShares,
  type RequestMember,
} from "@/lib/analytics-charts";

const blue = "#1763da";
const green = "#18704e";
const colors = [blue, "#147d92", "#6855b3", "#a36315", "#8794a8"];
const axis = { fill: "var(--text-muted)", fontSize: 12 };
const tooltip = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: 13,
  maxWidth: "min(280px, calc(100vw - 48px))",
  whiteSpace: "normal" as const,
  overflowWrap: "anywhere" as const,
  boxShadow: "0 8px 24px #142b481a",
};
const dateLabel = (day: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));

export function DemandChart({
  rows,
}: {
  rows: { day: string; requests: number; handovers: number }[];
}) {
  const gradient = useId();
  return (
    <>
      <div className="chart-legend">
        <span>
          <i aria-hidden />
          Permintaan · area
        </span>
        <span>
          <i className="issued" aria-hidden />
          Penyerahan · kolom
        </span>
      </div>
      <div className="analytics-chart analytics-demand" data-chart="demand">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 320, height: 280 }}
        >
          <ComposedChart
            data={rows}
            accessibilityLayer
            margin={{ top: 20, right: 8, left: -22, bottom: 4 }}
            aria-label="Tren permintaan dan penyerahan harian"
          >
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={blue} stopOpacity={0.25} />
                <stop offset="100%" stopColor={blue} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 5"
            />
            <XAxis
              dataKey="day"
              tickFormatter={dateLabel}
              tick={axis}
              tickLine={false}
              axisLine={false}
              minTickGap={35}
            />
            <YAxis
              allowDecimals={false}
              tick={axis}
              tickLine={false}
              axisLine={false}
              domain={[0, (max: number) => Math.max(2, max)]}
            />
            <Tooltip
              labelFormatter={(label) => dateLabel(String(label))}
              contentStyle={tooltip}
              isAnimationActive={false}
              cursor={{ stroke: "var(--border)" }}
            />
            <Area
              dataKey="requests"
              name="Permintaan"
              type="linear"
              stroke={blue}
              strokeWidth={2.5}
              fill={`url(#${gradient})`}
              isAnimationActive={false}
            />
            <Bar
              dataKey="handovers"
              name="Penyerahan"
              fill={green}
              maxBarSize={14}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="analytics-chart-hint">
        Sentuh grafik atau gunakan tombol panah saat grafik fokus untuk melihat
        rincian.
      </p>
    </>
  );
}

export function ItemDemandChart({
  rows,
}: {
  rows: { id: string; name: string; sku: string; requests: number }[];
}) {
  if (!rows.length) return null;
  return (
    <div
      className="analytics-chart analytics-items-chart"
      data-chart="items"
      style={{ height: Math.max(180, rows.length * 40 + 32) }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 320, height: 352 }}
      >
        <BarChart
          data={rows}
          layout="vertical"
          accessibilityLayer
          margin={{ top: 8, right: 24, bottom: 0, left: 0 }}
          aria-label="Peringkat frekuensi permintaan barang menurut SKU"
        >
          <CartesianGrid
            horizontal={false}
            stroke="var(--border)"
            strokeDasharray="3 5"
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={axis}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="sku"
            tickFormatter={chartSku}
            width={72}
            tick={axis}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            labelFormatter={(_, payload) =>
              payload[0]
                ? `${payload[0].payload.name} · ${payload[0].payload.sku}`
                : "Barang"
            }
            contentStyle={tooltip}
            isAnimationActive={false}
            cursor={{ fill: "var(--surface-muted)" }}
          />
          <Bar
            dataKey="requests"
            name="Permintaan"
            fill={blue}
            barSize={16}
            radius={[0, 5, 5, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MemberShareChart({
  rows,
  total,
}: {
  rows: RequestMember[];
  total: number;
}) {
  if (!total)
    return (
      <p className="analytics-empty">Belum ada permintaan pada periode ini.</p>
    );
  const shares = requestShares(rows, total).map((row, i) => ({
    ...row,
    fill: colors[i],
  }));
  return (
    <div className="analytics-share">
      <div className="analytics-donut" data-chart="members">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 260, height: 260 }}
        >
          <PieChart
            accessibilityLayer
            aria-label="Komposisi seluruh permintaan menurut anggota tim"
          >
            <Pie
              data={shares}
              dataKey="requests"
              nameKey="name"
              innerRadius={76}
              outerRadius={108}
              startAngle={90}
              endAngle={-270}
              stroke="var(--surface)"
              strokeWidth={3}
              isAnimationActive={false}
            />
            <Tooltip
              contentStyle={tooltip}
              isAnimationActive={false}
              formatter={(value) => [
                `${Number(value).toLocaleString("id-ID")} permintaan`,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="analytics-donut-total" aria-hidden>
          <strong>{total.toLocaleString("id-ID")}</strong>
          <span>permintaan</span>
        </div>
      </div>
      <ul
        className="analytics-share-legend"
        aria-label="Komposisi permintaan tim"
      >
        {shares.map((row) => (
          <li key={row.id}>
            <i style={{ background: row.fill }} aria-hidden />
            <span>{row.name}</span>
            <strong>
              {row.requests.toLocaleString("id-ID")}
              <small>
                {((row.requests / total) * 100).toLocaleString("id-ID", {
                  maximumFractionDigits: 1,
                })}
                %
              </small>
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
