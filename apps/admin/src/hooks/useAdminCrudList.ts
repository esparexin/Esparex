import { useCallback, useEffect, useRef, useState } from "react";

export type AdminListPagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

type AdminListResult<T> = {
    items: T[];
    pagination?: Partial<AdminListPagination> & { pages?: number };
    error?: string | null;
};

interface UseAdminCrudListOptions<T, F extends object> {
    initialFilters: F;
    fetchPage: (params: {
        filters: F;
        pagination: AdminListPagination;
    }) => Promise<AdminListResult<T>>;
    initialPagination?: Partial<AdminListPagination>;
}

const DEFAULT_PAGINATION: AdminListPagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
};

export function useAdminCrudList<T, F extends object>({
    initialFilters,
    fetchPage,
    initialPagination,
}: UseAdminCrudListOptions<T, F>) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<AdminListPagination>({
        ...DEFAULT_PAGINATION,
        ...initialPagination,
    });
    const [filters, setFiltersState] = useState<F>(initialFilters);
    const isFirstMount = useRef(true);

    // Reset to page 1 whenever filters change (skip the initial mount)
    const setFilters = useCallback((updater: React.SetStateAction<F>) => {
        if (!isFirstMount.current) {
            setPagination(prev => ({ ...prev, page: 1 }));
        }
        setFiltersState(updater);
    }, []);

    useEffect(() => {
        isFirstMount.current = false;
    }, []);

    const page = pagination.page;
    const limit = pagination.limit;

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchPage({
                filters: filters,
                pagination: { page, limit, total: 0, totalPages: 0 },
            });
            
            setItems(result.items);

            const nextPagination = result.pagination;
            if (nextPagination) {
                setPagination((prev) => {
                    const newPage = nextPagination.page ?? prev.page;
                    const newLimit = nextPagination.limit ?? prev.limit;
                    const newTotal = nextPagination.total ?? result.items.length;
                    const newTotalPages = nextPagination.totalPages ?? nextPagination.pages ?? prev.totalPages;

                    if (
                        prev.page === newPage &&
                        prev.limit === newLimit &&
                        prev.total === newTotal &&
                        prev.totalPages === newTotalPages
                    ) {
                        return prev;
                    }

                    return { ...prev, page: newPage, limit: newLimit, total: newTotal, totalPages: newTotalPages };
                });
            } else {
                setPagination((prev) => {
                    const newTotal = result.items.length;
                    const newTotalPages = prev.totalPages || 1;
                    
                    if (prev.total === newTotal && prev.totalPages === newTotalPages) {
                        return prev;
                    }
                    
                    return { ...prev, total: newTotal, totalPages: newTotalPages };
                });
            }

            if (result.error) {
                setError(result.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }, [fetchPage, filters, page, limit]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return {
        items,
        setItems,
        loading,
        error,
        pagination,
        setPagination,
        filters,
        setFilters,
        setPage: (page: number) => setPagination((prev) => ({ ...prev, page })),
        refresh,
    };
}
