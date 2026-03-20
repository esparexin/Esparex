import { useCallback } from "react";
import { getSpareParts, deleteSparePart, createSparePart, updateSparePart } from "@/lib/api/sparePartCatalog";
import { ISparePartAdmin } from "@/types/sparePartCatalog";
import { useToast } from "@/context/ToastContext";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useAdminCrudList } from "@/hooks/useAdminCrudList";

export function useAdminSpareParts() {
    const { showToast } = useToast();
    const fetchPartsPage = useCallback(
        async ({
            filters,
            pagination,
        }: {
            filters: { search: string; categoryId: string; status: string };
            pagination: { page: number; limit: number };
        }) => {
            const query: any = {
                page: pagination.page,
                limit: pagination.limit
            };
            if (filters.search) query.search = filters.search;
            if (filters.categoryId !== 'all') query.categoryId = filters.categoryId;
            if (filters.status !== 'all') query.status = filters.status;

            const response = await getSpareParts(query);
            if (response.success) {
                const parsed = parseAdminResponse<ISparePartAdmin>(response);
                const items = parsed.items;
                return {
                    items,
                    pagination: parsed.pagination || { page: 1, total: items.length, totalPages: 1 },
                };
            }
            return {
                items: [],
                error: response.message || "Failed to fetch spare parts catalog",
            };
        },
        []
    );

    const {
        items: parts,
        setItems: setParts,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchParts,
    } = useAdminCrudList<ISparePartAdmin, { search: string; categoryId: string; status: string }>({
        initialFilters: {
            search: "",
            categoryId: "all",
            status: "all",
        },
        fetchPage: fetchPartsPage,
    });

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this catalog item?")) return;
        try {
            const response = await deleteSparePart(id);
            if (response.success) {
                setParts(prev => prev.filter(p => p.id !== id));
                showToast("Part deleted successfully", "success");
            } else {
                showToast(response.message || "Failed to delete part", "error");
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete part", "error");
        }
    };

    const handleCreate = async (data: any) => {
        try {
            const response = await createSparePart(data);
            if (response.success) {
                showToast("Part created successfully", "success");
                void fetchParts();
                return true;
            } else {
                showToast(response.message || "Failed to create part", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to create part", "error");
            return false;
        }
    };

    const handleUpdate = async (id: string, data: any) => {
        try {
            const response = await updateSparePart(id, data);
            if (response.success) {
                showToast("Part updated successfully", "success");
                void fetchParts();
                return true;
            } else {
                showToast(response.message || "Failed to update part", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update part", "error");
            return false;
        }
    };

    return {
        parts,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchParts,
        handleDelete,
        handleCreate,
        handleUpdate
    };
}
