import {
    createSparePart,
    deleteSparePart,
    getSpareParts,
    updateSparePart,
    toggleSparePartStatus,
} from "@/lib/api/sparePartCatalog";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";
import type { AdminListPagination } from "@/hooks/useAdminCrudList";
import type { SparePart, CreateSparePartDTO, UpdateSparePartDTO } from "@shared/schemas/catalog.schema";
import { useState, useCallback } from "react";

interface UseAdminSparePartsOptions {
    initialFilters?: { search: string; categoryId: string; isActive: string };
    initialPagination?: Partial<AdminListPagination>;
}

export function useAdminSpareParts(options: UseAdminSparePartsOptions = {}) {
    const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

    const {
        items: parts,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchParts,
        handleDelete: baseHandleDelete,
        handleCreate,
        handleUpdate,
        runAction,
    } = useAdminCatalogCollection<
        SparePart,
        { search: string; categoryId: string; isActive: string },
        CreateSparePartDTO,
        UpdateSparePartDTO
    >({
        initialFilters: options.initialFilters ?? {
            search: "",
            categoryId: "all",
            isActive: "all",
        },
        initialPagination: options.initialPagination,
        fetchList: getSpareParts,
        listErrorMessage: "Failed to fetch spare parts catalog",
        createItem: createSparePart,
        createSuccessMessage: "Part created successfully",
        createErrorMessage: "Failed to create part",
        updateItem: updateSparePart,
        updateSuccessMessage: "Part updated successfully",
        updateErrorMessage: "Failed to update part",
        deleteItem: deleteSparePart,
        deleteSuccessMessage: "Part deleted successfully",
        deleteErrorMessage: "Failed to delete part",
        deleteConfirmMessage: "Are you sure you want to delete this catalog item?",
    });

    const toggleStatus = useCallback(
        async (id: string, currentStatus: boolean) => {
            if (isTogglingId) return;
            setIsTogglingId(id);

            await runAction(() => toggleSparePartStatus(id), {
                successMessage: `Part marked ${!currentStatus ? "active" : "inactive"} successfully`,
                errorMessage: "Failed to toggle part status",
                onSuccess: async () => {
                    await fetchParts();
                },
            });

            setIsTogglingId(null);
        },
        [fetchParts, isTogglingId, runAction]
    );

    // Bypass default handleDelete since we want to handle the modal externally in the page component
    const handleDelete = useCallback(
        async (id: string) => {
            await runAction(() => deleteSparePart(id), {
                successMessage: "Part deleted successfully",
                errorMessage: "Failed to delete part",
                onSuccess: async () => {
                    await fetchParts();
                },
            });
        },
        [fetchParts, runAction]
    );

    return {
        parts,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchParts,
        handleDelete,
        handleCreate,
        handleUpdate,
        toggleStatus,
        isTogglingId,
    };
}
