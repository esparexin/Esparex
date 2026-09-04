"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChartBar, CheckCircle2, XCircle, PowerOff, History, CalendarClock } from "@esparex/ui";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { BusinessSuspendModal } from "@/components/business/BusinessSuspendModal";
import { BusinessReasonModal } from "@/components/business/BusinessReasonModal";
import { useAdminBusinessList } from "@/hooks/useAdminBusinessList";
import { Business } from "@esparex/contracts";
import { buildUrlWithSearchParams, normalizeSearchParamValue, parsePositiveIntParam, updateSearchParams } from "@/lib/urlSearchParams";
import { BusinessListModals, buildBusinessModalController, BusinessListTable, BusinessSearchToolbar } from "@/components/business/BusinessListPrimitives";
import { buildColumns } from "./columns";

const DEFAULT_STATUS = "live";
const BUSINESS_MASTER_STATUSES = new Set(["live", "suspended", "pending", "deleted", "all"]);

const mapOverview = (data: Record<string, unknown>) => ({ total: Number(data.total || 0), pending: Number(data.pending || 0), live: Number(data.live || data.approved || 0), suspended: Number(data.suspended || 0), deleted: Number(data.deleted || 0) });

const COLOR_VARIANTS: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
    red: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200",
    slate: "bg-muted text-foreground-secondary hover:bg-muted/80 border-border",
    amber: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
    indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200",
    rose: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200",
};

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

    const statusParam = searchParams.get("status") || "all";

    const overviewCards = [
        { label: "All", value: overview.total, status: "all", color: "text-foreground-secondary" },
        { label: "Live", value: overview.live, status: "live", color: "text-emerald-600" },
        { label: "Pending", value: overview.pending, status: "pending", color: "text-amber-600" },
        { label: "Expiring (3d)", value: (overview as { expiringIn3Days?: number }).expiringIn3Days ?? 0, status: "expiring", color: "text-rose-600" },
        { label: "Suspended", value: overview.suspended, status: "suspended", color: "text-red-600" },
    ];

    const bulkActions = (
        <div className="flex items-center gap-2">
            {[{ label: "Approve", color: "emerald", icon: CheckCircle2, handler: () => { void handleBulkApprove(Array.from(selectedIds)); setSelectedIds(new Set()); } },
              { label: "Reject", color: "red", icon: XCircle, handler: () => setBulkRejectReason(true) },
              { label: "Deactivate", color: "slate", icon: PowerOff, handler: () => { void handleBulkDeactivate(Array.from(selectedIds)); setSelectedIds(new Set()); } },
              { label: "Expire", color: "amber", icon: History, handler: () => { void handleBulkExpire(Array.from(selectedIds)); setSelectedIds(new Set()); } },
              { label: "Renew", color: "blue", icon: CalendarClock, handler: () => { void handleBulkRenew(Array.from(selectedIds)); setSelectedIds(new Set()); } },
              { label: "Resend Warnings", color: "indigo", icon: History, handler: () => { void handleBulkResendWarnings(Array.from(selectedIds)); setSelectedIds(new Set()); } },
            ].map(({ label, color, icon: Icon, handler }) => (
                <button key={label} onClick={handler} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-bold transition-colors border ${COLOR_VARIANTS[color] || "bg-muted text-foreground-secondary border-border"} cursor-pointer`}>
                    <Icon size={14} /> {label}
                </button>
            ))}
        </div>
    );

    return (
        <AdminPageShell title="Business Master" description="Manage all business accounts" headerVariant="compact">
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl">
                    {overviewCards.map(({ label, value, status, color }) => {
                        const isActive = statusParam === status || (status === "all" && !statusParam);
                        return (
                            <button
                                type="button"
                                key={label}
                                onClick={() => replaceQueryState({ status: status === "all" ? null : status, page: null })}
                                className={`rounded-xl border p-3 flex items-center gap-3 shadow-xs text-left transition-all cursor-pointer ${
                                    isActive
                                        ? "bg-primary/10 border-primary/40 ring-2 ring-primary/20 shadow-xs"
                                        : "bg-card border-border hover:border-border/80 hover:bg-muted/40"
                                }`}
                            >
                                <ChartBar size={16} className={isActive ? "text-primary" : "text-foreground-subtle"} />
                                <div>
                                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                                    <div className="text-tiny text-foreground-subtle font-semibold uppercase tracking-wider">{label}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <BusinessSearchToolbar search={search} onSearchChange={(v) => replaceQueryState({ q: v, page: null })} placeholder="Search by name, mobile, email..." summary={<>{pagination.total} results</>} wrap searchClassName="relative flex-1 min-w-[200px] max-w-sm"
                    extraFilters={
                        <><input type="text" placeholder="Filter by location ID..." className="px-3 py-2 bg-background border border-input rounded-lg text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all w-52" value={locationIdFilter} onChange={(e) => replaceQueryState({ locationId: e.target.value, page: null })} aria-label="Filter by location ID" />
                        <div className="flex items-center gap-2">
                            {[
                                { key: "expiringIn3Days", raw: rawExpiringIn3Days, label: "Expiring (3d)", c1: "rose" },
                                { key: "warningSent", raw: rawWarningSent, label: "Warning Sent", c1: "emerald" },
                                { key: "warningNotSent", raw: rawWarningNotSent, label: "No Warning", c1: "amber" },
                            ].map(({ key, raw, label, c1 }) => (
                                <button key={key} onClick={() => replaceQueryState({ [key]: raw === "true" ? null : "true", page: null, ...(key !== "expiringIn3Days" ? { [key === "warningSent" ? "warningNotSent" : "warningSent"]: null } : {}) })}
                                    className={`px-3 py-2 border rounded-lg text-caption font-bold transition-all cursor-pointer ${raw === "true" ? `${COLOR_VARIANTS[c1]} shadow-xs` : "bg-card border-border text-foreground-secondary hover:bg-muted/50"}`}>
                                    {label}
                                </button>
                            ))}
                        </div></>
                    } />
                <BusinessListTable data={businesses} columns={columns} isLoading={loading} page={page} setPage={(np) => replaceQueryState({ page: np > 1 ? np : null })} pagination={pagination} onRowClick={(b) => businessList.setSelectedBusiness(b)} emptyMessage={error || "No businesses found."} selectedCount={selectedIds.size} bulkActions={bulkActions} />
            </div>
            {bulkRejectReason && (
                <BusinessReasonModal
                    businessName={`${selectedIds.size} Selected Businesses`}
                    title="Bulk Reject Businesses"
                    description="This action will reject"
                    notice="All associated listings for selected businesses will be expired upon rejection."
                    label="Rejection Reason"
                    placeholder="e.g. Incomplete documentation, duplicate registration, invalid GST number..."
                    requiredMessage="Rejection reason is required."
                    minLength={5}
                    minLengthMessage="Please provide a more descriptive reason."
                    submitLabel="Confirm Bulk Reject"
                    submittingLabel="Rejecting..."
                    failureMessage="Failed to reject businesses"
                    icon={XCircle}
                    tone="danger"
                    onClose={() => setBulkRejectReason(false)}
                    onConfirm={async (reason) => {
                        await handleBulkReject(Array.from(selectedIds), reason);
                        setBulkRejectReason(false);
                        setSelectedIds(new Set());
                    }}
                />
            )}
            <BusinessListModals controller={buildBusinessModalController(businesses, businessList)} onApproveFromDetails={(b) => void handleActivate(b.id)} onSuspendFromDetails={(b) => setSuspendTarget(b)} onActivateFromDetails={(id) => void handleActivate(id)} deleteDescription={<>Soft-deletes the business and expires all listings.</>}
                extraDialogs={suspendTarget && <BusinessSuspendModal businessName={suspendTarget.name} onClose={() => setSuspendTarget(null)} onConfirm={async (reason) => { await handleSuspend(suspendTarget.id, reason); setSuspendTarget(null); }} />} />
        </AdminPageShell>
    );
}
