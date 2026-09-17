"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChartBar, CheckCircle2, XCircle, PowerOff, History, CalendarClock } from "@esparex/ui";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { BusinessReasonModal } from "@/components/business/BusinessReasonModal";
import { BusinessAdminModals } from "@/components/business/BusinessAdminModals";
import { useAdminBusinessList } from "@/hooks/useAdminBusinessList";
import { Business } from "@esparex/contracts";
import { buildUrlWithSearchParams, normalizeSearchParamValue, parsePositiveIntParam, updateSearchParams } from "@/lib/urlSearchParams";
import { BusinessListTable, BusinessSearchToolbar } from "@/components/business/BusinessListPrimitives";
import { buildColumns } from "./columns";

const DEFAULT_STATUS = "all";
const BUSINESS_MASTER_STATUSES = new Set(["all", "live", "suspended", "pending", "expired", "deactivated", "deleted"]);

const normalizeStatus = (status: string | null): string => {
    if (!status || status === "all") return DEFAULT_STATUS;
    if (status === "approved" || status === "active") return "live";
    if (BUSINESS_MASTER_STATUSES.has(status)) return status;
    return DEFAULT_STATUS;
};

const mapOverview = (data: Record<string, unknown>) => ({ total: Number(data.total || 0), pending: Number(data.pending || 0), live: Number(data.live || data.approved || 0), suspended: Number(data.suspended || 0), expired: Number(data.expired || 0), deactivated: Number(data.deactivated || 0), deleted: Number(data.deleted || 0) });

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
    const activeTab = normalizeStatus(rawStatus);
    const search = normalizeSearchParamValue(rawSearch);
    const locationIdFilter = normalizeSearchParamValue(rawLocationId);
    const page = parsePositiveIntParam(rawPage, 1);

    const replaceQueryState = useCallback((updates: Record<string, string | number | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        if (nextUrl !== buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()))) router.replace(nextUrl, { scroll: false });
    }, [pathname, router, searchParams]);

    const businessList = useAdminBusinessList({
        activeTab, search, page, initialOverview: { total: 0, pending: 0, live: 0, suspended: 0, expired: 0, deactivated: 0, deleted: 0 },
        mapOverview,
        extraQueryParams: { locationId: locationIdFilter, expiringIn3Days: rawExpiringIn3Days || undefined, warningSent: rawWarningSent || undefined, warningNotSent: rawWarningNotSent || undefined, includeDeleted: activeTab === "deleted" || activeTab === "all" ? "true" : undefined },
    });

    const { businesses, loading, error, pagination, overview, handleSuspend, handleActivate, handleBulkApprove, handleBulkReject, handleBulkDeactivate, handleBulkExpire, handleBulkRenew, handleBulkResendWarnings } = businessList;
    const toggleSelectAll = () => { setSelectedIds(selectedIds.size === businesses.length ? new Set() : new Set(businesses.map((b) => b.id))); };
    const toggleSelect = (id: string) => { const n = new Set(selectedIds); if (n.has(id)) n.delete(id); else n.add(id); setSelectedIds(n); };

    const columns = buildColumns({ onView: businessList.setSelectedBusiness, onEdit: businessList.setModifyTarget, onDelete: businessList.setDeleteTarget, toggleSelect, toggleSelectAll, selectedIds, allCount: businesses.length, setSuspendTarget, handleActivate });

    const statusParam = activeTab;

    const handleStatusCardClick = (status: string) => {
        replaceQueryState({
            status: status === "all" ? null : status,
            page: null,
            expiringIn3Days: null,
            warningSent: null,
            warningNotSent: null,
        });
    };

    const handleCardClick = (cardKey: string) => {
        if (cardKey === "expiringIn3Days") {
            replaceQueryState({
                expiringIn3Days: rawExpiringIn3Days === "true" ? null : "true",
                page: null,
                warningSent: null,
                warningNotSent: null,
            });
            return;
        }

        handleStatusCardClick(cardKey);
    };

    const hasActiveFilters = Boolean(
        search ||
        locationIdFilter ||
        rawExpiringIn3Days ||
        rawWarningSent ||
        rawWarningNotSent ||
        (rawStatus && rawStatus !== "all")
    );

    const handleClearAllFilters = () => {
        replaceQueryState({
            status: null,
            q: null,
            search: null,
            locationId: null,
            expiringIn3Days: null,
            warningSent: null,
            warningNotSent: null,
            page: null,
        });
    };

    const isStatActive = (key: string) => !rawExpiringIn3Days && statusParam === key;
    const overviewCards = [
        { key: "all", label: "All", value: overview.total, isActive: isStatActive("all"), color: "text-foreground-secondary" },
        { key: "live", label: "Live", value: overview.live, isActive: isStatActive("live"), color: "text-emerald-600" },
        { key: "pending", label: "Pending", value: overview.pending, isActive: isStatActive("pending"), color: "text-amber-600" },
        { key: "expiringIn3Days", label: "Expiring (3d)", value: (overview as { expiringIn3Days?: number }).expiringIn3Days ?? 0, isActive: rawExpiringIn3Days === "true", color: "text-rose-600" },
        { key: "suspended", label: "Suspended", value: overview.suspended, isActive: isStatActive("suspended"), color: "text-red-600" },
        { key: "expired", label: "Expired", value: (overview as Record<string, number>).expired ?? 0, isActive: isStatActive("expired"), color: "text-amber-700" },
        { key: "deactivated", label: "Deactivated", value: (overview as Record<string, number>).deactivated ?? 0, isActive: isStatActive("deactivated"), color: "text-foreground-secondary" },
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
                    {overviewCards.map(({ key, label, value, isActive, color }) => (
                        <button
                            type="button"
                            key={key}
                            onClick={() => handleCardClick(key)}
                            className={`rounded-lg border px-2.5 py-1.5 flex items-center gap-2 shadow-xs text-left transition-all cursor-pointer ${
                                isActive
                                    ? "bg-primary/10 border-primary/40 ring-2 ring-primary/20 shadow-xs"
                                    : "bg-card border-border hover:border-border/80 hover:bg-muted/40"
                            }`}
                        >
                            <ChartBar size={14} className={isActive ? "text-primary shrink-0" : "text-foreground-subtle shrink-0"} />
                            <div>
                                <div className={`text-body font-bold leading-tight ${color}`}>{value}</div>
                                <div className="text-tiny text-foreground-subtle font-semibold uppercase tracking-wider leading-none">{label}</div>
                            </div>
                        </button>
                    ))}
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
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearAllFilters}
                                    className="px-2.5 py-2 text-caption font-semibold text-foreground-subtle hover:text-foreground transition-colors cursor-pointer"
                                >
                                    Clear filters
                                </button>
                            )}
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
            <BusinessAdminModals
                businesses={businesses}
                selectedBusiness={businessList.selectedBusiness}
                rejectTarget={businessList.rejectTarget}
                modifyTarget={businessList.modifyTarget}
                deleteTarget={businessList.deleteTarget}
                suspendTarget={suspendTarget}
                setSelectedBusiness={businessList.setSelectedBusiness}
                setRejectTarget={businessList.setRejectTarget}
                setModifyTarget={businessList.setModifyTarget}
                setDeleteTarget={businessList.setDeleteTarget}
                setSuspendTarget={setSuspendTarget}
                handleReject={businessList.handleReject}
                handleModify={businessList.handleModify}
                handleDelete={businessList.handleDelete}
                handleSuspend={handleSuspend}
                onApproveFromDetails={(b) => void handleActivate(b.id)}
                onSuspendFromDetails={(b) => setSuspendTarget(b)}
                onActivateFromDetails={(id) => void handleActivate(id)}
                deleteDescription={<>Soft-deletes the business and expires all listings.</>}
            />
        </AdminPageShell>
    );
}
