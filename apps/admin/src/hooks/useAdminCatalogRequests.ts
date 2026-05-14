import {
    listAdminCatalogRequests,
    approveAdminCatalogRequest,
    rejectAdminCatalogRequest,
    markAdminCatalogRequestDuplicate,
    type CatalogRequestItem,
} from "@/lib/api/catalogRequests";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";

export function useAdminCatalogRequests(options?: {
    initialFilters?: { search: string; status: string };
    initialPagination?: { page: number; limit: number };
}) {
    const {
        items: requests,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh,
        runAction,
    } = useAdminCatalogCollection<
        CatalogRequestItem,
        { search: string; status: string },
        any
    >({
        initialFilters: options?.initialFilters || {
            search: "",
            status: "all",
        },
        fetchList: (query) => {
            return listAdminCatalogRequests({
                q: query.search as string,
                status: query.status as any,
                page: query.page as number,
                limit: query.limit as number,
            });
        },
        listErrorMessage: "Failed to fetch catalog requests",
        createItem: async () => ({ success: false, message: "Not implemented" }),
        createSuccessMessage: "",
        createErrorMessage: "",
        updateItem: async () => ({ success: false, message: "Not implemented" }),
        updateSuccessMessage: "",
        updateErrorMessage: "",
        deleteItem: async () => ({ success: false, message: "Not implemented" }),
        deleteSuccessMessage: "",
        deleteErrorMessage: "",
        initialPagination: options?.initialPagination,
    });

    const handleApprove = async (id: string) => {
        await runAction(() => approveAdminCatalogRequest(id), {
            successMessage: "Request approved",
            errorMessage: "Failed to approve request",
            onSuccess: async () => {
                await refresh();
            },
        });
    };

    const handleReject = async (id: string, reason: string) => {
        await runAction(() => rejectAdminCatalogRequest(id, { rejectionReason: reason }), {
            successMessage: "Request rejected",
            errorMessage: "Failed to reject request",
            onSuccess: async () => {
                await refresh();
            },
        });
    };

    const handleMarkDuplicate = async (id: string, duplicateOfEntityId: string) => {
        await runAction(() => markAdminCatalogRequestDuplicate(id, { duplicateOfEntityId }), {
            successMessage: "Request marked as duplicate",
            errorMessage: "Failed to mark as duplicate",
            onSuccess: async () => {
                await refresh();
            },
        });
    };

    return {
        requests,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh,
        handleApprove,
        handleReject,
        handleMarkDuplicate,
    };
}
