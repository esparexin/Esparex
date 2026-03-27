"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, ShieldAlert, XCircle } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { AdminInlineAlert } from "@/components/ui/AdminInlineAlert";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { useToast } from "@/context/ToastContext";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { ADMIN_UI_ROUTES, readPositiveIntParam, readStringParam } from "@/lib/adminUiRoutes";

type ReportQueueItem = {
    id: string;
    reportId: string;
    reason: string;
    status: string;
    reportedAt?: string;
    reportCount: number;
    isAutoHidden?: boolean;
    ad?: {
        title?: string;
        sellerId?: string;
        status?: string;
    };
};

const REPORT_STATUS_OPTIONS = [
    { value: "all", label: "All Reports" },
    { value: "open", label: "Open" },
    { value: "pending", label: "Pending" },
    { value: "reviewed", label: "Reviewed" },
    { value: "resolved", label: "Resolved" },
    { value: "dismissed", label: "Dismissed" },
];

const normalizeReportItem = (raw: Record<string, unknown>): ReportQueueItem => ({
    id: String(raw.id || raw._id || ""),
    reportId: String(raw.reportId || raw._id || ""),
    reason: String(raw.reason || "Report"),
    status: String(raw.status || "open"),
    reportedAt: typeof raw.reportedAt === "string" ? raw.reportedAt : undefined,
    reportCount: typeof raw.reportCount === "number" ? raw.reportCount : 0,
    isAutoHidden: Boolean(raw.isAutoHidden),
    ad:
        raw.ad && typeof raw.ad === "object"
            ? {
                  title: typeof (raw.ad as Record<string, unknown>).title === "string" ? String((raw.ad as Record<string, unknown>).title) : undefined,
                  sellerId:
                      typeof (raw.ad as Record<string, unknown>).sellerId === "string"
                          ? String((raw.ad as Record<string, unknown>).sellerId)
                          : undefined,
                  status:
                      typeof (raw.ad as Record<string, unknown>).status === "string"
                          ? String((raw.ad as Record<string, unknown>).status)
                          : undefined,
              }
            : undefined,
});

export default function ReportsPage() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    const [items, setItems] = useState<ReportQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("open");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        limit: 20,
    });

    useEffect(() => {
        const requestedStatus = searchParams.get("status");
        const requestedSearch = searchParams.get("search");
        const requestedPage = searchParams.get("page");
        const normalizedStatus = REPORT_STATUS_OPTIONS.some((option) => option.value === requestedStatus)
            ? String(requestedStatus)
            : "open";
        const normalizedSearch = readStringParam(requestedSearch);
        const normalizedPage = readPositiveIntParam(requestedPage, 1);

        setStatus((prev) => (prev === normalizedStatus ? prev : normalizedStatus));
        setSearch((prev) => (prev === normalizedSearch ? prev : normalizedSearch));
        setPage((prev) => (prev === normalizedPage ? prev : normalizedPage));
    }, [searchParams]);

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

    useEffect(() => {
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError("");

            try {
                const query = new URLSearchParams({
                    page: String(page),
                    limit: "20",
                });
                if (status !== "all") {
                    query.set("status", status);
                }
                if (search) {
                    query.set("search", search);
                }

                const response = await adminFetch<unknown>(`${ADMIN_ROUTES.REPORTS}?${query.toString()}`);
                const parsed = parseAdminResponse<Record<string, unknown>>(response);
                setItems(parsed.items.map(normalizeReportItem));
                setPagination({
                    total: parsed.pagination?.total ?? parsed.items.length,
                    pages: parsed.pagination?.pages ?? parsed.pagination?.totalPages ?? 1,
                    limit: parsed.pagination?.limit ?? 20,
                });
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : "Failed to load reports");
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => window.clearTimeout(timer);
    }, [page, search, status]);

    const updateReportStatus = async (reportId: string, nextStatus: "reviewed" | "resolved" | "dismissed") => {
        try {
            await adminFetch(ADMIN_ROUTES.REPORT_STATUS(reportId), {
                method: "PATCH",
                body: { status: nextStatus },
            });
            showToast(`Report marked ${nextStatus}`, "success");
            setItems((prev) =>
                prev.map((item) =>
                    item.reportId === reportId
                        ? {
                              ...item,
                              status: nextStatus,
                          }
                        : item
                )
            );
        } catch (mutationError) {
            showToast(
                mutationError instanceof Error ? mutationError.message : `Failed to mark report ${nextStatus}`,
                "error"
            );
        }
    };

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
                                onClick={() => void updateReportStatus(item.reportId, "reviewed")}
                                className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline"
                            >
                                <AlertCircle size={12} /> Review
                            </button>
                        ) : null}
                        {item.status !== "resolved" ? (
                            <button
                                type="button"
                                onClick={() => void updateReportStatus(item.reportId, "resolved")}
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                            >
                                <CheckCircle2 size={12} /> Resolve
                            </button>
                        ) : null}
                        {item.status !== "dismissed" ? (
                            <button
                                type="button"
                                onClick={() => void updateReportStatus(item.reportId, "dismissed")}
                                className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline"
                            >
                                <XCircle size={12} /> Dismiss
                            </button>
                        ) : null}
                    </div>
                ),
            },
        ],
        [showToast]
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
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search reports by listing title or report note..."
                    status={status}
                    onStatusChange={setStatus}
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
                        onPageChange: setPage,
                    }}
                />
            </div>
        </AdminPageShell>
    );
}
