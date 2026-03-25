import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";

interface UseAdminStatusFilteredListOptions<T> {
    route: string;
    initialStatus: string;
    errorMessage: string;
    normalizeItem: (raw: Record<string, unknown>) => T;
    limit?: number;
}

export function useAdminStatusFilteredList<T>({
    route,
    initialStatus,
    errorMessage,
    normalizeItem,
    limit = 50,
}: UseAdminStatusFilteredListOptions<T>) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    const refresh = async () => {
        setLoading(true);

        try {
            const query = new URLSearchParams({
                status: statusFilter,
                page: "1",
                limit: String(limit),
            }).toString();

            const response = await adminFetch<Record<string, unknown>>(`${route}?${query}`);
            const parsed = parseAdminResponse<Record<string, unknown>>(response);
            setItems(parsed.items.map(normalizeItem));
            setError("");
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, [statusFilter]);

    return {
        items,
        loading,
        error,
        setError,
        statusFilter,
        setStatusFilter,
        refresh,
    };
}
