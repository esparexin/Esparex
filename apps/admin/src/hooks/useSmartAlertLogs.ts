import { useState, useCallback } from "react";
import { fetchSmartAlertLogs } from "@/lib/api/smartAlerts";
import { mapErrorToMessage } from "@/lib/mapErrorToMessage";
import type { SmartAlertDeliveryLogDTO } from "@shared/schemas/smartAlert.schema";

interface LogFilters {
    page: number;
    limit: number;
}

export function useSmartAlertLogs() {
    const [logs, setLogs] = useState<SmartAlertDeliveryLogDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        limit: 50,
    });

    const getLogs = useCallback(async (filters: LogFilters) => {
        setLoading(true);
        setError("");
        try {
            const { items, pagination: nextPagination } = await fetchSmartAlertLogs({
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
            setError(mapErrorToMessage(err, "Failed to load smart alert logs"));
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        logs,
        loading,
        error,
        pagination,
        getLogs
    };
}
