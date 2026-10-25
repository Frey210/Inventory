"use client";

import dynamic from "next/dynamic";
import { LoaderCircle } from "lucide-react";

function ChartLoading() {
  return (
    <div
      className="analytics-chart analytics-chart-loading"
      role="status"
      aria-label="Memuat grafik"
    >
      <LoaderCircle className="loading-spinner" size={20} aria-hidden />
      <span>Memuat grafik...</span>
    </div>
  );
}

// A client boundary keeps Recharts out of the catch-all route's shared bundle.
export const DemandChart = dynamic(
  () => import("./analytics-chart-plots").then((m) => m.DemandChart),
  { loading: ChartLoading },
);
export const ItemDemandChart = dynamic(
  () => import("./analytics-chart-plots").then((m) => m.ItemDemandChart),
  { loading: ChartLoading },
);
export const MemberShareChart = dynamic(
  () => import("./analytics-chart-plots").then((m) => m.MemberShareChart),
  { loading: ChartLoading },
);
