import { createModel, deleteModel, getModels, updateModel, toggleModelStatus, approveModel, rejectModel } from "@/lib/api/models";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";
import type { Model } from "@shared/types";
import { useCallback } from "react";
import { CreateModelDTO, UpdateModelDTO } from "@shared";


export function useAdminModels() {
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
        { search: string; brandId: string; categoryId: string; status: string },
        CreateModelDTO,
        UpdateModelDTO
    >({
        initialFilters: {
            search: "",
            brandId: "all",
            categoryId: "all",
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
    });

    const handleToggleStatus = useCallback(async (id: string) => {
        await runAction(() => toggleModelStatus(id), {
            successMessage: "Model visibility updated",
            errorMessage: "Failed to toggle model status",
            onSuccess: async () => {
                setItems((prev) => prev.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m));
            }
        });
    }, [runAction, setItems]);

    const handleApproveModel = useCallback(async (id: string) => {
        await runAction(() => approveModel(id), {
            successMessage: "Model approved and activated successfully",
            errorMessage: "Failed to approve model",
            onSuccess: async () => {
                setItems((prev) => prev.map((m) => m.id === id ? { ...m, approvalStatus: "approved", isActive: true } : m));
            }
        });
    }, [runAction, setItems]);

    const handleRejectModel = useCallback(async (id: string, reason: string) => {
        await runAction(() => rejectModel(id, reason), {
            successMessage: "Model rejected successfully",
            errorMessage: "Failed to reject model",
            onSuccess: async () => {
                setItems((prev) => prev.map((m) => m.id === id ? { ...m, approvalStatus: "rejected", isActive: false } : m));
            }
        });
    }, [runAction, setItems]);

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
