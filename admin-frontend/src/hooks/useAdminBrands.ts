import { useCallback } from "react";
import { getBrands, deleteBrand, createBrand, updateBrand, approveBrand, rejectBrand, toggleBrandStatus, type BrandData } from "@/lib/api/brands";
import { Brand } from "@/types/brand";
import { useToast } from "@/context/ToastContext";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useAdminCrudList } from "@/hooks/useAdminCrudList";

export function useAdminBrands() {
    const { showToast } = useToast();
    const fetchBrandsPage = useCallback(
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

            const response = await getBrands(query);
            if (response.success) {
                const parsed = parseAdminResponse<Brand>(response);
                const items = parsed.items;
                return {
                    items,
                    pagination: parsed.pagination || { page: 1, total: items.length, totalPages: 1 },
                };
            }
            return {
                items: [],
                error: response.message || "Failed to fetch brands",
            };
        },
        []
    );

    const {
        items: brands,
        setItems: setBrands,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchBrands,
    } = useAdminCrudList<Brand, { search: string; categoryId: string; status: string }>({
        initialFilters: {
            search: "",
            categoryId: "all",
            status: "all",
        },
        fetchPage: fetchBrandsPage,
    });

    const extractApiErrorMessage = (err: unknown, fallback: string): string => {
        if (!err || typeof err !== "object") {
            return fallback;
        }

        const candidate = err as {
            message?: unknown;
            payload?: {
                message?: unknown;
                error?: unknown;
                details?: Array<{ field?: unknown; message?: unknown }>;
            };
        };

        const firstDetail = Array.isArray(candidate.payload?.details)
            ? candidate.payload?.details.find((detail) => typeof detail?.message === "string")
            : null;

        if (firstDetail && typeof firstDetail.message === "string") {
            return firstDetail.message;
        }

        if (typeof candidate.payload?.message === "string" && candidate.payload.message.length > 0) {
            return candidate.payload.message;
        }

        if (typeof candidate.payload?.error === "string" && candidate.payload.error.length > 0) {
            return candidate.payload.error;
        }

        if (typeof candidate.message === "string" && candidate.message.length > 0) {
            return candidate.message;
        }

        return fallback;
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this brand?")) return;
        try {
            const response = await deleteBrand(id);
            if (response.success) {
                showToast("Brand deleted successfully", "success");
                void fetchBrands();
            } else {
                showToast(response.message || "Failed to delete brand", "error");
            }
        } catch (err) {
            showToast(extractApiErrorMessage(err, "Failed to delete brand"), "error");
        }
    };


    const handleCreate = async (data: BrandData) => {
        try {
            const response = await createBrand(data);
            if (response.success) {
                showToast("Brand created successfully", "success");
                void fetchBrands();
                return true;
            } else {
                showToast(response.message || "Failed to create brand", "error");
                return false;
            }
        } catch (err) {
            showToast(extractApiErrorMessage(err, "Failed to create brand"), "error");
            return false;
        }
    };

    const handleUpdate = async (id: string, data: BrandData) => {
        try {
            const response = await updateBrand(id, data);
            if (response.success) {
                showToast("Brand updated successfully", "success");
                void fetchBrands();
                return true;
            } else {
                showToast(response.message || "Failed to update brand", "error");
                return false;
            }
        } catch (err) {
            showToast(extractApiErrorMessage(err, "Failed to update brand"), "error");
            return false;
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const response = await approveBrand(id);
            if (response.success) {
                showToast("Brand approved", "success");
                void fetchBrands();
            } else {
                showToast(response.message || "Failed to approve brand", "error");
            }
        } catch (err) {
            showToast(extractApiErrorMessage(err, "Failed to approve brand"), "error");
        }
    };

    const handleReject = async (id: string, reason: string) => {
        try {
            const response = await rejectBrand(id, reason);
            if (response.success) {
                showToast("Brand rejected", "success");
                void fetchBrands();
            } else {
                showToast(response.message || "Failed to reject brand", "error");
            }
        } catch (err) {
            showToast(extractApiErrorMessage(err, "Failed to reject brand"), "error");
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const response = await toggleBrandStatus(id);
            if (response.success) {
                showToast("Status updated", "success");
                void fetchBrands();
            } else {
                showToast(response.message || "Failed to toggle status", "error");
            }
        } catch (err) {
            showToast(extractApiErrorMessage(err, "Failed to toggle status"), "error");
        }
    };

    return {
        brands,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchBrands,
        handleDelete,
        handleCreate,
        handleUpdate,
        handleApprove,
        handleReject,
        handleToggleStatus,
    };
}
