"use client";

import { useEffect, useState } from "react";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { adminFetch } from "@/lib/api/adminClient";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { TrendsChart } from "@/components/dashboard/TrendsChart";
import { Users, CheckCircle, Clock, TrendingUp, AlertCircle, Building2, DollarSign, Wrench, Package } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { fetchAdminAdSummary, fetchAdminServiceSummary, fetchAdminSparePartSummary } from "@/lib/api/moderation";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_UI_ROUTES } from "@/lib/adminUiRoutes";
import type { FinanceStats } from "@/types/transaction";

type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  verifiedUsers: number;
};

export default function DashboardPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [moderationCounts, setModerationCounts] = useState({
    total: 0,
    pending: 0,
    live: 0,
    rejected: 0,
    expired: 0
  });
  const [pendingServices, setPendingServices] = useState(0);
  const [pendingSpareParts, setPendingSpareParts] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [pendingBusinessCount, setPendingBusinessCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [moderationSummary, serviceSummary, sparePartSummary, trendsResult, userOverview, reportPayload, businessOverviewPayload, financePayload] = await Promise.all([
          fetchAdminAdSummary(),
          fetchAdminServiceSummary(),
          fetchAdminSparePartSummary(),
          adminFetch<any>(ADMIN_ROUTES.ANALYTICS),
          adminFetch<any>(ADMIN_ROUTES.USER_OVERVIEW),
          adminFetch<any>(`${ADMIN_ROUTES.REPORTED_ADS}?${new URLSearchParams({ status: "open", page: "1", limit: "1" }).toString()}`),
          adminFetch<any>(ADMIN_ROUTES.BUSINESS_OVERVIEW),
          adminFetch<any>(ADMIN_ROUTES.FINANCE_STATS),
        ]);

        const overviewData = parseAdminResponse<never, any>(userOverview).data || {};
        const reportPagination = parseAdminResponse<Record<string, unknown>>(reportPayload).pagination;
        const businessOverview = parseAdminResponse<never, Record<string, unknown>>(businessOverviewPayload).data || {};

        setStats({
          totalUsers: Number(overviewData.totalUsers || 0),
          activeUsers: Number(overviewData.activeUsers || 0),
          suspendedUsers: Number(overviewData.suspendedUsers || 0),
          verifiedUsers: Number(overviewData.verifiedUsers || 0),
        });
        setFinanceStats((parseAdminResponse<never, FinanceStats>(financePayload).data || null) as FinanceStats | null);
        setTrends(parseAdminResponse<any>(trendsResult).items || parseAdminResponse<any, any>(trendsResult).data || []);
        setModerationCounts(moderationSummary);
        setPendingServices(serviceSummary.pending);
        setPendingSpareParts(sparePartSummary.pending);
        setReportCount(Number(reportPagination?.total || 0));
        setPendingBusinessCount(Number(businessOverview.pending || 0));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(message);
      }
    };

    void load();
  }, []);

  const calculateGrowth = () => {
    if (trends.length < 2) return null;
    const latest = trends[trends.length - 1]?.amt || 0;
    const previous = trends[trends.length - 2]?.amt || 0;
    if (previous === 0) return latest > 0 ? 100 : 0;
    return ((latest - previous) / previous) * 100;
  };

  const growth = calculateGrowth();

  return (
    <AdminPageShell
      title="System Overview"
      description={`Welcome back, ${admin?.firstName || "Admin"}. Live performance data is synced.`}
      tabs={<AdminModuleTabs tabs={[{ label: "Dashboard", href: ADMIN_UI_ROUTES.dashboard() }, { label: "Analytics", href: ADMIN_UI_ROUTES.finance() }, { label: "Ads", href: ADMIN_UI_ROUTES.ads({ status: "pending" }) }]} />}
      actions={
        growth !== null ? (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-sm ${growth >= 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-700 border-red-100"
            }`}>
            <TrendingUp size={16} className={growth < 0 ? "rotate-180" : ""} />
            <span>{growth >= 0 ? "+" : ""}{growth.toFixed(1)}% Revenue {growth >= 0 ? "growth" : "decline"}</span>
          </div>
        ) : null
      }
      className="h-full overflow-y-auto pr-1"
    >
      <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-6">
        <DashboardCard
          title="Pending Ads"
          value={moderationCounts.pending}
          icon={Clock}
          className="border-amber-100 bg-amber-50/5"
          href={ADMIN_UI_ROUTES.ads({ status: "pending" })}
        />
        <DashboardCard
          title="Live Ads"
          value={moderationCounts.live}
          icon={CheckCircle}
          className="border-emerald-100 bg-emerald-50/5"
          href={ADMIN_UI_ROUTES.ads({ status: "live" })}
        />
        <DashboardCard
          title="Reported Ads"
          value={reportCount}
          icon={AlertCircle}
          className="border-red-100 bg-red-50/5"
          href={ADMIN_UI_ROUTES.reports({ status: "open" })}
        />
        <DashboardCard
          title="Pending Businesses"
          value={pendingBusinessCount}
          icon={Building2}
          className="border-violet-100 bg-violet-50/5"
          href={ADMIN_UI_ROUTES.businesses({ status: "pending" })}
        />
        <DashboardCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          href={ADMIN_UI_ROUTES.users()}
        />
        <DashboardCard
          title="Suspended Users"
          value={stats?.suspendedUsers || 0}
          icon={AlertCircle}
          className="border-amber-100 bg-amber-50/5"
          href={ADMIN_UI_ROUTES.users({ status: "suspended" })}
        />
        <DashboardCard
          title="Total Revenue"
          value={`₹${(financeStats?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          className="border-sky-100 bg-sky-50/5"
          href={ADMIN_UI_ROUTES.finance()}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Pending Services"
          value={pendingServices}
          icon={Wrench}
          className="border-indigo-100 bg-indigo-50/5"
          href={ADMIN_UI_ROUTES.services({ status: "pending" })}
        />
        <DashboardCard
          title="Pending Spare Parts"
          value={pendingSpareParts}
          icon={Package}
          className="border-teal-100 bg-teal-50/5"
          href={ADMIN_UI_ROUTES.spareParts({ status: "pending" })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendsChart data={trends} title="Growth Trends" />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Live Activity</h2>
          {error ? (
            <p className="text-red-500 text-sm italic">{error}</p>
          ) : (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                    <Users size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">New User Signup</p>
                    <p className="text-[10px] text-slate-400 font-medium">john_doe_{i}@example.com</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">5m ago</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </AdminPageShell>
  );
}
