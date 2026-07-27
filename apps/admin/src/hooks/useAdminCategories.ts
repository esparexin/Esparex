import { mapErrorToMessage } from '@/lib/mapErrorToMessage';
import { useCallback, useState } from "react";
import { getCategories, toggleCategoryStatus, deleteCategory, createCategory, updateCategory } from "@/lib/api/categories";
import type { Category } from "@esparex/contracts";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useAdminCrudList, AdminListPagination } from "@/hooks/useAdminCrudList";
import { ListingTypeValue } from "@esparex/contracts";

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
            if (filters.status !== 'all') query.isActive = (filters.status === 'active' || filters.status === 'live');

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

    const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

    const handleToggleStatus = async (id: string) => {
        if (isTogglingId) return; // prevent double-click
        setIsTogglingId(id);
        try {
            const response = await toggleCategoryStatus(id);
            if (response.success) {
                setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, isActive: !cat.isActive } : cat));
                showAdminPopup({ type: "success", title: "Success", message: "Category status updated" });
            } else {
                showAdminPopup({ type: "error", title: "Error", message: response.message || "Failed to update status" });
            }
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: mapErrorToMessage(err, "Failed to update status") });
        } finally {
            setIsTogglingId(null);
        }
    };

    // Confirmation is handled by the UI (CatalogDeleteConfirmModal).
    // This function is called only after the user explicitly confirms.
    const handleDelete = async (id: string) => {
        try {
            const response = await deleteCategory(id);
            if (response.success) {
                setCategories(prev => prev.filter(cat => cat.id !== id));
                showAdminPopup({ type: "success", title: "Success", message: "Category deleted successfully" });
            } else {
                showAdminPopup({ type: "error", title: "Error", message: response.message || "Failed to delete category" });
            }
        } catch (err: unknown) {
            const anyErr = err as { status?: number; payload?: { dependencies?: Record<string, number> } };
            if (anyErr?.status === 409 && anyErr?.payload?.dependencies) {
                const deps = anyErr.payload.dependencies;
                const details = [
                    (deps.brands ?? 0) > 0 ? `${deps.brands} Brand(s)` : null,
                    (deps.models ?? 0) > 0 ? `${deps.models} Model(s)` : null,
                    (deps.spareParts ?? 0) > 0 ? `${deps.spareParts} Spare Part(s)` : null,
                    (deps.serviceTypes ?? 0) > 0 ? `${deps.serviceTypes} Service Type(s)` : null,
                    (deps.ads ?? 0) > 0 ? `${deps.ads} Ad(s)` : null,
                ].filter(Boolean).join(", ");
                showAdminPopup({ type: "error", title: "Error", message: `Cannot delete: Associated with ${details}. Deactivate it instead.` });
            } else {
                showAdminPopup({ type: "error", title: "Error", message: mapErrorToMessage(err, "Failed to delete category") });
            }
        }
    };

    const handleCreate = async (data: CategoryMutationPayload) => {
        try {
            const response = await createCategory(data);
            if (response.success) {
                showAdminPopup({ type: "success", title: "Success", message: "Category created successfully" });
                void fetchCategories();
                return true;
            } else {
                showAdminPopup({ type: "error", title: "Error", message: response.message || "Failed to create category" });
                return false;
            }
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: mapErrorToMessage(err, "Failed to create category") });
            return false;
        }
    };

    const handleUpdate = async (id: string, data: CategoryMutationPayload) => {
        try {
            const response = await updateCategory(id, data);
            if (response.success) {
                showAdminPopup({ type: "success", title: "Success", message: "Category updated successfully" });
                void fetchCategories();
                return true;
            } else {
                showAdminPopup({ type: "error", title: "Error", message: response.message || "Failed to update category" });
                return false;
            }
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: mapErrorToMessage(err, "Failed to update category") });
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
        handleUpdate,
        isTogglingId,
    };
}
