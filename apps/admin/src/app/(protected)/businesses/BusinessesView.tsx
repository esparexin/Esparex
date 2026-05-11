"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Building2,
    MapPin,
    Ban,
    RotateCcw,
    ChartBar,
    CheckCircle2,
    XCircle,
    PowerOff,
    History,
    CalendarClock,
} from "lucide-react";
import { format } from "date-fns";
import { ColumnDef } from "@/components/ui/DataTable";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { BusinessSuspendModal } from "@/components/business/BusinessSuspendModal";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { useAdminBusinessList } from "@/hooks/useAdminBusinessList";
import type { Business } from "@esparex/shared";
import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    parsePositiveIntParam,
    updateSearchParams,
} from "@/lib/urlSearchParams";
import {
    BusinessActionButton,
    buildBusinessModalController,
    createBusinessActionsColumn,
    createBusinessStatusColumn,
    BusinessListModals,
    BusinessListTable,
    BusinessSearchToolbar,
    BusinessTypesCell,
} from "@/components/business/BusinessListPrimitives";

const DEFAULT_STATUS = "live";
const BUSINESS_MASTER_STATUSES = new Set(["live", "suspended", "pending", "deleted", "all"]);

const mapOverview = (data: Record<string, unknown>) => ({
    total: Number(data.total || 0),
    pending: Number(data.pending || 0),
    live: Number(data.live || data.approved || 0),
    suspended: Number(data.suspended || 0),
    deleted: Number(data.deleted || 0),
});

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

    const activeTab =
        rawStatus === "approved" || rawStatus === "active"
            ? DEFAULT_STATUS
            : rawStatus && BUSINESS_MASTER_STATUSES.has(rawStatus)
                ? rawStatus
                : DEFAULT_STATUS;
    const search = normalizeSearchParamValue(rawSearch);
    const locationIdFilter = normalizeSearchParamValue(rawLocationId);
    const page = parsePositiveIntParam(rawPage, 1);

    const replaceQueryState = useCallback((updates: Record<string, string | number | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [pathname, router, searchParams]);

    const businessList = useAdminBusinessList({
        activeTab,
        search,
        page,
        initialOverview: { total: 0, pending: 0, live: 0, suspended: 0, deleted: 0 },
        mapOverview,
        extraQueryParams: {
            locationId: locationIdFilter,
            expiringIn3Days: rawExpiringIn3Days || undefined,
            warningSent: rawWarningSent || undefined,
            warningNotSent: rawWarningNotSent || undefined,
            includeDeleted: activeTab === "deleted" || activeTab === "all" ? "true" : undefined,
        },
    });
    const { 
        businesses, loading, error, pagination, overview, 
        handleSuspend, handleActivate, fetchBusinesses,
        handleBulkApprove, handleBulkReject, handleBulkDeactivate, handleBulkExpire, handleBulkRenew, handleBulkResendWarnings
    } = businessList;

    const toggleSelectAll = () => {
        if (selectedIds.size === businesses.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(businesses.map((b) => b.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    useEffect(() => {
        const nextUrl = buildUrlWithSearchParams(
            pathname,
            updateSearchParams(searchParams, {
                status: activeTab,
                q: search,
                locationId: locationIdFilter,
                expiringIn3Days: rawExpiringIn3Days,
                warningSent: rawWarningSent,
                warningNotSent: rawWarningNotSent,
                page: page > 1 ? page : null,
            })
        );
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));

        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [activeTab, locationIdFilter, page, pathname, rawStatus, router, search, searchParams]);

    useEffect(() => {
        if (!loading && page > pagination.pages) {
            replaceQueryState({ page: pagination.pages > 1 ? pagination.pages : null });
        }
    }, [loading, page, pagination.pages, replaceQueryState]);

    const columns: ColumnDef<Business>[] = [
        {
            id: "selection",
            header: (
                <input
                    type="checkbox"
                    checked={businesses.length > 0 && selectedIds.size === businesses.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                />
            ),
            cell: (biz) => (
                <input
                    type="checkbox"
                    checked={selectedIds.has(biz.id)}
                    onChange={() => toggleSelect(biz.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                />
            ),
            className: "w-10 px-4",
        },
        {
            header: "Business",
            cell: (biz) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Building2 size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-slate-900 leading-tight truncate">{biz.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{biz.id}</div>
                    </div>
                </div>
            ),
        },
        {
            header: "Trust",
            cell: (biz) => {
                const score = biz.trustScore ?? 0;
                // Premium HSL-based dynamic colors
                const hue = Math.round((score / 100) * 120); // 0 (red) to 120 (green)
                const color = `hsl(${hue}, 84%, 45%)`;
                
                return (
                    <div className="flex flex-col gap-1.5 w-16 group cursor-default">
                        <div className="flex items-center justify-between">
                             <div className="text-[10px] font-black tracking-tighter tabular-nums" style={{ color }}>
                               {score}%
                             </div>
                             {score > 85 && (
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_4px_theme(colors.emerald.400)]" />
                             )}
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                            <div 
                                className="h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]" 
                                style={{ 
                                    width: `${score}%`, 
                                    backgroundColor: color,
                                    backgroundImage: `linear-gradient(to right, transparent, rgba(255,255,255,0.3))` 
                                }} 
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            header: "Category",
            cell: (biz) => <BusinessTypesCell businessTypes={biz.businessTypes} />,
        },
        {
            header: "Location",
            cell: (biz) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate max-w-[110px]">{biz.location?.city || "—"}</span>
                </div>
            ),
        },
        {
            header: "Active Since",
            cell: (biz) => (
                <div className="space-y-0.5">
                    <div className="text-xs text-slate-700 font-medium">
                        {biz.approvedAt ? format(new Date(biz.approvedAt), "MMM d, yyyy") : "N/A"}
                    </div>
                    {biz.expiresAt && (
                        <div className="text-[9px] text-slate-400 italic">
                            Exp {format(new Date(biz.expiresAt), "MMM d, yyyy")}
                        </div>
                    )}
                </div>
            ),
        },
        createBusinessStatusColumn(true),
        createBusinessActionsColumn({
            onView: businessList.setSelectedBusiness,
            onEdit: businessList.setModifyTarget,
            onDelete: businessList.setDeleteTarget,
            editTitle: "Edit Business",
            deleteTitle: "Delete Business",
            canEdit: (biz) => !biz.isDeleted,
            canDelete: (biz) => !biz.isDeleted,
            renderExtraActions: (biz) =>
                biz.status === "live" ? (
                    <BusinessActionButton
                        onClick={() => setSuspendTarget(biz)}
                        title="Suspend Business"
                        tone="warning"
                        icon={<Ban size={15} />}
                    />
                ) : biz.status === "suspended" ? (
                    <BusinessActionButton
                        onClick={() => void handleActivate(biz.id)}
                        title="Reactivate Business"
                        tone="success"
                        icon={<RotateCcw size={15} />}
                    />
                ) : undefined,
        }),
    ];

    return (
        <AdminPageShell
            title="Business Master"
            description="Single admin surface for pending, live, suspended, deleted, and historical business accounts"
            headerVariant="compact"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { label: "All", value: overview.total, color: "text-slate-700" },
                        { label: "Live", value: overview.live, color: "text-emerald-600" },
                        { label: "Pending", value: overview.pending, color: "text-amber-600" },
                        { label: "Expiring (3d)", value: (overview as any).expiringIn3Days ?? 0, color: "text-rose-600" },
                        { label: "Suspended", value: overview.suspended, color: "text-red-600" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm">
                            <ChartBar size={16} className="text-slate-300" />
                            <div>
                                <div className={`text-lg font-bold ${color}`}>{value}</div>
                                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <AdminModuleTabs
                    tabs={[
                        {
                            label: "Live",
                            href: buildUrlWithSearchParams(
                                pathname,
                                updateSearchParams(searchParams, { status: "live", page: null })
                            ),
                            count: overview.live,
                        },
                        {
                            label: "Suspended",
                            href: buildUrlWithSearchParams(
                                pathname,
                                updateSearchParams(searchParams, { status: "suspended", page: null })
                            ),
                            count: overview.suspended,
                        },
                        {
                            label: "Pending",
                            href: buildUrlWithSearchParams(
                                pathname,
                                updateSearchParams(searchParams, { status: "pending", page: null })
                            ),
                            count: overview.pending,
                        },
                        {
                            label: "Deleted",
                            href: buildUrlWithSearchParams(
                                pathname,
                                updateSearchParams(searchParams, { status: "deleted", page: null })
                            ),
                            count: overview.deleted,
                        },
                        {
                            label: "All",
                            href: buildUrlWithSearchParams(
                                pathname,
                                updateSearchParams(searchParams, { status: "all", page: null })
                            ),
                            count: overview.total,
                        },
                    ]}
                />

                <BusinessSearchToolbar
                    search={search}
                    onSearchChange={(value) => replaceQueryState({ q: value, page: null })}
                    placeholder="Search by name, mobile, email..."
                    summary={<>{pagination.total} results</>}
                    wrap
                    searchClassName="relative flex-1 min-w-[200px] max-w-sm"
                    extraFilters={
                        <>
                            <input
                                type="text"
                                placeholder="Filter by location ID..."
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-52"
                                value={locationIdFilter}
                                onChange={(event) => replaceQueryState({ locationId: event.target.value, page: null })}
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => replaceQueryState({ 
                                        expiringIn3Days: rawExpiringIn3Days === "true" ? null : "true",
                                        page: null 
                                    })}
                                    className={`px-3 py-2 border rounded-lg text-xs font-bold transition-all ${
                                        rawExpiringIn3Days === "true" 
                                            ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm" 
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    Expiring (3d)
                                </button>
                                <button
                                    onClick={() => replaceQueryState({ 
                                        warningSent: rawWarningSent === "true" ? null : "true",
                                        warningNotSent: null,
                                        page: null 
                                    })}
                                    className={`px-3 py-2 border rounded-lg text-xs font-bold transition-all ${
                                        rawWarningSent === "true" 
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    Warning Sent
                                </button>
                                <button
                                    onClick={() => replaceQueryState({ 
                                        warningNotSent: rawWarningNotSent === "true" ? null : "true",
                                        warningSent: null,
                                        page: null 
                                    })}
                                    className={`px-3 py-2 border rounded-lg text-xs font-bold transition-all ${
                                        rawWarningNotSent === "true" 
                                            ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm" 
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    No Warning
                                </button>
                            </div>
                        </>
                    }
                />

                <BusinessListTable
                    data={businesses}
                    columns={columns}
                    isLoading={loading}
                    page={page}
                    setPage={(nextPage) => replaceQueryState({ page: nextPage > 1 ? nextPage : null })}
                    pagination={pagination}
                    onRowClick={(biz) => businessList.setSelectedBusiness(biz)}
                    emptyMessage={error || "No businesses found."}
                    selectedCount={selectedIds.size}
                    bulkActions={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    void handleBulkApprove(Array.from(selectedIds));
                                    setSelectedIds(new Set());
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                            >
                                <CheckCircle2 size={14} /> Approve
                            </button>
                            <button
                                onClick={() => setBulkRejectReason(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors border border-red-200"
                            >
                                <XCircle size={14} /> Reject
                            </button>
                            <button
                                onClick={() => {
                                    void handleBulkDeactivate(Array.from(selectedIds));
                                    setSelectedIds(new Set());
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors border border-slate-200"
                            >
                                <PowerOff size={14} /> Deactivate
                            </button>
                            <button
                                onClick={() => {
                                    void handleBulkExpire(Array.from(selectedIds));
                                    setSelectedIds(new Set());
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors border border-amber-200"
                            >
                                <History size={14} /> Expire
                            </button>
                            <button
                                onClick={() => {
                                    void handleBulkRenew(Array.from(selectedIds));
                                    setSelectedIds(new Set());
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border border-blue-200"
                            >
                                <CalendarClock size={14} /> Renew
                            </button>
                            <button
                                onClick={() => {
                                    void handleBulkResendWarnings(Array.from(selectedIds));
                                    setSelectedIds(new Set());
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors border border-indigo-200"
                            >
                                <History size={14} /> Resend Warnings
                            </button>
                        </div>
                    }
                />
            </div>

            {bulkRejectReason && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <XCircle size={24} />
                            <h3 className="text-lg font-bold">Bulk Reject Reason</h3>
                        </div>
                        <p className="text-sm text-slate-500">
                            Please provide a reason for rejecting the {selectedIds.size} selected businesses.
                        </p>
                        <textarea
                            id="bulk-reject-reason"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[100px]"
                            placeholder="Reason for rejection..."
                        />
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setBulkRejectReason(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const reason = (document.getElementById("bulk-reject-reason") as HTMLTextAreaElement).value;
                                    if (!reason.trim()) return;
                                    await handleBulkReject(Array.from(selectedIds), reason);
                                    setBulkRejectReason(false);
                                    setSelectedIds(new Set());
                                }}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BusinessListModals
                controller={buildBusinessModalController(businesses, businessList)}
                onApproveFromDetails={(business) => void handleActivate(business.id)}
                onSuspendFromDetails={(business) => setSuspendTarget(business)}
                onActivateFromDetails={(id) => void handleActivate(id)}
                deleteDescription={
                    <>
                        Soft-deletes the business and expires all listings. This cannot be undone automatically.
                    </>
                }
                extraDialogs={
                    suspendTarget && (
                        <BusinessSuspendModal
                            businessName={suspendTarget.name}
                            onClose={() => setSuspendTarget(null)}
                            onConfirm={async (reason) => {
                                await handleSuspend(suspendTarget.id, reason);
                                setSuspendTarget(null);
                            }}
                        />
                    )
                }
            />
        </AdminPageShell>
    );
}
