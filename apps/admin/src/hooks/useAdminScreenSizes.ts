import {
    createScreenSize,
    deleteScreenSize,
    getScreenSizes,
    type ScreenSizeMutationPayload,
    updateScreenSize,
    toggleScreenSizeStatus,
} from "@/lib/api/screenSizes";
import { useCallback } from "react";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";
import { ScreenSize } from "@/types/screenSize";

import { type AdminListPagination } from "@/hooks/useAdminCrudList";

export function useAdminScreenSizes(options?: {
    initialFilters?: Partial<{ search: string; categoryId: string; status: string }>;
    initialPagination?: Partial<AdminListPagination>;
}) {
    const {
        items: screenSizes,
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
        runAction,
        setItems
    } = useAdminCatalogCollection<
        ScreenSize,
        { search: string; categoryId: string; status: string },
        ScreenSizeMutationPayload
    >({
        initialFilters: { search: "", categoryId: "all", status: "all" },
        fetchList: getScreenSizes,
        listErrorMessage: "Failed to fetch screen sizes",
        createItem: createScreenSize,
        createSuccessMessage: "Screen size created successfully",
        createErrorMessage: "Failed to create screen size",
        updateItem: updateScreenSize,
        updateSuccessMessage: "Screen size updated successfully",
        updateErrorMessage: "Failed to update screen size",
        deleteItem: deleteScreenSize,
        deleteSuccessMessage: "Screen size deleted successfully",
        deleteErrorMessage: "Failed to delete screen size",
    }, options);

    const handleToggleStatus = useCallback(async (id: string) => {
        await runAction(() => toggleScreenSizeStatus(id), {
            successMessage: "Screen size status toggled successfully",
            errorMessage: "Failed to toggle screen size status",
            onSuccess: async () => {
                setItems((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !s.isActive } : s));
            }
        });
    }, [runAction, setItems]);

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
        handleToggleStatus,
    };
}
