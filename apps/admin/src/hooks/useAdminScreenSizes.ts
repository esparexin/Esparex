import { createScreenSize, deleteScreenSize, getScreenSizes, updateScreenSize, toggleScreenSizeStatus } from "@/lib/api/screenSizes";
import { useToast } from "@/context/ToastContext";
import { useCallback } from "react";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";
import { ScreenSize } from "@/types/screenSize";

export function useAdminScreenSizes() {
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
        { search: string; categoryId: string },
        Record<string, unknown>
    >({
        initialFilters: { search: "", categoryId: "all" },
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
    });

    const { showToast } = useToast();

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
