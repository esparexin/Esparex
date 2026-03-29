"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Wallet, BadgeIndianRupee, AlertCircle } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { financeTabs } from "@/components/layout/adminModuleTabSets";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { fetchRevenueSummarySeries } from "@/lib/api/finance";
import type { FinanceStats } from "@/types/transaction";

export default function RevenuePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const series = await fetchRevenueSummarySeries();
        const todayKey = new Date().toISOString().slice(0, 10);
        const currentMonthKey = todayKey.slice(0, 7);

        const aggregated = series.reduce<FinanceStats>((acc, entry) => {
          acc.totalRevenue += entry.totalRevenue || 0;
          acc.totalSales += entry.totalTransactions || 0;

          if (entry.date === todayKey) {
            acc.todayRevenue += entry.totalRevenue || 0;
          }
          if (entry.date.startsWith(currentMonthKey)) {
            acc.thisMonthRevenue += entry.totalRevenue || 0;
          }

          return acc;
        }, {
          totalRevenue: 0,
          todayRevenue: 0,
          totalSales: 0,
          thisMonthRevenue: 0,
        });

        setStats(aggregated);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load revenue analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminPageShell
      title="Revenue Analytics"
      description="Track monetization performance across plans, invoices, and successful transactions."
      tabs={<AdminModuleTabs tabs={financeTabs} />}
    >
      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Total Revenue"
          value={loading ? "..." : `₹${stats?.totalRevenue.toLocaleString() || "0"}`}
          icon={BadgeIndianRupee}
          description="Successful captured payments"
        />
        <DashboardCard
          title="Today"
          value={loading ? "..." : `₹${stats?.todayRevenue.toLocaleString() || "0"}`}
          icon={TrendingUp}
          description="Revenue for the last 24 hours"
        />
        <DashboardCard
          title="This Month"
          value={loading ? "..." : `₹${stats?.thisMonthRevenue.toLocaleString() || "0"}`}
          icon={Wallet}
          description="Month-to-date recognized revenue"
        />
        <DashboardCard
          title="Total Sales"
          value={loading ? "..." : `${stats?.totalSales || 0}`}
          icon={BarChart3}
          description="Completed monetization transactions"
        />
      </div>
    </AdminPageShell>
  );
}
