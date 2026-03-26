"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { AlertCircle, RefreshCcw, EyeOff, ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { AdsTable } from "@/components/moderation/AdsTable";
import { RejectAdModal } from "@/components/moderation/RejectAdModal";
import { ViewAdModal } from "@/components/moderation/ViewAdModal";
import { DEFAULT_FILTERS, type ModerationFilters, type ModerationItem } from "@/components/moderation/moderationTypes";
import { MODERATION_STATUSES, MODERATION_STATUS_LABELS } from "@/components/moderation/moderationStatus";
import { useAdminAdsQuery } from "@/hooks/useAdminAdsQuery";
import {
    activateAdminAd,
    approveAdminAd,
    blockAdminSeller,
    deactivateAdminAd,
    deleteAdminAd,
    extendAdminListing,
    fetchAdminAdDetail,
    rejectAdminAd
} from "@/lib/api/moderation";
import { normalizeModerationAd } from "@/components/moderation/normalizeModerationAd";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { moderationTabs, adLifecycleTabs, serviceLifecycleTabs, partLifecycleTabs } from "@/components/layout/adminModuleTabSets";
import { AdminErrorBoundary } from "@/components/common/AdminErrorBoundary";
import { AdminApiError } from "@/lib/api/adminClient";
import { getListingPresentation } from "@/components/moderation/listingPresentation";

const SORT_OPTIONS: Array<{ label: string; value: ModerationFilters["sort"] }> = [
    { label: "Newest", value: "newest" },
    { label: "Oldest", value: "oldest" },
    { label: "Price High", value: "price_high" },
    { label: "Price Low", value: "price_low" }
];

type AdsViewProps = {
    mode?: "ads";
    listingType?: "ad" | "service" | "spare_part";
};

export default function AdsView({ mode = "ads", listingType }: AdsViewProps) {
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const presentation = getListingPresentation(listingType);
    const entityLabel = presentation.actionEntityLabel;
    const entityLabelPlural = presentation.actionEntityLabelPlural;

    const [filters, setFilters] = useState<ModerationFilters>(() => ({
        ...DEFAULT_FILTERS,
        status: "live",
        listingType
    }));
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [refreshKey, setRefreshKey] = useState(0);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
        select: true,
        image: true,
        details: true,
        seller: true,
        location: true,
        attribute: true,
        risk: true,
        status: true,
        created: true,
        actions: true
    });
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewAd, setViewAd] = useState<ModerationItem | null>(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState("");

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTargetIds, setRejectTargetIds] = useState<string[]>([]);
    const [rejectTitle, setRejectTitle] = useState<string | undefined>(undefined);
    const [rejectSubmitting, setRejectSubmitting] = useState(false);

    const resolveActionErrorMessage = (actionError: unknown, fallbackMessage: string): string => {
        return AdminApiError.resolveMessage(actionError, fallbackMessage);
    };

    useEffect(() => {
        const statusFromQuery = searchParams.get("status");
        const sellerIdFromQuery = searchParams.get("sellerId");
        const searchFromQuery = searchParams.get("search");
        const listingTypeFromQuery = searchParams.get("listingType") as ModerationFilters["listingType"];
        const allowed = new Set(["pending", "live", "rejected", "deactivated", "sold", "expired", "all"]);
        const normalizedStatus =
            statusFromQuery && allowed.has(statusFromQuery)
                ? statusFromQuery as ModerationFilters["status"]
                : "live";
        const normalizedSellerId = typeof sellerIdFromQuery === "string" ? sellerIdFromQuery.trim() : "";
        const normalizedSearch = typeof searchFromQuery === "string" ? searchFromQuery.trim() : "";
        const normalizedListingType = listingType || listingTypeFromQuery;

        setFilters((prev) => {
            if (
                prev.status === normalizedStatus &&
                prev.sellerId === normalizedSellerId &&
                prev.search === normalizedSearch &&
                prev.listingType === normalizedListingType
            ) {
                return prev;
            }
            return {
                ...prev,
                status: normalizedStatus,
                sellerId: normalizedSellerId,
                search: normalizedSearch,
                listingType: normalizedListingType
            };
        });
        setPage(1);
    }, [listingType, searchParams]);

    const { items, pagination, summary, isLoading, error } = useAdminAdsQuery({
        filters,
        page,
        limit: pageSize,
        refreshKey
    });

    const selectedCount = selectedIds.length;

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => items.some((item) => item.id === id)));
    }, [items]);

    useEffect(() => {
        if (page > pagination.pages) {
            setPage(pagination.pages);
        }
    }, [page, pagination.pages]);

    const moduleTabs = useMemo(() => {
        let baseTabs = adLifecycleTabs;
        if (listingType === "service") {
            baseTabs = serviceLifecycleTabs;
        } else if (listingType === "spare_part") {
            baseTabs = partLifecycleTabs;
        }

        return baseTabs.map(tab => {
            const status = new URLSearchParams(tab.href.split('?')[1]).get('status');
            const count = status === 'all' ? summary.total : summary[status as keyof typeof summary];
            return {
                ...tab,
                count: typeof count === 'number' ? count : undefined
            };
        });
    }, [listingType, summary]);

    const activeStatusOptions = useMemo(() => {
        const allowedStatuses = new Set(moduleTabs.map(t => new URLSearchParams(t.href.split('?')[1]).get('status')).filter(Boolean));
        return [
            { value: "all", label: "All Statuses" },
            ...MODERATION_STATUSES.filter(s => allowedStatuses.has(s)).map((s) => ({ value: s, label: MODERATION_STATUS_LABELS[s] }))
        ];
    }, [moduleTabs]);

    const refresh = () => setRefreshKey((value) => value + 1);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
                setShowColumnMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const columnOptions = useMemo(() => [
        { id: "select", label: "Checkboxes" },
        { id: "image", label: "Image" },
        { id: "details", label: "Details" },
        { id: "seller", label: "Seller" },
        { id: "location", label: "Location" },
        { id: "attribute", label: presentation.attributeHeader },
        { id: "risk", label: "Risk" },
        { id: "status", label: "Status" },
        { id: "created", label: "Created" },
        { id: "actions", label: "Actions" },
    ], [presentation.attributeHeader]);

    const withActionGuard = async (operation: () => Promise<void>, successMessage: string, fallbackError: string) => {
        try {
            await operation();
            showToast(successMessage, "success");
            refresh();
        } catch (actionError) {
            const message = resolveActionErrorMessage(actionError, fallbackError);
            showToast(message, "error");
        }
    };

    const lastRequestId = useMemo(() => ({ current: 0 }), []);

    const resolveAdId = (item: ModerationItem) =>
        item.adId ||
        item.id ||
        (item as any).ad?._id ||
        (item as any).ad?.id;

    const handleView = async (item: ModerationItem) => {
        const requestId = ++lastRequestId.current;
        const targetId = resolveAdId(item);

        setViewModalOpen(true);
        setViewAd(item);
        setViewLoading(true);
        setViewError("");

        try {
            const detail = await fetchAdminAdDetail(targetId);
            if (requestId !== lastRequestId.current) return;
            setViewAd(normalizeModerationAd(detail));
        } catch (detailError) {
            if (requestId !== lastRequestId.current) return;
            setViewError(detailError instanceof Error ? detailError.message : `Failed to load ${entityLabel} details`);
        } finally {
            if (requestId === lastRequestId.current) {
                setViewLoading(false);
            }
        }
    };

    const handleApprove = async (item: ModerationItem) => {
        await withActionGuard(
            () => approveAdminAd(item.id),
            `${entityLabel} approved`,
            `Failed to approve ${entityLabel}`
        );
    };

    const openSingleReject = (item: ModerationItem) => {
        setRejectTitle(item.title);
        setRejectTargetIds([item.id]);
        setRejectModalOpen(true);
    };

    const openBulkReject = () => {
        if (selectedIds.length === 0) return;
        setRejectTitle(undefined);
        setRejectTargetIds(selectedIds);
        setRejectModalOpen(true);
    };

    const handleRejectSubmit = async (reason: string) => {
        if (rejectTargetIds.length === 0) return;
        setRejectSubmitting(true);
        try {
            await Promise.all(rejectTargetIds.map((id) => rejectAdminAd(id, reason)));
            showToast(`Rejected ${rejectTargetIds.length} ${entityLabel}(s)`, "success");
            setRejectModalOpen(false);
            setRejectTargetIds([]);
            setRejectTitle(undefined);
            setSelectedIds([]);
            refresh();
        } catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : `Failed to reject ${entityLabel}`;
            showToast(message, "error");
        } finally {
            setRejectSubmitting(false);
        }
    };

    const handleDeactivate = async (item: ModerationItem) => {
        await withActionGuard(
            () => deactivateAdminAd(item.id),
            `${entityLabel} deactivated`,
            `Failed to deactivate ${entityLabel}`
        );
    };

    const handleActivate = async (item: ModerationItem) => {
        await withActionGuard(
            () => activateAdminAd(item.id),
            `${entityLabel} activated`,
            `Failed to activate ${entityLabel}`
        );
    };

    const handleDelete = async (item: ModerationItem) => {
        const shouldDelete = window.confirm(`Delete ${entityLabel} \"${item.title}\"?`);
        if (!shouldDelete) return;
        await withActionGuard(
            () => deleteAdminAd(item.id),
            `${entityLabel} deleted`,
            `Failed to delete ${entityLabel}`
        );
    };

    const handleBanSeller = async (item: ModerationItem) => {
        if (!item.sellerId) return;
        const shouldBlock = window.confirm(`Block seller ${item.sellerName || item.sellerId}?`);
        if (!shouldBlock) return;

        await withActionGuard(
            () => blockAdminSeller(item.sellerId!, "Blocked via Ads Moderation"),
            "Seller blocked",
            "Failed to block seller"
        );
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        await withActionGuard(
            async () => {
                await Promise.all(selectedIds.map((id) => approveAdminAd(id)));
                setSelectedIds([]);
            },
            `Approved ${selectedIds.length} ${entityLabel}(s)`,
            `Failed to bulk approve ${entityLabelPlural}`
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const shouldDelete = window.confirm(`Delete ${selectedIds.length} selected ${entityLabel}(s)?`);
        if (!shouldDelete) return;

        await withActionGuard(
            async () => {
                await Promise.all(selectedIds.map((id) => deleteAdminAd(id)));
                setSelectedIds([]);
            },
            `Deleted ${selectedIds.length} ${entityLabel}(s)`,
            `Failed to bulk delete ${entityLabelPlural}`
        );
    };

    const updateFilter = <K extends keyof ModerationFilters>(key: K, value: ModerationFilters[K]) => {
        setPage(1);
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const toggleSelect = (adId: string, checked: boolean) => {
        setSelectedIds((prev) => {
            if (checked) return Array.from(new Set([...prev, adId]));
            return prev.filter((id) => id !== adId);
        });
    };

    const toggleSelectAll = (checked: boolean) => {
        const currentIds = items.map((item) => item.id);
        setSelectedIds((prev) => {
            if (checked) return Array.from(new Set([...prev, ...currentIds]));
            return prev.filter((id) => !currentIds.includes(id));
        });
    };

    const clearFilters = () => {
        setFilters((prev) => ({
            ...DEFAULT_FILTERS,
            status: "live",
            listingType: listingType ?? prev.listingType
        }));
        setPage(1);
    };

    return (
        <AdminPageShell
            headerVariant="compact"
            title={listingType ? presentation.pageTitle : "Listings"}
            tabs={
                <div className="flex flex-col gap-4 mb-2">
                    <AdminModuleTabs tabs={moderationTabs} variant="primary" />
                    <AdminModuleTabs tabs={moduleTabs} variant="pills" />
                </div>
            }
            actions={
                <div className="flex items-center gap-2">
                    <div className="relative" ref={columnMenuRef}>
                        <button
                            type="button"
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <EyeOff size={14} /> 
                            <span>Columns</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${showColumnMenu ? "rotate-180" : ""}`} />
                        </button>
                        
                        {showColumnMenu && (
                            <div className="absolute right-0 top-full z-40 mt-2 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in duration-200">
                                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Toggle Columns
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {columnOptions.map((opt) => (
                                        <label
                                            key={opt.id}
                                            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200 cursor-pointer"
                                                checked={columnVisibility[opt.id] !== false}
                                                onChange={(e) => {
                                                    setColumnVisibility(prev => ({
                                                        ...prev,
                                                        [opt.id]: e.target.checked
                                                    }));
                                                }}
                                            />
                                            <span className="font-medium">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <RefreshCcw size={14} /> 
                        <span>Refresh</span>
                    </button>
                </div>
            }
        >
            <div className="flex min-h-0 flex-1 flex-col gap-3">
                {/* Filter toolbar */}
                <AdminFilterToolbar
                    search={filters.search}
                    onSearchChange={(val) => updateFilter("search", val)}
                    searchPlaceholder="Search title, description, seller, phone"
                    status={filters.status}
                    onStatusChange={(val) => updateFilter("status", val as ModerationFilters["status"])}
                    statusOptions={activeStatusOptions}
                    extraFilters={
                        <>
                            <input
                                value={filters.sellerId}
                                onChange={(e) => updateFilter("sellerId", e.target.value)}
                                placeholder="Seller ID"
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 w-32"
                            />
                            <input
                                value={filters.location}
                                onChange={(e) => updateFilter("location", e.target.value)}
                                placeholder="Location"
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 w-28"
                            />
                            <select
                                value={filters.sort}
                                onChange={(e) => updateFilter("sort", e.target.value as ModerationFilters["sort"])}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => updateFilter("dateTo", e.target.value)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Clear
                            </button>
                        </>
                    }
                />

                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="min-h-0 flex-1">
                    <AdsTable
                        data={items}
                        listingType={listingType}
                        isLoading={isLoading}
                        emptyMessage={`No ${entityLabelPlural} matched current moderation filters`}
                        currentPage={page}
                        totalPages={pagination.pages}
                        totalItems={pagination.total}
                        pageSize={pagination.limit}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onToggleSelectAll={toggleSelectAll}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPage(1);
                            setPageSize(size);
                        }}
                        onView={handleView}
                        onApprove={(item) => void handleApprove(item)}
                        onReject={openSingleReject}
                        onDeactivate={(item) => void handleDeactivate(item)}
                        onActivate={(item) => void handleActivate(item)}
                        onDelete={(item) => void handleDelete(item)}
                        onBanSeller={(item) => void handleBanSeller(item)}
                        showCheckboxes={filters.status === 'pending'}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={setColumnVisibility}
                        hideColumnVisibilityButton={true}
                        bulkActions={
                            filters.status === 'pending' ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => void handleBulkApprove()}
                                        disabled={selectedCount === 0}
                                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Approve Selected
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openBulkReject}
                                        disabled={selectedCount === 0}
                                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Reject Selected
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleBulkDelete()}
                                        disabled={selectedCount === 0}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Delete Selected
                                    </button>
                                </>
                            ) : undefined
                        }
                    />
                </div>

                <AdminErrorBoundary fallbackLabel="Moderation Modal Error">
                    <RejectAdModal
                        open={rejectModalOpen}
                        title={rejectTitle}
                        entityLabel={entityLabel}
                        affectedCount={rejectTargetIds.length}
                        isSubmitting={rejectSubmitting}
                        onClose={() => {
                            setRejectModalOpen(false);
                            setRejectTargetIds([]);
                            setRejectTitle(undefined);
                        }}
                        onSubmit={handleRejectSubmit}
                    />

                    <ViewAdModal
                        open={viewModalOpen}
                        ad={viewAd}
                        listingType={listingType}
                        loading={viewLoading}
                        error={viewError}
                        onClose={() => {
                            setViewModalOpen(false);
                            setViewAd(null);
                            setViewError("");
                        }}
                        onApprove={async (adId) => {
                            await withActionGuard(
                                () => approveAdminAd(adId),
                                `${entityLabel} approved`,
                                `Failed to approve ${entityLabel}`
                            );
                            // Re-fetch so the modal reflects the new status (hides Approve button)
                            try {
                                const detail = await fetchAdminAdDetail(adId);
                                setViewAd(normalizeModerationAd(detail));
                            } catch { /* table already refreshed */ }
                        }}
                        onReject={(adId) => {
                            const ad = items.find((item) => item.id === adId) || viewAd;
                            if (ad) openSingleReject(ad);
                        }}
                        onDeactivate={async (adId) => {
                            await withActionGuard(
                                () => deactivateAdminAd(adId),
                                `${entityLabel} deactivated`,
                                `Failed to deactivate ${entityLabel}`
                            );
                            try {
                                const detail = await fetchAdminAdDetail(adId);
                                setViewAd(normalizeModerationAd(detail));
                            } catch { /* table already refreshed */ }
                        }}
                        onActivate={async (adId) => {
                            await withActionGuard(
                                () => activateAdminAd(adId),
                                `${entityLabel} activated`,
                                `Failed to activate ${entityLabel}`
                            );
                            try {
                                const detail = await fetchAdminAdDetail(adId);
                                setViewAd(normalizeModerationAd(detail));
                            } catch { /* table already refreshed */ }
                        }}
                        onBlockSeller={async (sellerId) => {
                            await withActionGuard(
                                () => blockAdminSeller(sellerId, "Blocked via Ads Moderation drawer"),
                                "Seller blocked",
                                "Failed to block seller"
                            );
                        }}
                        onExtend={async (adId) => {
                            await withActionGuard(
                                () => extendAdminListing(adId),
                                `${entityLabel} expiry extended`,
                                `Failed to extend ${entityLabel}`
                            );
                            try {
                                const detail = await fetchAdminAdDetail(adId);
                                setViewAd(normalizeModerationAd(detail));
                            } catch { /* table already refreshed */ }
                        }}
                    />
                </AdminErrorBoundary>
            </div>
        </AdminPageShell>
    );
}
