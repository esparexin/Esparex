import {
    createServiceType,
    deleteServiceType,
    getServiceTypes,
    type ServiceTypeMutationPayload,
    toggleServiceTypeStatus,
    updateServiceType,
} from "@/lib/api/serviceTypes";
import { useAdminCatalogCollection } from "@/hooks/useAdminCatalogCollection";

export interface ServiceType {
    id: string;
    name: string;
    categoryId?: string;
    categoryIds?: string[];
    isActive: boolean;
    createdAt?: string;
}

import { type AdminListPagination } from "@/hooks/useAdminCrudList";

export function useAdminServiceTypes(options?: {
    initialFilters?: Partial<{ search: string; categoryId: string; status: string }>;
    initialPagination?: Partial<AdminListPagination>;
}) {
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
        runAction,
        handleDelete,
        handleCreate,
        handleUpdate,
    } = useAdminCatalogCollection<
        ServiceType,
        { search: string; categoryId: string; status: string },
        ServiceTypeMutationPayload
    >({
        initialFilters: { search: "", categoryId: "all", status: "all" },
        fetchList: getServiceTypes,
        listErrorMessage: "Failed to fetch service types",
        createItem: createServiceType,
        createSuccessMessage: "Service type created",
        createErrorMessage: "Failed to create service type",
        updateItem: updateServiceType,
        updateSuccessMessage: "Service type updated",
        updateErrorMessage: "Failed to update service type",
        deleteItem: deleteServiceType,
        deleteSuccessMessage: "Service type deleted",
        deleteErrorMessage: "Failed to delete service type",
    }, options);

    const handleToggleStatus = async (serviceType: ServiceType) => {
        await runAction(() => toggleServiceTypeStatus(serviceType.id), {
            successMessage: `Service type ${serviceType.isActive ? "deactivated" : "activated"}`,
            errorMessage: "Failed to toggle status",
            onSuccess: () => {
                setServiceTypes((prev) =>
                    prev.map((item) =>
                        item.id === serviceType.id ? { ...item, isActive: !item.isActive } : item
                    )
                );
            },
        });
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
