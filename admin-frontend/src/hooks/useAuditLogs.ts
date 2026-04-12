import { useState, useCallback } from "react";
import { fetchAuditLogs } from "@/lib/api/auditLogs";
import { mapErrorToMessage } from "@/lib/mapErrorToMessage";
import type { AdminLog } from "@/types/audit";

interface AuditLogFilters {
    search?: string;
    action?: string;
    page: number;
    limit: number;
}

export function useAuditLogs() {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        limit: 50,
    });

    const getAuditLogs = useCallback(async (filters: AuditLogFilters) => {
        setLoading(true);
        setError("");
        try {
            const { items, pagination: nextPagination } = await fetchAuditLogs({
                search: filters.search ?? "",
                action: filters.action ?? "all",
                page: filters.page,
                limit: filters.limit,
            });
            setLogs(items);
            setPagination({
                total: nextPagination.total,
                pages: nextPagination.pages,
                limit: nextPagination.limit,
            });
        } catch (err) {
            setError(mapErrorToMessage(err, "Failed to load audit logs"));
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        logs,
        loading,
        error,
        pagination,
        getAuditLogs
    };
}
