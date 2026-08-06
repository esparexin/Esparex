import {
    approveBrand,
    createBrand,
    deleteBrand,
    getBrands,
    rejectBrand,
    toggleBrandStatus,
    updateBrand,
} from "@/lib/api/brands";
import { CreateBrandDTO, UpdateBrandDTO, Brand } from "@esparex/contracts";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";

import { type AdminListPagination } from "@/hooks/useAdminCrudList";
import { useCatalogMutation } from "./useCatalogMutation";

export function useAdminBrands(options?: {
    initialFilters?: Partial<{ search: string; categoryId: string; status: string }>;
    initialPagination?: Partial<AdminListPagination>;
}) {
    const {
        items: brands,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchBrands,
        runAction,
        handleDelete,
        handleCreate,
        handleUpdate,
    } = useAdminCatalogCollection<
        Brand,
        { search: string; categoryId: string; status: string },
        CreateBrandDTO,
        UpdateBrandDTO
    >({
        initialFilters: {
            search: "",
            categoryId: "all",
            status: "all",
        },
        fetchList: getBrands,
        listErrorMessage: "Failed to fetch brands",
        createItem: createBrand,
        createSuccessMessage: "Brand created successfully",
        createErrorMessage: "Failed to create brand",
        updateItem: updateBrand,
        updateSuccessMessage: "Brand updated successfully",
        updateErrorMessage: "Failed to update brand",
        deleteItem: deleteBrand,
        deleteSuccessMessage: "Brand deleted successfully",
        deleteErrorMessage: "Failed to delete brand",
        deleteStrategy: "refresh",
        initialPagination: { limit: 50 },
    }, options);

    const { handleApprove, handleReject, handleToggleStatus } = useCatalogMutation({
        approveFn: approveBrand,
        rejectFn: rejectBrand,
        toggleStatusFn: toggleBrandStatus,
        fetchItems: fetchBrands,
        runAction,
        entityName: "Brand",
    });

    return {
        brands,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchBrands,
        handleDelete,
        handleCreate,
        handleUpdate,
        handleApprove,
        handleReject,
        handleToggleStatus,
    };
}
