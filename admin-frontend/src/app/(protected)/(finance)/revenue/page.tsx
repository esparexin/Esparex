"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Wallet, BadgeIndianRupee, AlertCircle } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { financeTabs } from "@/components/layout/adminModuleTabSets";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";

type RevenueStats = {
  totalRevenue: number;
  todayRevenue: number;
  totalSales: number;
  thisMonthRevenue: number;
};

export default function RevenuePage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const response = await adminFetch<{ totalRevenue: number; todayRevenue: number; totalSales: number; thisMonthRevenue: number }>(
          ADMIN_ROUTES.FINANCE_STATS
        );
        const parsed = parseAdminResponse<never, RevenueStats>(response);
        setStats(parsed.data ?? null);
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
