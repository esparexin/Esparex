import {
    createSparePart,
    deleteSparePart,
    getSpareParts,
    updateSparePart,
    type SparePartData,
} from "@/lib/api/sparePartCatalog";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";
import type { AdminListPagination } from "@/hooks/useAdminCrudList";
import { ISparePartAdmin } from "@/types/sparePartCatalog";

interface UseAdminSparePartsOptions {
    initialFilters?: { search: string; categoryId: string; isActive: string };
    initialPagination?: Partial<AdminListPagination>;
}

export function useAdminSpareParts(options: UseAdminSparePartsOptions = {}) {
    const {
        items: parts,
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
    } = useAdminCatalogCollection<
        ISparePartAdmin,
        { search: string; categoryId: string; isActive: string },
        SparePartData
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
    };
}
