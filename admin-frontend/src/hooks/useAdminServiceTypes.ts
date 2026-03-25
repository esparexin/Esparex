import {
    createServiceType,
    deleteServiceType,
    getServiceTypes,
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

export function useAdminServiceTypes() {
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
        { search: string; categoryId: string },
        Record<string, unknown>
    >({
        initialFilters: { search: "", categoryId: "all" },
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
        deleteConfirmMessage: "Delete this service type? This cannot be undone.",
    });

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
