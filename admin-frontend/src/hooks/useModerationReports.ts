import { useState, useCallback } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { useToast } from "@/context/ToastContext";

export type ReportQueueItem = {
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

interface ReportFilters {
    status?: string;
    search?: string;
    page: number;
    limit: number;
}

export function useModerationReports() {
    const { showToast } = useToast();
    const [items, setItems] = useState<ReportQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        limit: 20,
    });

    const fetchReports = useCallback(async (filters: ReportFilters) => {
        setLoading(true);
        setError("");

        try {
            const query = new URLSearchParams({
                page: String(filters.page),
                limit: String(filters.limit),
            });
            if (filters.status && filters.status !== "all") {
                query.set("status", filters.status);
            }
            if (filters.search) {
                query.set("search", filters.search);
            }

            const response = await adminFetch<unknown>(`${ADMIN_ROUTES.REPORTS}?${query.toString()}`);
            const parsed = parseAdminResponse<Record<string, unknown>>(response);
            setItems(parsed.items.map(normalizeReportItem));
            setPagination({
                total: parsed.pagination?.total ?? parsed.items.length,
                pages: parsed.pagination?.pages ?? parsed.pagination?.totalPages ?? 1,
                limit: parsed.pagination?.limit ?? filters.limit,
            });
        } catch (fetchError) {
            const msg = fetchError instanceof Error ? fetchError.message : "Failed to load reports";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const updateReportStatus = async (reportId: string, nextStatus: string) => {
        setIsMutating(true);
        try {
            await adminFetch(ADMIN_ROUTES.REPORT_STATUS(reportId), {
                method: "PATCH",
                body: { status: nextStatus },
            });
            showToast(`Report marked ${nextStatus}`, "success");
            setItems((prev) =>
                prev.map((item) =>
                    item.reportId === reportId || item.id === reportId
                        ? { ...item, status: nextStatus }
                        : item
                )
            );
            return { success: true };
        } catch (mutationError) {
            const msg = mutationError instanceof Error ? mutationError.message : `Failed to update report status`;
            showToast(msg, "error");
            return { success: false, error: msg };
        } finally {
            setIsMutating(false);
        }
    };

    return {
        items,
        loading,
        isMutating,
        error,
        pagination,
        fetchReports,
        updateReportStatus
    };
}
