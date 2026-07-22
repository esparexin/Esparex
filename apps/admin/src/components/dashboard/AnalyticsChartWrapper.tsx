"use client";

import dynamic from "next/dynamic";
import type { TrendPoint } from "./TrendsChart";

const LazyTrendsChart = dynamic(
    () => import("./TrendsChart").then((mod) => mod.TrendsChart),
    {
        ssr: false,
        loading: () => (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px] flex items-center justify-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">
                    Loading Analytics Chart...
                </span>
            </div>
        ),
    }
);

export function AnalyticsChartWrapper({ data, title }: { data: TrendPoint[]; title: string }) {
    return <LazyTrendsChart data={data} title={title} />;
}
