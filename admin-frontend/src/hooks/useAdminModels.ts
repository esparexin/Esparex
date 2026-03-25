import { createModel, deleteModel, getModels, updateModel, type ModelData } from "@/lib/api/models";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";
import { Model } from "@/types/model";

type ModelMutationData = {
    name: string;
    brandId: string;
    categoryIds: string[];
    status?: Model["status"];
};

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
    } = useAdminCatalogCollection<
        Model,
        { search: string; brandId: string; categoryId: string; status: string },
        ModelMutationData
    >({
        initialFilters: {
            search: "",
            brandId: "all",
            categoryId: "all",
            status: "all",
        },
        fetchList: getModels,
        listErrorMessage: "Failed to fetch models",
        createItem: (data) =>
            createModel({
                ...data,
                categoryId: data.categoryIds[0] || "",
            } as ModelData),
        createSuccessMessage: "Model created successfully",
        createErrorMessage: "Failed to create model",
        updateItem: (id, data) =>
            updateModel(id, {
                ...data,
                categoryId: data.categoryIds[0] || "",
            } as ModelData),
        updateSuccessMessage: "Model updated successfully",
        updateErrorMessage: "Failed to update model",
        deleteItem: deleteModel,
        deleteSuccessMessage: "Model deleted successfully",
        deleteErrorMessage: "Failed to delete model",
        deleteConfirmMessage: "Are you sure you want to delete this model?",
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
    };
}
