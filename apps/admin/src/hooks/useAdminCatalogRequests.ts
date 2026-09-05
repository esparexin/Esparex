import { useCallback } from "react";
import {
    listAdminCatalogRequests,
    approveAdminCatalogRequest,
    rejectAdminCatalogRequest,
    deleteAdminCatalogRequest,
    markAdminCatalogRequestDuplicate,
    bulkRejectAdminCatalogRequests,
    bulkMarkAdminCatalogRequestsDuplicate,
    bulkDeleteAdminCatalogRequests,
    type CatalogRequestItem,
    type CatalogRequestStatus,
} from "@/lib/api/catalogRequests";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";
import { useCatalogMutation } from "./useCatalogMutation";

export function useAdminCatalogRequests(options?: {
    initialFilters?: { search: string; status: string };
    initialPagination?: { page: number; limit: number };
}) {
    const fetchList = useCallback(
        (query: Record<string, string | number | boolean>) => {
            return listAdminCatalogRequests({
                q: query.search as string,
                status: query.status as "all" | CatalogRequestStatus,
                page: query.page as number,
                limit: query.limit as number,
            });
        },
        []
    );

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
        Record<string, never>
    >({
        initialFilters: options?.initialFilters || {
            search: "",
            status: "all",
        },
        fetchList,
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

    const { handleApprove, handleReject, handleDelete } = useCatalogMutation({
        approveFn: approveAdminCatalogRequest,
        rejectFn: (id, reason) => rejectAdminCatalogRequest(id, { rejectionReason: reason }),
        deleteFn: deleteAdminCatalogRequest,
        fetchItems: refresh,
        runAction,
        entityName: "Request",
    });

    const handleMarkDuplicate = async (id: string, duplicateOfEntityId: string) => {
        await runAction(() => markAdminCatalogRequestDuplicate(id, { duplicateOfEntityId }), {
            successMessage: "Request marked as duplicate",
            errorMessage: "Failed to mark as duplicate",
            onSuccess: async () => {
                await refresh();
            },
        });
    };

    const handleBulkReject = async (ids: string[], reason: string) => {
        await runAction(() => bulkRejectAdminCatalogRequests({ requestIds: ids, reason }), {
            successMessage: "Selected requests rejected",
            errorMessage: "Failed to reject selected requests",
            onSuccess: async () => {
                await refresh();
            },
        });
    };

    const handleBulkMarkDuplicate = async (ids: string[], duplicateOfId: string) => {
        await runAction(() => bulkMarkAdminCatalogRequestsDuplicate({ requestIds: ids, duplicateOfId }), {
            successMessage: "Selected requests marked as duplicate",
            errorMessage: "Failed to mark selected requests as duplicate",
            onSuccess: async () => {
                await refresh();
            },
        });
    };

    const handleBulkDelete = async (ids: string[]) => {
        await runAction(() => bulkDeleteAdminCatalogRequests({ requestIds: ids }), {
            successMessage: "Selected requests deleted",
            errorMessage: "Failed to delete selected requests",
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
        handleDelete,
        handleMarkDuplicate,
        handleBulkReject,
        handleBulkMarkDuplicate,
        handleBulkDelete,
    };
}
