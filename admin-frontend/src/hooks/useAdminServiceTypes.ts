import { useCallback } from "react";
import {
    getServiceTypes,
    createServiceType,
    updateServiceType,
    toggleServiceTypeStatus,
    deleteServiceType,
} from "@/lib/api/serviceTypes";
import { useToast } from "@/context/ToastContext";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useAdminCrudList } from "@/hooks/useAdminCrudList";

export interface ServiceType {
    id: string;
    name: string;
    categoryId?: string; // Legacy
    categoryIds?: string[];
    isActive: boolean;
    createdAt?: string;
}

export function useAdminServiceTypes() {
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

            const response = await getServiceTypes(query);
            if (response.success) {
                const parsed = parseAdminResponse<ServiceType>(response);
                const items = parsed.items;
                return {
                    items,
                    pagination: parsed.pagination || { page: 1, total: items.length, totalPages: 1 },
                };
            }
            return {
                items: [],
                error: response.message || "Failed to fetch service types",
            };
        },
        []
    );

    const {
        items: serviceTypes,
        setItems: setServiceTypes,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchServiceTypes,
    } = useAdminCrudList<ServiceType, { search: string; categoryId: string }>({
        initialFilters: { search: "", categoryId: "all" },
        fetchPage,
    });

    const handleToggleStatus = async (serviceType: ServiceType) => {
        try {
            const response = await toggleServiceTypeStatus(serviceType.id);
            if (response.success) {
                setServiceTypes(prev =>
                    prev.map(st =>
                        st.id === serviceType.id ? { ...st, isActive: !st.isActive } : st
                    )
                );
                showToast(
                    `Service type ${serviceType.isActive ? "deactivated" : "activated"}`,
                    "success"
                );
            } else {
                showToast(response.message || "Failed to toggle status", "error");
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to toggle status", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this service type? This cannot be undone.")) return;
        try {
            const response = await deleteServiceType(id);
            if (response.success) {
                setServiceTypes(prev => prev.filter(st => st.id !== id));
                showToast("Service type deleted", "success");
            } else {
                showToast(response.message || "Failed to delete service type", "error");
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete", "error");
        }
    };

    const handleCreate = async (data: Record<string, unknown>) => {
        try {
            const response = await createServiceType(data);
            if (response.success) {
                showToast("Service type created", "success");
                void fetchServiceTypes();
                return true;
            } else {
                showToast(response.message || "Failed to create service type", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to create service type", "error");
            return false;
        }
    };

    const handleUpdate = async (id: string, data: Record<string, unknown>) => {
        try {
            const response = await updateServiceType(id, data);
            if (response.success) {
                showToast("Service type updated", "success");
                void fetchServiceTypes();
                return true;
            } else {
                showToast(response.message || "Failed to update service type", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update service type", "error");
            return false;
        }
    };

    return {
        serviceTypes,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchServiceTypes,
        handleToggleStatus,
        handleDelete,
        handleCreate,
        handleUpdate,
    };
}
