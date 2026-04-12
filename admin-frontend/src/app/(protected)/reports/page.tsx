"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, ShieldAlert, XCircle, Loader2 } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { AdminInlineAlert } from "@/components/ui/AdminInlineAlert";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { ADMIN_UI_ROUTES, readPositiveIntParam, readStringParam } from "@/lib/adminUiRoutes";
import { useModerationReports, type ReportQueueItem } from "@/hooks/useModerationReports";

const REPORT_STATUS_OPTIONS = [
    { value: "all", label: "All Reports" },
    { value: "open", label: "Open" },
    { value: "pending", label: "Pending" },
    { value: "reviewed", label: "Reviewed" },
    { value: "resolved", label: "Resolved" },
    { value: "dismissed", label: "Dismissed" },
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
        updateReportStatus
    } = useModerationReports();

    const [searchInput, setSearchInput] = useState("");

    const requestedStatus = searchParams.get("status");
    const requestedSearch = readStringParam(searchParams.get("search"));
    const requestedPage = readPositiveIntParam(searchParams.get("page"), 1);

    const status = REPORT_STATUS_OPTIONS.some((option) => option.value === requestedStatus)
        ? (requestedStatus as string)
        : "open";
    const page = requestedPage;
    const search = requestedSearch;

    useEffect(() => {
        setSearchInput(search || "");
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchReports({
                status,
                search,
                page,
                limit: 20,
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchReports, status, search, page]);

    useEffect(() => {
        const nextUrl = ADMIN_UI_ROUTES.reports({
            status: status !== "open" ? status : "open",
            search: search || undefined,
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
                search: searchInput || undefined,
            });
            void router.replace(nextUrl, { scroll: false });
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput, search, status, router]);

    const columns = useMemo<ColumnDef<ReportQueueItem>[]>(
        () => [
            {
                header: "Listing",
                cell: (item) => (
                    <div className="space-y-1">
                        <div className="font-semibold text-slate-900">{item.ad?.title || "Unknown listing"}</div>
                        <div className="text-[10px] font-mono text-slate-400">{item.id}</div>
                    </div>
                ),
            },
            {
                header: "Reason",
                cell: (item) => (
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-700">{item.reason}</div>
                        {item.isAutoHidden ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
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
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700">
                            {item.status}
                        </span>
                        <div className="text-xs text-slate-400">{item.reportCount} reports</div>
                    </div>
                ),
            },
            {
                header: "Reported",
                cell: (item) => (
                    <div className="text-xs text-slate-500">
                        {item.reportedAt ? new Date(item.reportedAt).toLocaleString() : "Unknown"}
                    </div>
                ),
            },
            {
                header: "Actions",
                cell: (item) => (
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={ADMIN_UI_ROUTES.ads({ status: "all", search: item.ad?.title || item.id })}
                            className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
                        >
                            <Eye size={12} /> Inspect
                        </Link>
                        {item.status === "open" || item.status === "pending" ? (
                            <button
                                type="button"
                                disabled={isMutating}
                                onClick={() => void updateReportStatus(item.reportId, "reviewed")}
                                className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline disabled:opacity-50"
                            >
                                <AlertCircle size={12} /> Review
                            </button>
                        ) : null}
                        {item.status !== "resolved" ? (
                            <button
                                type="button"
                                disabled={isMutating}
                                onClick={() => void updateReportStatus(item.reportId, "resolved")}
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline disabled:opacity-50"
                            >
                                <CheckCircle2 size={12} /> Resolve
                            </button>
                        ) : null}
                        {item.status !== "dismissed" ? (
                            <button
                                type="button"
                                disabled={isMutating}
                                onClick={() => void updateReportStatus(item.reportId, "dismissed")}
                                className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
                            >
                                <XCircle size={12} /> Dismiss
                            </button>
                        ) : null}
                        {isMutating && <Loader2 size={12} className="animate-spin text-slate-400" />}
                    </div>
                ),
            },
        ],
        [isMutating, updateReportStatus]
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
                        const nextUrl = ADMIN_UI_ROUTES.reports({ status: val, search: searchInput || undefined });
                        void router.replace(nextUrl, { scroll: false });
                    }}
                    statusOptions={REPORT_STATUS_OPTIONS}
                />

                <AdminInlineAlert message={error} />

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
                            const nextUrl = ADMIN_UI_ROUTES.reports({ status, search, page: newPage });
                            void router.replace(nextUrl, { scroll: false });
                        },
                    }}
                />
            </div>
        </AdminPageShell>
    );
}
