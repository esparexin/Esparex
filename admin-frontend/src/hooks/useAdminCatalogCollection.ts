import { useCallback } from "react";
import { useToast } from "@/context/ToastContext";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useAdminCrudList, type AdminListPagination } from "@/hooks/useAdminCrudList";

type FilterValue = string | number | boolean | null | undefined;
type AdminCollectionFilters = Record<string, FilterValue>;

type AdminResponseLike = {
    success?: boolean;
    message?: string;
    payload?: {
        message?: unknown;
        error?: unknown;
        details?: Array<{ field?: unknown; message?: unknown }>;
    };
};

type MutationOptions = {
    successMessage: string;
    errorMessage: string;
    onSuccess?: () => Promise<void> | void;
};

interface UseAdminCatalogCollectionOptions<
    T extends { id: string },
    F extends AdminCollectionFilters,
    CreatePayload,
    UpdatePayload = CreatePayload,
> {
    initialFilters: F;
    fetchList: (query: any) => Promise<AdminResponseLike>;
    listErrorMessage: string;
    createItem: (data: CreatePayload) => Promise<AdminResponseLike>;
    createSuccessMessage: string;
    createErrorMessage: string;
    updateItem: (id: string, data: UpdatePayload) => Promise<AdminResponseLike>;
    updateSuccessMessage: string;
    updateErrorMessage: string;
    deleteItem: (id: string) => Promise<AdminResponseLike>;
    deleteSuccessMessage: string;
    deleteErrorMessage: string;
    deleteConfirmMessage?: string;
    deleteStrategy?: "filter" | "refresh";
    initialPagination?: Partial<AdminListPagination>;
}

import { AdminApiError } from "@/lib/api/adminClient";

export function extractAdminApiErrorMessage(error: unknown, fallback: string): string {
    return AdminApiError.resolveMessage(error, fallback);
}

export function buildAdminListQuery<F extends AdminCollectionFilters>(
    filters: F,
    pagination: { page: number; limit: number }
) {
    const query: Record<string, string | number | boolean> = {
        page: pagination.page,
        limit: pagination.limit,
    };

    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || value === "all") {
            return;
        }

        query[key] = value;
    });

    return query;
}

export async function fetchAdminCatalogPage<T, F extends AdminCollectionFilters>({
    filters,
    pagination,
    fetchList,
    errorMessage,
}: {
    filters: F;
    pagination: { page: number; limit: number };
    fetchList: (query: any) => Promise<AdminResponseLike>;
    errorMessage: string;
}) {
    const response = await fetchList(buildAdminListQuery(filters, pagination));
    if (!response.success) {
        return {
            items: [] as T[],
            error: response.message || errorMessage,
        };
    }

    const parsed = parseAdminResponse<T>(response);
    const items = parsed.items;

    return {
        items,
        pagination: parsed.pagination || {
            page: pagination.page,
            limit: pagination.limit,
            total: items.length,
            totalPages: 1,
        },
    };
}

export function useAdminCatalogCollection<
    T extends { id: string },
    F extends AdminCollectionFilters,
    CreatePayload,
    UpdatePayload = CreatePayload,
>({
    initialFilters,
    fetchList,
    listErrorMessage,
    createItem,
    createSuccessMessage,
    createErrorMessage,
    updateItem,
    updateSuccessMessage,
    updateErrorMessage,
    deleteItem,
    deleteSuccessMessage,
    deleteErrorMessage,
    deleteConfirmMessage,
    deleteStrategy = "filter",
    initialPagination,
}: UseAdminCatalogCollectionOptions<T, F, CreatePayload, UpdatePayload>) {
    const { showToast } = useToast();

    const fetchPage = useCallback(
        (params: { filters: F; pagination: AdminListPagination }) =>
            fetchAdminCatalogPage<T, F>({
                filters: params.filters,
                pagination: params.pagination,
                fetchList,
                errorMessage: listErrorMessage,
            }),
        [fetchList, listErrorMessage]
    );

    const {
        items,
        setItems,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh,
    } = useAdminCrudList<T, F>({
        initialFilters,
        fetchPage,
        initialPagination,
    });

    const runAction = useCallback(
        async (
            operation: () => Promise<AdminResponseLike>,
            { successMessage, errorMessage, onSuccess }: MutationOptions
        ) => {
            try {
                const response = await operation();
                if (!response.success) {
                    showToast(response.message || errorMessage, "error");
                    return false;
                }

                showToast(successMessage, "success");
                if (onSuccess) {
                    await onSuccess();
                }
                return true;
            } catch (error) {
                showToast(extractAdminApiErrorMessage(error, errorMessage), "error");
                return false;
            }
        },
        [showToast]
    );

    const handleDelete = useCallback(
        async (id: string) => {
            if (deleteConfirmMessage && !window.confirm(deleteConfirmMessage)) {
                return false;
            }

            return runAction(() => deleteItem(id), {
                successMessage: deleteSuccessMessage,
                errorMessage: deleteErrorMessage,
                onSuccess: async () => {
                    if (deleteStrategy === "filter") {
                        setItems((prev) => prev.filter((item) => item.id !== id));
                        return;
                    }

                    await refresh();
                },
            });
        },
        [
            deleteConfirmMessage,
            deleteErrorMessage,
            deleteItem,
            deleteStrategy,
            deleteSuccessMessage,
            refresh,
            runAction,
            setItems,
        ]
    );

    const handleCreate = useCallback(
        async (data: CreatePayload) =>
            runAction(() => createItem(data), {
                successMessage: createSuccessMessage,
                errorMessage: createErrorMessage,
                onSuccess: async () => {
                    await refresh();
                },
            }),
        [createErrorMessage, createItem, createSuccessMessage, refresh, runAction]
    );

    const handleUpdate = useCallback(
        async (id: string, data: UpdatePayload) =>
            runAction(() => updateItem(id, data), {
                successMessage: updateSuccessMessage,
                errorMessage: updateErrorMessage,
                onSuccess: async () => {
                    await refresh();
                },
            }),
        [refresh, runAction, updateErrorMessage, updateItem, updateSuccessMessage]
    );

    return {
        items,
        setItems,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh,
        runAction,
        handleDelete,
        handleCreate,
        handleUpdate,
    };
}
