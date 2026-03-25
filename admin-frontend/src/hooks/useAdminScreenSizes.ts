import { createScreenSize, deleteScreenSize, getScreenSizes, updateScreenSize } from "@/lib/api/screenSizes";
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
        deleteConfirmMessage: "Are you sure you want to delete this screen size?",
    });

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
