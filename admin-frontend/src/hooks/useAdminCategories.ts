import { useCallback } from "react";
import { getCategories, toggleCategoryStatus, deleteCategory, createCategory, updateCategory } from "@/lib/api/categories";
import { Category } from "@/types/category";
import { useToast } from "@/context/ToastContext";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useAdminCrudList, AdminListPagination } from "@/hooks/useAdminCrudList";
import type { ListingTypeValue } from "@shared/enums/listingType";

interface UseAdminCategoriesOptions {
    initialPagination?: Partial<AdminListPagination>;
    initialFilters?: {
        search: string;
        status: string;
    };
}
type CategoryMutationPayload = {
    name: string;
    isActive?: boolean;
    hasScreenSizes?: boolean;
    listingType?: ListingTypeValue[];
};

export function useAdminCategories(options: UseAdminCategoriesOptions = {}) {
    const { showToast } = useToast();
    const fetchCategoriesPage = useCallback(
        async ({
            filters,
            pagination,
        }: {
            filters: { search: string; status: string };
            pagination: { page: number; limit: number };
        }) => {
            const query: Record<string, string | number | boolean> = {
                page: pagination.page,
                limit: pagination.limit
            };
            if (filters.search) query.search = filters.search;
            if (filters.status !== 'all') query.isActive = filters.status === 'active';

            const response = await getCategories(query);
            if (response.success) {
                const parsed = parseAdminResponse<Category>(response);
                const items = parsed.items;

                return {
                    items,
                    pagination: parsed.pagination || { page: 1, total: items.length, totalPages: 1 },
                };
            }
            return {
                items: [],
                error: response.message || "Failed to fetch categories",
            };
        },
        []
    );

    const {
        items: categories,
        setItems: setCategories,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchCategories,
    } = useAdminCrudList<Category, { search: string; status: string }>({
        initialFilters: options.initialFilters ?? {
            search: "",
            status: "all",
        },
        fetchPage: fetchCategoriesPage,
        initialPagination: options.initialPagination
    });

    const handleToggleStatus = async (id: string) => {
        try {
            const response = await toggleCategoryStatus(id);
            if (response.success) {
                setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, isActive: !cat.isActive } : cat));
                showToast("Category status updated", "success");
            } else {
                showToast(response.message || "Failed to update status", "error");
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update status", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            const response = await deleteCategory(id);
            if (response.success) {
                setCategories(prev => prev.filter(cat => cat.id !== id));
                showToast("Category deleted successfully", "success");
            } else {
                showToast(response.message || "Failed to delete category", "error");
            }
        } catch (err: any) {
            if (err.status === 409 && err.payload?.dependencies) {
                const deps = err.payload.dependencies;
                const details = [
                    deps.brands > 0 ? `${deps.brands} Brand(s)` : null,
                    deps.models > 0 ? `${deps.models} Model(s)` : null,
                    deps.spareParts > 0 ? `${deps.spareParts} Spare Part(s)` : null,
                    deps.serviceTypes > 0 ? `${deps.serviceTypes} Service Type(s)` : null,
                    deps.ads > 0 ? `${deps.ads} Ad(s)` : null,
                ].filter(Boolean).join(", ");

                showToast(`Cannot delete: Associated with ${details}. Deactivate it instead?`, "error");
            } else {
                showToast(err instanceof Error ? err.message : "Failed to delete category", "error");
            }
        }
    };

    const handleCreate = async (data: CategoryMutationPayload) => {
        try {
            const response = await createCategory(data);
            if (response.success) {
                showToast("Category created successfully", "success");
                void fetchCategories();
                return true;
            } else {
                showToast(response.message || "Failed to create category", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to create category", "error");
            return false;
        }
    };

    const handleUpdate = async (id: string, data: CategoryMutationPayload) => {
        try {
            const response = await updateCategory(id, data);
            if (response.success) {
                showToast("Category updated successfully", "success");
                void fetchCategories();
                return true;
            } else {
                showToast(response.message || "Failed to update category", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update category", "error");
            return false;
        }
    };

    return {
        categories,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchCategories,
        handleToggleStatus,
        handleDelete,
        handleCreate,
        handleUpdate
    };
}
