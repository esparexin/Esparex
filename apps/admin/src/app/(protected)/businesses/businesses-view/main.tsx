"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChartBar, CheckCircle2, XCircle, PowerOff, History, CalendarClock } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { BusinessSuspendModal } from "@/components/business/BusinessSuspendModal";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { useAdminBusinessList } from "@/hooks/useAdminBusinessList";
import type { Business } from "@esparex/shared";
import { buildUrlWithSearchParams, normalizeSearchParamValue, parsePositiveIntParam, updateSearchParams } from "@/lib/urlSearchParams";
import { BusinessListModals, buildBusinessModalController, BusinessListTable, BusinessSearchToolbar } from "@/components/business/BusinessListPrimitives";
import { buildColumns } from "./columns";

const DEFAULT_STATUS = "live";
const BUSINESS_MASTER_STATUSES = new Set(["live", "suspended", "pending", "deleted", "all"]);

const mapOverview = (data: Record<string, unknown>) => ({ total: Number(data.total || 0), pending: Number(data.pending || 0), live: Number(data.live || data.approved || 0), suspended: Number(data.suspended || 0), deleted: Number(data.deleted || 0) });

export default function BusinessesView() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [suspendTarget, setSuspendTarget] = useState<Business | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkRejectReason, setBulkRejectReason] = useState(false);
    const rawStatus = searchParams.get("status");
    const rawSearch = searchParams.get("q") ?? searchParams.get("search");
    const rawLocationId = searchParams.get("locationId");
    const rawExpiringIn3Days = searchParams.get("expiringIn3Days");
    const rawWarningSent = searchParams.get("warningSent");
    const rawWarningNotSent = searchParams.get("warningNotSent");
    const rawPage = searchParams.get("page");
    const activeTab = rawStatus === "approved" || rawStatus === "active" ? DEFAULT_STATUS : rawStatus && BUSINESS_MASTER_STATUSES.has(rawStatus) ? rawStatus : DEFAULT_STATUS;
    const search = normalizeSearchParamValue(rawSearch);
    const locationIdFilter = normalizeSearchParamValue(rawLocationId);
    const page = parsePositiveIntParam(rawPage, 1);

    const replaceQueryState = useCallback((updates: Record<string, string | number | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        if (nextUrl !== buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()))) router.replace(nextUrl, { scroll: false });
    }, [pathname, router, searchParams]);

    const businessList = useAdminBusinessList({
        activeTab, search, page, initialOverview: { total: 0, pending: 0, live: 0, suspended: 0, deleted: 0 },
        mapOverview,
        extraQueryParams: { locationId: locationIdFilter, expiringIn3Days: rawExpiringIn3Days || undefined, warningSent: rawWarningSent || undefined, warningNotSent: rawWarningNotSent || undefined, includeDeleted: activeTab === "deleted" || activeTab === "all" ? "true" : undefined },
    });

    const { businesses, loading, error, pagination, overview, handleSuspend, handleActivate, handleBulkApprove, handleBulkReject, handleBulkDeactivate, handleBulkExpire, handleBulkRenew, handleBulkResendWarnings } = businessList;
    const toggleSelectAll = () => { setSelectedIds(selectedIds.size === businesses.length ? new Set() : new Set(businesses.map((b) => b.id))); };
    const toggleSelect = (id: string) => { const n = new Set(selectedIds); if (n.has(id)) n.delete(id); else n.add(id); setSelectedIds(n); };

    const columns = buildColumns({ onView: businessList.setSelectedBusiness, onEdit: businessList.setModifyTarget, onDelete: businessList.setDeleteTarget, toggleSelect, toggleSelectAll, selectedIds, allCount: businesses.length, setSuspendTarget, handleActivate });

    const overviewCards = [{ label: "All", value: overview.total, color: "text-slate-700" }, { label: "Live", value: overview.live, color: "text-emerald-600" }, { label: "Pending", value: overview.pending, color: "text-amber-600" }, { label: "Expiring (3d)", value: (overview as any).expiringIn3Days ?? 0, color: "text-rose-600" }, { label: "Suspended", value: overview.suspended, color: "text-red-600" }];

    const tabs = ["live", "suspended", "pending", "deleted", "all"].map((s) => ({ label: s === "live" ? "Live" : s.charAt(0).toUpperCase() + s.slice(1), href: buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, { status: s, page: null })), count: s === "live" ? overview.live : s === "suspended" ? overview.suspended : s === "pending" ? overview.pending : s === "deleted" ? overview.deleted : overview.total }));

    const bulkActions = (
        <div className="flex items-center gap-2">
            {[{ label: "Approve", color: "emerald", icon: CheckCircle2, handler: () => { void handleBulkApprove(Array.from(selectedIds)); setSelectedIds(new Set()); } },
              { label: "Reject", color: "red", icon: XCircle, handler: () => setBulkRejectReason(true) },
              { label: "Deactivate", color: "slate", icon: PowerOff, handler: () => { void handleBulkDeactivate(Array.from(selectedIds)); setSelectedIds(new Set()); } },
              { label: "Expire", color: "amber", icon: History, handler: () => { void handleBulkExpire(Array.from(selectedIds)); setSelectedIds(new Set()); } },
              { label: "Renew", color: "blue", icon: CalendarClock, handler: () => { void handleBulkRenew(Array.from(selectedIds)); setSelectedIds(new Set()); } },
              { label: "Resend Warnings", color: "indigo", icon: History, handler: () => { void handleBulkResendWarnings(Array.from(selectedIds)); setSelectedIds(new Set()); } },
            ].map(({ label, color, icon: Icon, handler }) => (
                <button key={label} onClick={handler} className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-${color}-50 text-${color}-700 hover:bg-${color}-100 rounded-lg text-xs font-bold transition-colors border border-${color}-200`}>
                    <Icon size={14} /> {label}
                </button>
            ))}
        </div>
    );

    return (
        <AdminPageShell title="Business Master" description="Manage all business accounts" headerVariant="compact">
            <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {overviewCards.map(({ label, value, color }) => (
                        <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm">
                            <ChartBar size={16} className="text-slate-300" />
                            <div><div className={`text-lg font-bold ${color}`}>{value}</div><div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</div></div>
                        </div>
                    ))}
                </div>
                <AdminModuleTabs tabs={tabs} />
                <BusinessSearchToolbar search={search} onSearchChange={(v) => replaceQueryState({ q: v, page: null })} placeholder="Search by name, mobile, email..." summary={<>{pagination.total} results</>} wrap searchClassName="relative flex-1 min-w-[200px] max-w-sm"
                    extraFilters={
                        <><input type="text" placeholder="Filter by location ID..." className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-52" value={locationIdFilter} onChange={(e) => replaceQueryState({ locationId: e.target.value, page: null })} />
                        <div className="flex items-center gap-2">
                            {[
                                { key: "expiringIn3Days", raw: rawExpiringIn3Days, label: "Expiring (3d)", c1: "rose", c2: "rose" },
                                { key: "warningSent", raw: rawWarningSent, label: "Warning Sent", c1: "emerald", c2: "emerald" },
                                { key: "warningNotSent", raw: rawWarningNotSent, label: "No Warning", c1: "amber", c2: "amber" },
                            ].map(({ key, raw, label, c1 }) => (
                                <button key={key} onClick={() => replaceQueryState({ [key]: raw === "true" ? null : "true", page: null, ...(key !== "expiringIn3Days" ? { [key === "warningSent" ? "warningNotSent" : "warningSent"]: null } : {}) })}
                                    className={`px-3 py-2 border rounded-lg text-xs font-bold transition-all ${raw === "true" ? `bg-${c1}-50 border-${c1}-200 text-${c1}-700 shadow-sm` : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                    {label}
                                </button>
                            ))}
                        </div></>
                    } />
                <BusinessListTable data={businesses} columns={columns} isLoading={loading} page={page} setPage={(np) => replaceQueryState({ page: np > 1 ? np : null })} pagination={pagination} onRowClick={(b) => businessList.setSelectedBusiness(b)} emptyMessage={error || "No businesses found."} selectedCount={selectedIds.size} bulkActions={bulkActions} />
            </div>
            {bulkRejectReason && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center gap-3 text-red-600"><XCircle size={24} /><h3 className="text-lg font-bold">Bulk Reject Reason</h3></div>
                        <p className="text-sm text-slate-500">Please provide a reason for rejecting the {selectedIds.size} selected businesses.</p>
                        <textarea id="brr" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[100px]" placeholder="Reason for rejection..." />
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setBulkRejectReason(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={async () => { const r = (document.getElementById("brr") as HTMLTextAreaElement).value; if (!r.trim()) return; await handleBulkReject(Array.from(selectedIds), r); setBulkRejectReason(false); setSelectedIds(new Set()); }} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors">Confirm Reject</button>
                        </div>
                    </div>
                </div>
            )}
            <BusinessListModals controller={buildBusinessModalController(businesses, businessList)} onApproveFromDetails={(b) => void handleActivate(b.id)} onSuspendFromDetails={(b) => setSuspendTarget(b)} onActivateFromDetails={(id) => void handleActivate(id)} deleteDescription={<>Soft-deletes the business and expires all listings.</>}
                extraDialogs={suspendTarget && <BusinessSuspendModal businessName={suspendTarget.name} onClose={() => setSuspendTarget(null)} onConfirm={async (reason) => { await handleSuspend(suspendTarget.id, reason); setSuspendTarget(null); }} />} />
        </AdminPageShell>
    );
}
