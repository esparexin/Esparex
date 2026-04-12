"use client";
import { mapErrorToMessage } from '@/lib/mapErrorToMessage';

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Building2,
    MapPin,
    Ban,
    RotateCcw,
    ChartBar,
} from "lucide-react";
import { format } from "date-fns";
import { ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { useToast } from "@/context/ToastContext";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { BusinessSuspendModal } from "@/components/business/BusinessSuspendModal";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { useAdminBusinessList } from "@/hooks/useAdminBusinessList";
import type { Business } from "@/types/business";
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
    const { showToast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [suspendTarget, setSuspendTarget] = useState<Business | null>(null);
    const rawStatus = searchParams.get("status");
    const rawSearch = searchParams.get("search");
    const rawCity = searchParams.get("city");
    const rawPage = searchParams.get("page");

    const activeTab =
        rawStatus === "approved" || rawStatus === "active"
            ? DEFAULT_STATUS
            : rawStatus && BUSINESS_MASTER_STATUSES.has(rawStatus)
                ? rawStatus
                : DEFAULT_STATUS;
    const search = normalizeSearchParamValue(rawSearch);
    const cityFilter = normalizeSearchParamValue(rawCity);
    const page = parsePositiveIntParam(rawPage, 1);

    const replaceQueryState = (updates: Record<string, string | number | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    };

    const businessList = useAdminBusinessList({
        activeTab,
        search,
        page,
        initialOverview: { total: 0, pending: 0, live: 0, suspended: 0, deleted: 0 },
        mapOverview,
        extraQueryParams: {
            city: cityFilter,
            includeDeleted: activeTab === "deleted" || activeTab === "all" ? "true" : undefined,
        },
    });
    const { businesses, loading, error, pagination, overview, handleSuspend, handleActivate } = businessList;

    useEffect(() => {
        const nextUrl = buildUrlWithSearchParams(
            pathname,
            updateSearchParams(searchParams, {
                status: activeTab,
                search,
                city: cityFilter,
                page: page > 1 ? page : null,
            })
        );
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));

        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [activeTab, cityFilter, page, pathname, rawStatus, router, search, searchParams]);

    useEffect(() => {
        if (!loading && page > pagination.pages) {
            replaceQueryState({ page: pagination.pages > 1 ? pagination.pages : null });
        }
    }, [loading, page, pagination.pages]);

    const columns: ColumnDef<Business>[] = [
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
                const bg = `hsl(${hue}, 84%, 96%)`;
                
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
                        { label: "Suspended", value: overview.suspended, color: "text-red-600" },
                        { label: "Deleted", value: overview.deleted, color: "text-slate-500" },
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
                    onSearchChange={(value) => replaceQueryState({ search: value, page: null })}
                    placeholder="Search by name, mobile, email..."
                    summary={<>{pagination.total} results</>}
                    wrap
                    searchClassName="relative flex-1 min-w-[200px] max-w-sm"
                    extraFilters={
                        <input
                            type="text"
                            placeholder="Filter by city..."
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-36"
                            value={cityFilter}
                            onChange={(event) => replaceQueryState({ city: event.target.value, page: null })}
                        />
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
                />
            </div>

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
