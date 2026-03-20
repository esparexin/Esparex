import { useCallback } from "react";
import { getScreenSizes, createScreenSize, updateScreenSize, deleteScreenSize } from "@/lib/api/screenSizes";
import { ScreenSize } from "@/types/screenSize";
import { useToast } from "@/context/ToastContext";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useAdminCrudList } from "@/hooks/useAdminCrudList";

export function useAdminScreenSizes() {
    const { showToast } = useToast();

    const fetchPage = useCallback(
        async ({
            filters,
            pagination,
        }: {
            filters: { search: string; categoryId: string };
            pagination: { page: number; limit: number };
        }) => {
            const query: Record<string, string | number> = {
                page: pagination.page,
                limit: pagination.limit,
            };
            if (filters.search) query.search = filters.search;
            if (filters.categoryId !== "all") query.categoryId = filters.categoryId;

            const response = await getScreenSizes(query);
            if (response.success) {
                const parsed = parseAdminResponse<ScreenSize>(response);
                const items = parsed.items;
                return {
                    items,
                    pagination: parsed.pagination || { page: 1, total: items.length, totalPages: 1 },
                };
            }
            return {
                items: [],
                error: response.message || "Failed to fetch screen sizes",
            };
        },
        []
    );

    const {
        items: screenSizes,
        setItems: setScreenSizes,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchScreenSizes,
    } = useAdminCrudList<ScreenSize, { search: string; categoryId: string }>({
        initialFilters: { search: "", categoryId: "all" },
        fetchPage,
    });

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this screen size?")) return;
        try {
            const response = await deleteScreenSize(id);
            if (response.success) {
                setScreenSizes(prev => prev.filter(item => item.id !== id));
                showToast("Screen size deleted successfully", "success");
            } else {
                showToast(response.message || "Failed to delete screen size", "error");
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete screen size", "error");
        }
    };

    const handleCreate = async (data: Record<string, unknown>) => {
        try {
            const response = await createScreenSize(data);
            if (response.success) {
                showToast("Screen size created successfully", "success");
                void fetchScreenSizes();
                return true;
            } else {
                showToast(response.message || "Failed to create screen size", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to create screen size", "error");
            return false;
        }
    };

    const handleUpdate = async (id: string, data: Record<string, unknown>) => {
        try {
            const response = await updateScreenSize(id, data);
            if (response.success) {
                showToast("Screen size updated successfully", "success");
                void fetchScreenSizes();
                return true;
            } else {
                showToast(response.message || "Failed to update screen size", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update screen size", "error");
            return false;
        }
    };

    return {
        screenSizes,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchScreenSizes,
        handleDelete,
        handleCreate,
        handleUpdate,
    };
}
