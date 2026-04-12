import {
    approveBrand,
    createBrand,
    deleteBrand,
    getBrands,
    rejectBrand,
    toggleBrandStatus,
    updateBrand,
} from "@/lib/api/brands";
import { CreateBrandDTO, UpdateBrandDTO } from "@shared/schemas/catalog.schema";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";
import { Brand } from "@/types/brand";

export function useAdminBrands() {
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
    });

    const handleApprove = async (id: string) => {
        await runAction(() => approveBrand(id), {
            successMessage: "Brand approved",
            errorMessage: "Failed to approve brand",
            onSuccess: async () => {
                await fetchBrands();
            },
        });
    };

    const handleReject = async (id: string, reason: string) => {
        await runAction(() => rejectBrand(id, reason), {
            successMessage: "Brand rejected",
            errorMessage: "Failed to reject brand",
            onSuccess: async () => {
                await fetchBrands();
            },
        });
    };

    const handleToggleStatus = async (id: string) => {
        await runAction(() => toggleBrandStatus(id), {
            successMessage: "Status updated",
            errorMessage: "Failed to toggle status",
            onSuccess: async () => {
                await fetchBrands();
            },
        });
    };

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
