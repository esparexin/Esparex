import { createModel, deleteModel, getModels, updateModel, toggleModelStatus } from "@/lib/api/models";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";
import type { Model } from "@shared/types";
import { useToast } from "@/context/ToastContext";
import { useCallback } from "react";
import { CreateModelDTO, UpdateModelDTO } from "@shared/schemas/catalog.schema";


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

    const { showToast } = useToast();

    const handleToggleStatus = useCallback(async (id: string) => {
        await runAction(() => toggleModelStatus(id), {
            successMessage: "Model status toggled successfully",
            errorMessage: "Failed to toggle model status",
            onSuccess: async () => {
                setItems((prev) => prev.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m));
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
    };
}
