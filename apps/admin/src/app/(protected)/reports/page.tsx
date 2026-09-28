"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, ExternalLink, Eye, ShieldAlert, XCircle, DataTable, type ColumnDef } from "@esparex/ui";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { AdminActionMenu } from "@/components/layout/AdminActionMenu";
import { ViewAdModal } from "@/components/moderation/ViewAdModal";
import { normalizeModerationAd } from "@/components/moderation/normalizeModerationAd";
import type { ModerationItem } from "@/components/moderation/moderationTypes";
import { fetchAdminAdDetail } from "@/lib/api/moderation";
import { ADMIN_UI_ROUTES, readPositiveIntParam, readStringParam } from "@/lib/adminUiRoutes";
import { useModerationReports, type ReportQueueItem } from "@/hooks/useModerationReports";
import { REPORT_STATUS } from "@esparex/contracts";

const REPORT_STATUS_OPTIONS = [
    { value: "all", label: "All Reports" },
    { value: REPORT_STATUS.OPEN, label: "Open" },
    { value: REPORT_STATUS.PENDING, label: "Pending" },
    { value: REPORT_STATUS.REVIEWED, label: "Reviewed" },
    { value: REPORT_STATUS.RESOLVED, label: "Resolved" },
    { value: REPORT_STATUS.DISMISSED, label: "Dismissed" },
];

export default function ReportsPage() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const {
        items,
        loading,
        isMutating,
        error,
        pagination,
        fetchReports,
        updateReportStatus,
        resolveReportAction,
    } = useModerationReports();

    const [searchInput, setSearchInput] = useState("");
    const [viewItem, setViewItem] = useState<ReportQueueItem | null>(null);
    const [viewAd, setViewAd] = useState<ModerationItem | null>(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState("");
    const [isViewOpen, setIsViewOpen] = useState(false);

    const requestedStatus = searchParams.get("status");
    const requestedSearch = readStringParam(searchParams.get("q") ?? searchParams.get("search"));
    const requestedPage = readPositiveIntParam(searchParams.get("page"), 1);

    const status = REPORT_STATUS_OPTIONS.some((option) => option.value === requestedStatus)
        ? (requestedStatus as string)
        : "open";
    const page = requestedPage;
    const search = requestedSearch;

    useEffect(() => {
        void (async () => { await Promise.resolve(); setSearchInput(search || ""); })();
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchReports({
                status,
                q: search,
                page,
                limit: 20,
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchReports, status, search, page]);

    useEffect(() => {
        const nextUrl = ADMIN_UI_ROUTES.reports({
            status: status !== "open" ? status : "open",
            q: search || undefined,
            page: page > 1 ? page : undefined,
        });
        const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
        if (nextUrl !== currentUrl) {
            void router.replace(nextUrl, { scroll: false });
        }
    }, [page, pathname, router, search, searchParams, status]);

    // Cleanup: search sync from input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput === (search || "")) return;
            const nextUrl = ADMIN_UI_ROUTES.reports({
                status,
                q: searchInput || undefined,
            });
            void router.replace(nextUrl, { scroll: false });
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput, search, status, router]);

    const handleOpenView = useCallback(async (item: ReportQueueItem) => {
        setViewItem(item);
        setIsViewOpen(true);
        setViewLoading(true);
        setViewError("");
        setViewAd(null);

        try {
            const rawListing = await fetchAdminAdDetail(item.id);
            const normalized = normalizeModerationAd(rawListing);
            setViewAd(normalized);
        } catch (detailErr) {
            if (item.ad?.title) {
                const fallbackAd: ModerationItem = {
                    id: item.id,
                    title: item.ad.title,
                    description: "Archived or deleted listing. Details taken from report snapshot.",
                    price: 0,
                    currency: "INR",
                    categoryName: "General",
                    status: (item.ad.status as ModerationItem["status"]) || "rejected",
                    images: [],
                    sellerName: "Unknown",
                    sellerId: item.ad.sellerId,
                    createdAt: item.reportedAt || new Date().toISOString(),
                    isDeleted: true,
                    reportCount: item.reportCount,
                    fraudScore: 0,
                };
                setViewAd(fallbackAd);
                setViewError("Listing details could not be retrieved from active catalog (listing may be archived or removed). Report snapshot is shown.");
            } else {
                setViewError(detailErr instanceof Error ? detailErr.message : "Failed to load listing details");
            }
        } finally {
            setViewLoading(false);
        }
    }, []);

    const handleTakeDownAndResolve = useCallback(async (item: ReportQueueItem) => {
        const res = await resolveReportAction(item.reportId, "take_down");
        if (res.success) {
            setIsViewOpen(false);
        }
    }, [resolveReportAction]);

    const handleDismiss = useCallback(async (item: ReportQueueItem) => {
        const res = await resolveReportAction(item.reportId, "dismiss");
        if (res.success) {
            setIsViewOpen(false);
        }
    }, [resolveReportAction]);

    const handleReview = useCallback(async (item: ReportQueueItem) => {
        const res = await updateReportStatus(item.reportId, REPORT_STATUS.REVIEWED);
        if (res.success && viewItem?.reportId === item.reportId) {
            setViewItem((prev) => (prev ? { ...prev, status: REPORT_STATUS.REVIEWED } : null));
        }
    }, [updateReportStatus, viewItem?.reportId]);

    const columns = useMemo<ColumnDef<ReportQueueItem>[]>(
        () => [
            {
                header: "Listing",
                cell: (item) => (
                    <div className="space-y-1">
                        <button
                            type="button"
                            onClick={() => void handleOpenView(item)}
                            className="text-left font-semibold text-foreground hover:text-primary hover:underline transition-colors block cursor-pointer"
                        >
                            {item.ad?.title || "Unknown listing"}
                        </button>
                        <div className="text-tiny font-mono text-foreground-subtle">{item.id}</div>
                    </div>
                ),
            },
            {
                header: "Reason",
                cell: (item) => (
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground-secondary">{item.reason}</div>
                        {item.isAutoHidden ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-tiny font-semibold text-amber-700">
                                <ShieldAlert size={10} /> Auto-hidden
                            </span>
                        ) : null}
                    </div>
                ),
            },
            {
                header: "Status",
                cell: (item) => (
                    <div className="space-y-1">
                        <span className="inline-flex rounded-full bg-muted px-2 py-1 text-tiny font-bold uppercase tracking-[0.12em] text-foreground-secondary">
                            {item.status}
                        </span>
                        <div className="text-xs text-foreground-subtle">{item.reportCount} reports</div>
                    </div>
                ),
            },
            {
                header: "Reported",
                cell: (item) => (
                    <div className="text-xs text-foreground-tertiary">
                        {item.reportedAt ? new Date(item.reportedAt).toLocaleString() : "Unknown"}
                    </div>
                ),
            },
            {
                header: "Actions",
                cell: (item) => (
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            type="button"
                            onClick={() => void handleOpenView(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-caption font-semibold text-foreground-secondary hover:bg-muted hover:text-foreground transition-colors shadow-xs"
                            aria-label={`View ad ${item.ad?.title || item.id}`}
                        >
                            <Eye size={14} />
                            <span>View</span>
                        </button>
                        <AdminActionMenu
                            items={[
                                {
                                    label: "View & Validate",
                                    icon: Eye,
                                    onClick: () => void handleOpenView(item),
                                },
                                {
                                    label: "Inspect in Catalog",
                                    icon: ExternalLink,
                                    onClick: () => router.push(ADMIN_UI_ROUTES.ads({ status: "all", q: item.ad?.title || item.id })),
                                },
                                ...(item.status === REPORT_STATUS.OPEN || item.status === REPORT_STATUS.PENDING
                                    ? [{
                                        label: "Mark Reviewed",
                                        icon: AlertCircle,
                                        onClick: () => void handleReview(item),
                                        disabled: isMutating,
                                      }]
                                    : []),
                                ...(item.status !== REPORT_STATUS.RESOLVED
                                    ? [{
                                        label: "Take Down & Resolve",
                                        icon: CheckCircle2,
                                        onClick: () => void handleTakeDownAndResolve(item),
                                        disabled: isMutating,
                                      }]
                                    : []),
                                ...(item.status !== REPORT_STATUS.DISMISSED
                                    ? [{
                                        label: "Dismiss Report",
                                        icon: XCircle,
                                        onClick: () => void handleDismiss(item),
                                        variant: "danger" as const,
                                        disabled: isMutating,
                                      }]
                                    : []),
                            ]}
                        />
                    </div>
                ),
            },
        ],
        [handleDismiss, handleOpenView, handleReview, handleTakeDownAndResolve, isMutating, router]
    );

    return (
        <AdminPageShell
            title="Reports Queue"
            description="Review reported listings, moderate outcomes, and resolve open abuse signals."
            headerVariant="compact"
        >
            <div className="space-y-6">
                <AdminModuleTabs
                    tabs={[
                        { label: "Open", href: ADMIN_UI_ROUTES.reports({ status: "open" }) },
                        { label: "Pending", href: ADMIN_UI_ROUTES.reports({ status: "pending" }) },
                        { label: "Reviewed", href: ADMIN_UI_ROUTES.reports({ status: "reviewed" }) },
                        { label: "Resolved", href: ADMIN_UI_ROUTES.reports({ status: "resolved" }) },
                        { label: "Dismissed", href: ADMIN_UI_ROUTES.reports({ status: "dismissed" }) },
                        { label: "All", href: ADMIN_UI_ROUTES.reports({ status: "all" }) },
                    ]}
                />

                <AdminFilterToolbar
                    search={searchInput}
                    onSearchChange={setSearchInput}
                    searchPlaceholder="Search reports by listing title or report note..."
                    status={status}
                    onStatusChange={(val) => {
                        const nextUrl = ADMIN_UI_ROUTES.reports({ status: val, q: searchInput || undefined });
                        void router.replace(nextUrl, { scroll: false });
                    }}
                    statusOptions={REPORT_STATUS_OPTIONS}
                />

                {error ? (
                    <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                ) : null}

                <DataTable
                    data={items}
                    columns={columns}
                    isLoading={loading}
                    emptyMessage="No reports matched the current queue filters"
                    pagination={{
                        currentPage: page,
                        totalPages: pagination.pages,
                        totalItems: pagination.total,
                        pageSize: pagination.limit,
                        onPageChange: (newPage) => {
                            const nextUrl = ADMIN_UI_ROUTES.reports({ status, q: search, page: newPage });
                            void router.replace(nextUrl, { scroll: false });
                        },
                    }}
                />

                <ViewAdModal
                    open={isViewOpen}
                    ad={viewAd}
                    loading={viewLoading}
                    error={viewError}
                    onClose={() => setIsViewOpen(false)}
                    reportContext={
                        viewItem
                            ? {
                                  reportId: viewItem.reportId,
                                  reason: viewItem.reason,
                                  reportCount: viewItem.reportCount,
                                  reportedAt: viewItem.reportedAt,
                                  isAutoHidden: viewItem.isAutoHidden,
                                  status: viewItem.status,
                                  onTakeDown: () => handleTakeDownAndResolve(viewItem),
                                  onDismiss: () => handleDismiss(viewItem),
                                  onReview: () => handleReview(viewItem),
                              }
                            : undefined
                    }
                />
            </div>
        </AdminPageShell>
    );
}
