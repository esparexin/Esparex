"use client";
import { mapErrorToMessage } from '@/lib/mapErrorToMessage';

import { useEffect, useState } from "react";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { adminFetch } from "@/lib/api/adminClient";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { TrendsChart, type TrendPoint } from "@/components/dashboard/TrendsChart";
import { Users, CheckCircle, Clock, TrendingUp, AlertCircle, Building2, DollarSign, Wrench, Package } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { fetchAdminAdSummary, fetchAdminServiceSummary, fetchAdminSparePartSummary } from "@/lib/api/moderation";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_UI_ROUTES } from "@/lib/adminUiRoutes";
import { fetchAuditLogs } from "@/lib/api/auditLogs";
import type { FinanceStats } from "@/types/transaction";
import type { AdminLog } from "@/types/audit";

interface CatalogHealthMetrics {
  pendingRequests: number;
  heldListings: number;
  averageResolutionHours: number;
  duplicateRequests: number;
}

type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  verifiedUsers: number;
};

type DashboardOverview = DashboardStats & {
  bannedUsers?: number;
};

type BusinessOverview = {
  pending?: number;
};

export default function DashboardPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
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
  const [catalogHealth, setCatalogHealth] = useState<CatalogHealthMetrics | null>(null);
  const [liveLogs, setLiveLogs] = useState<AdminLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [moderationSummary, serviceSummary, sparePartSummary, trendsResult, userOverview, reportPayload, businessOverviewPayload, financePayload, auditPayload, dashboardStatsPayload] = await Promise.all([
          fetchAdminAdSummary(),
          fetchAdminServiceSummary(),
          fetchAdminSparePartSummary(),
          adminFetch<TrendPoint[] | { items?: TrendPoint[] }>(ADMIN_ROUTES.ANALYTICS),
          adminFetch<DashboardOverview>(ADMIN_ROUTES.USER_OVERVIEW),
          adminFetch<Record<string, unknown>>(`${ADMIN_ROUTES.REPORTED_ADS}?${new URLSearchParams({ status: "open", page: "1", limit: "1" }).toString()}`),
          adminFetch<BusinessOverview>(ADMIN_ROUTES.BUSINESS_OVERVIEW),
          adminFetch<FinanceStats>(ADMIN_ROUTES.FINANCE_STATS),
          fetchAuditLogs({ q: "", action: "all", page: 1, limit: 5 }),
          adminFetch<Record<string, unknown>>(ADMIN_ROUTES.DASHBOARD_STATS),
        ]);

        const overviewData = parseAdminResponse<never, DashboardOverview>(userOverview).data || {} as DashboardOverview;
        const reportPagination = parseAdminResponse<Record<string, unknown>>(reportPayload).pagination;
        const businessOverview = parseAdminResponse<never, BusinessOverview>(businessOverviewPayload).data || {};
        const parsedTrends = parseAdminResponse<TrendPoint, TrendPoint[]>(trendsResult);
        const trendItems = parsedTrends.items.length > 0
          ? parsedTrends.items
          : Array.isArray(parsedTrends.data)
            ? parsedTrends.data
            : [];

        setStats({
          totalUsers: Number(overviewData.totalUsers || 0),
          activeUsers: Number(overviewData.activeUsers || 0),
          suspendedUsers: Number(overviewData.suspendedUsers || 0),
          verifiedUsers: Number(overviewData.verifiedUsers || 0),
        });
        setFinanceStats(parseAdminResponse<never, FinanceStats>(financePayload).data || null);
        setTrends(Array.isArray(trendItems) ? trendItems : []);
        setModerationCounts(moderationSummary);
        setPendingServices(serviceSummary.pending);
        setPendingSpareParts(sparePartSummary.pending);
        setReportCount(Number(reportPagination?.total || 0));
        setPendingBusinessCount(Number(businessOverview.pending || 0));
        setLiveLogs(auditPayload.items);
        
        const dashboardStats = parseAdminResponse<never, { catalogHealth?: CatalogHealthMetrics }>(dashboardStatsPayload).data;
        if (dashboardStats?.catalogHealth) {
          setCatalogHealth(dashboardStats.catalogHealth);
        }
      } catch (err) {
        const message = mapErrorToMessage(err, "Failed to load dashboard data");
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Pending Requests"
          value={catalogHealth?.pendingRequests ?? 0}
          icon={Clock}
          className="border-amber-100 bg-amber-50/5"
          description="Catalog suggestions awaiting review"
          href={ADMIN_UI_ROUTES.catalogRequests({ status: 'pending' })}
        />
        <DashboardCard
          title="Held Listings"
          value={catalogHealth?.heldListings ?? 0}
          icon={AlertCircle}
          className="border-orange-100 bg-orange-50/5"
          description="Listings blocked by catalog dependency"
          href={ADMIN_UI_ROUTES.ads({ catalogPending: 'true' })}
        />
        <DashboardCard
          title="Avg Resolution (hrs)"
          value={catalogHealth?.averageResolutionHours ?? 0}
          icon={TrendingUp}
          className="border-sky-100 bg-sky-50/5"
          description="Average turnaround for requests"
        />
        <DashboardCard
          title="Duplicates"
          value={catalogHealth?.duplicateRequests ?? 0}
          icon={AlertCircle}
          className="border-slate-100 bg-slate-50/5"
          description="Requests marked as duplicates"
          href={ADMIN_UI_ROUTES.catalogRequests({ status: 'duplicate' })}
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
              {liveLogs.length > 0 ? liveLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                    <Users size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {log.adminId && typeof log.adminId === 'object' 
                        ? `${log.adminId.firstName} ${log.adminId.lastName || ''}` 
                        : 'System'} • {log.targetType}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )) : (
                <p className="text-xs text-slate-400 italic">No recent activity detected.</p>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </AdminPageShell>
  );
}
