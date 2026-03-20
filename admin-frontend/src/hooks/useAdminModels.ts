import { useCallback } from "react";
import { getModels, deleteModel, createModel, updateModel } from "@/lib/api/models";
import { Model } from "@/types/model";
import { useToast } from "@/context/ToastContext";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useAdminCrudList } from "@/hooks/useAdminCrudList";

export function useAdminModels() {
    const { showToast } = useToast();
    const fetchModelsPage = useCallback(
        async ({
            filters,
            pagination,
        }: {
            filters: { search: string; brandId: string; categoryId: string; status: string };
            pagination: { page: number; limit: number };
        }) => {
            const query: any = {
                page: pagination.page,
                limit: pagination.limit
            };
            if (filters.search) query.search = filters.search;
            if (filters.brandId !== 'all') query.brandId = filters.brandId;
            if (filters.categoryId !== 'all') query.categoryId = filters.categoryId;
            if (filters.status !== 'all') query.status = filters.status;

            const response = await getModels(query);
            if (response.success) {
                const parsed = parseAdminResponse<Model>(response);
                const items = parsed.items;
                return {
                    items,
                    pagination: parsed.pagination || { page: 1, total: items.length, totalPages: 1 },
                };
            }
            return {
                items: [],
                error: response.message || "Failed to fetch models",
            };
        },
        []
    );

    const {
        items: models,
        setItems: setModels,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchModels,
    } = useAdminCrudList<Model, { search: string; brandId: string; categoryId: string; status: string }>({
        initialFilters: {
            search: "",
            brandId: "all",
            categoryId: "all",
            status: "all",
        },
        fetchPage: fetchModelsPage,
    });

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this model?")) return;
        try {
            const response = await deleteModel(id);
            if (response.success) {
                setModels(prev => prev.filter(m => m.id !== id));
                showToast("Model deleted successfully", "success");
            } else {
                showToast(response.message || "Failed to delete model", "error");
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete model", "error");
        }
    };

    const handleCreate = async (data: any) => {
        try {
            const response = await createModel(data);
            if (response.success) {
                showToast("Model created successfully", "success");
                void fetchModels();
                return true;
            } else {
                showToast(response.message || "Failed to create model", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to create model", "error");
            return false;
        }
    };

    const handleUpdate = async (id: string, data: any) => {
        try {
            const response = await updateModel(id, data);
            if (response.success) {
                showToast("Model updated successfully", "success");
                void fetchModels();
                return true;
            } else {
                showToast(response.message || "Failed to update model", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update model", "error");
            return false;
        }
    };

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
        handleUpdate
    };
}
