"use client";
import { mapErrorToMessage } from '@/lib/mapErrorToMessage';

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { adminFetch } from "@/lib/api/adminClient";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { TrendPoint } from "@/components/dashboard/TrendsChart";
import { Users, CheckCircle, Clock, TrendingUp, AlertCircle, Building2, DollarSign, Wrench, Package } from "@esparex/ui";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_UI_ROUTES } from "@/lib/adminUiRoutes";
import { fetchAuditLogs } from "@/lib/api/auditLogs";
import type { FinanceStats } from "@/types/transaction";
import type { AdminLog } from "@/types/audit";

import type { AdminDashboardStatsDTO, CatalogHealthMetricsDTO } from "@esparex/contracts";

const TrendsChart = dynamic(() => import("@/components/dashboard/TrendsChart").then((m) => m.TrendsChart), {
  ssr: false,
  loading: () => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px] flex items-center justify-center">
      <span className="text-xs font-semibold text-foreground-subtle uppercase tracking-widest animate-pulse">Loading Chart...</span>
    </div>
  ),
});

export default function DashboardPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState<{ totalUsers: number; activeUsers: number; suspendedUsers: number; verifiedUsers: number } | null>(null);
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
  const [catalogHealth, setCatalogHealth] = useState<CatalogHealthMetricsDTO | null>(null);
  const [liveLogs, setLiveLogs] = useState<AdminLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const safeSettle = async <T,>(
      fetch: () => Promise<T>,
      onSuccess: (data: T) => void,
      label: string
    ): Promise<void> => {
      if (controller.signal.aborted) return;
      try {
        const data = await fetch();
        if (!controller.signal.aborted) onSuccess(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          const message = mapErrorToMessage(err, `Failed to load ${label}`);
          setError(message);
        }
      }
    };

    // Panel Group 1: Unified System Overview Stats & Catalog Health
    void safeSettle(
      () => adminFetch<AdminDashboardStatsDTO>(ADMIN_ROUTES.STATS),
      (statsPayload) => {
        const statsData = parseAdminResponse<never, AdminDashboardStatsDTO>(statsPayload).data || ({} as AdminDashboardStatsDTO);
        setStats({
          totalUsers: Number(statsData.totalUsers || 0),
          activeUsers: Number(statsData.activeAds || 0),
          suspendedUsers: Number(statsData.pendingAds || 0),
          verifiedUsers: Number(statsData.activeServices || 0),
        });
        setModerationCounts({
          total: Number(statsData.totalAds || 0),
          pending: Number(statsData.pendingAds || 0),
          live: Number(statsData.activeAds || 0),
          rejected: 0,
          expired: 0
        });
        setPendingServices(Number(statsData.pendingServices || 0));
        setPendingSpareParts(Number(statsData.pendingSpareParts || 0));
        if (statsData.notifications) {
          setReportCount(Number(statsData.notifications.reportedAds || 0));
          setPendingBusinessCount(Number(statsData.notifications.pendingBusinesses || 0));
        }
        if (statsData.catalogHealth) {
          setCatalogHealth(statsData.catalogHealth);
        }
      },
      "system overview stats"
    );

    // Panel Group 2: Finance & trends
    void safeSettle(
      () => Promise.all([
        adminFetch<FinanceStats>(ADMIN_ROUTES.FINANCE_STATS),
        adminFetch<TrendPoint[] | { items?: TrendPoint[] }>(ADMIN_ROUTES.ANALYTICS),
      ]),
      ([financePayload, trendsResult]) => {
        setFinanceStats(parseAdminResponse<never, FinanceStats>(financePayload).data || null);
        const parsedTrends = parseAdminResponse<TrendPoint, TrendPoint[]>(trendsResult);
        const trendItems = parsedTrends.items.length > 0
          ? parsedTrends.items
          : Array.isArray(parsedTrends.data) ? parsedTrends.data : [];
        setTrends(Array.isArray(trendItems) ? trendItems : []);
      },
      "finance data"
    );

    // Panel Group 3: Live audit logs
    void safeSettle(
      () => fetchAuditLogs({ q: "", action: "all", page: 1, limit: 5 }),
      (auditPayload) => setLiveLogs(auditPayload.items),
      "audit logs"
    );

    return () => { controller.abort(); };
  }, []);

  const calculateGrowth = () => {
    if (trends.length < 2) return null;
    const latest = trends[trends.length - 1]?.amt ?? trends[trends.length - 1]?.ads ?? 0;
    const previous = trends[trends.length - 2]?.amt ?? trends[trends.length - 2]?.ads ?? 0;
    if (previous === 0) return latest > 0 ? 100 : 0;
    const rate = ((latest - previous) / previous) * 100;
    return Number.isFinite(rate) ? rate : 0;
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
      className="h-full overflow-y-auto px-4 lg:px-6 py-4"
    >
      <div className="flex flex-col gap-5">
        {/* Section 1: Operational Queues */}
        <section className="flex flex-col gap-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">Operational Queues</h2>
            <p className="text-tiny text-foreground-tertiary">Action required across moderation & approval queues</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl">
            <DashboardCard
              title="Pending Ads"
              value={moderationCounts.pending}
              icon={Clock}
              variant="warning"
              href={ADMIN_UI_ROUTES.ads({ status: "pending" })}
            />
            <DashboardCard
              title="Reported Ads"
              value={reportCount}
              icon={AlertCircle}
              variant="danger"
              href={ADMIN_UI_ROUTES.reports({ status: "open" })}
            />
            <DashboardCard
              title="Pending Businesses"
              value={pendingBusinessCount}
              icon={Building2}
              variant="warning"
              href={ADMIN_UI_ROUTES.businesses({ status: "pending" })}
            />
            <DashboardCard
              title="Pending Services"
              value={pendingServices}
              icon={Wrench}
              variant="warning"
              href={ADMIN_UI_ROUTES.services({ status: "pending" })}
            />
            <DashboardCard
              title="Pending Spare Parts"
              value={pendingSpareParts}
              icon={Package}
              variant="warning"
              href={ADMIN_UI_ROUTES.spareParts({ status: "pending" })}
            />
            <DashboardCard
              title="Catalog Requests"
              value={catalogHealth?.pendingRequests ?? 0}
              icon={Clock}
              variant="info"
              description="Awaiting review"
              href={ADMIN_UI_ROUTES.catalogRequests({ status: 'pending' })}
            />
          </div>
        </section>

        {/* Section 2: Directory & Platform Overview */}
        <section className="flex flex-col gap-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">Directory & Users</h2>
            <p className="text-tiny text-foreground-tertiary">Platform account status and active inventory</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl">
            <DashboardCard
              title="Live Ads"
              value={moderationCounts.live}
              icon={CheckCircle}
              variant="success"
              href={ADMIN_UI_ROUTES.ads({ status: "live" })}
            />
            <DashboardCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon={Users}
              variant="info"
              href={ADMIN_UI_ROUTES.users()}
            />
            <DashboardCard
              title="Suspended Users"
              value={stats?.suspendedUsers || 0}
              icon={AlertCircle}
              variant="warning"
              href={ADMIN_UI_ROUTES.users({ status: "suspended" })}
            />
            <DashboardCard
              title="Avg Turnaround"
              value={`${catalogHealth?.averageResolutionHours ?? 0} hrs`}
              icon={TrendingUp}
              variant="info"
              description="Resolution speed"
            />
          </div>
        </section>

        {/* Section 3: Revenue, Trends & Live Activity */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Financials & Activity</h2>
            <p className="text-tiny text-foreground-tertiary">Revenue growth signals and real-time audit log</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
                <DashboardCard
                  title="Total Revenue"
                  value={`₹${(financeStats?.totalRevenue || 0).toLocaleString()}`}
                  icon={DollarSign}
                  variant="success"
                  href={ADMIN_UI_ROUTES.finance()}
                />
                <DashboardCard
                  title="Merged Requests"
                  value={catalogHealth?.mergedRequests ?? 0}
                  icon={CheckCircle}
                  variant="success"
                  description="Successfully merged"
                  href={ADMIN_UI_ROUTES.catalogRequests({ status: 'merged' })}
                />
              </div>
              <TrendsChart data={trends} title="Growth Trends" />
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-3">Live Activity</h3>
              {error ? (
                <p className="text-red-500 text-xs italic">{error}</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {liveLogs.length > 0 ? liveLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2.5 pb-2.5 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-foreground-subtle shrink-0">
                        <Users size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-tiny text-foreground-subtle font-medium truncate">
                          {log.adminId && typeof log.adminId === 'object' 
                            ? `${log.adminId.firstName} ${log.adminId.lastName || ''}` 
                            : 'System'} • {log.targetType}
                        </p>
                      </div>
                      <span className="text-tiny font-bold text-foreground-subtle uppercase tracking-tighter shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )) : (
                    <p className="text-xs text-foreground-subtle italic">No recent activity detected.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
