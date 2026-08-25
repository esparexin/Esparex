import { createModel, deleteModel, getModels, updateModel, toggleModelStatus, approveModel, rejectModel } from "@/lib/api/models";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";
import { Model, CreateModelDTO, UpdateModelDTO } from "@esparex/contracts";


import { type AdminListPagination } from "@/hooks/useAdminCrudList";
import { useCatalogMutation } from "./useCatalogMutation";

export function useAdminModels(options?: {
    initialFilters?: Partial<{ search: string; brandId: string; categoryId: string; parentModelId: string; variantModelId: string; status: string }>;
    initialPagination?: Partial<AdminListPagination>;
}) {
    const {
        items: models,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchModels,
        handleDelete,
        handleCreate,
        handleUpdate,
        runAction,
        setItems
    } = useAdminCatalogCollection<
        Model,
        { search: string; brandId: string; categoryId: string; parentModelId: string; variantModelId: string; status: string },
        CreateModelDTO,
        UpdateModelDTO
    >({
        initialFilters: {
            search: "",
            brandId: "all",
            categoryId: "all",
            parentModelId: "all",
            variantModelId: "all",
            status: "all",
        },
        fetchList: getModels,
        listErrorMessage: "Failed to fetch models",
        createItem: createModel,
        createSuccessMessage: "Model created successfully",
        createErrorMessage: "Failed to create model",
        updateItem: updateModel,
        updateSuccessMessage: "Model updated successfully",
        updateErrorMessage: "Failed to update model",
        deleteItem: deleteModel,
        deleteSuccessMessage: "Model deleted successfully",
        deleteErrorMessage: "Failed to delete model",
    }, options);

    const { handleApprove: handleApproveModel, handleReject: handleRejectModel, handleToggleStatus } = useCatalogMutation({
        approveFn: approveModel,
        rejectFn: rejectModel,
        toggleStatusFn: toggleModelStatus,
        runAction,
        entityName: "Model",
        onApproveSuccess: (id) => {
            setItems((prev) => prev.map((m) => m.id === id ? { ...m, approvalStatus: "approved", isActive: true } : m));
        },
        onRejectSuccess: (id) => {
            setItems((prev) => prev.map((m) => m.id === id ? { ...m, approvalStatus: "rejected", isActive: false } : m));
        },
        onToggleSuccess: (id) => {
            setItems((prev) => prev.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m));
        }
    });

    return {
        models,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchModels,
        handleDelete,
        handleCreate,
        handleUpdate,
        handleToggleStatus,
        handleApproveModel,
        handleRejectModel,
    };
}
