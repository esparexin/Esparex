import { useState, useEffect, useCallback } from "react";
import { getLocations, getDistinctStates, toggleLocationStatus, togglePopularStatus, deleteLocation, createState, createCity, createArea, updateLocation, createLocation } from "@/lib/api/locations";
import { Location, LocationFilters } from "@/types/location";
import { useToast } from "@/context/ToastContext";
import { useAdminCrudList } from "@/hooks/useAdminCrudList";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";

export function useAdminLocations() {
    const { showToast } = useToast();
    const [states, setStates] = useState<string[]>([]);
    const fetchLocationsPage = useCallback(
        async ({
            filters,
            pagination,
        }: {
            filters: LocationFilters;
            pagination: { page: number; limit: number };
        }) => {
            const response = await getLocations({ ...filters, page: pagination.page, limit: pagination.limit });
            if (response.success) {
                const parsed = parseAdminResponse<Location>(response);
                return {
                    items: parsed.items,
                    pagination: parsed.pagination || { page: 1, limit: 20, total: parsed.items.length, totalPages: 1 },
                };
            }
            return {
                items: [],
                error: response.message || "Failed to fetch locations",
            };
        },
        []
    );

    const {
        items: locations,
        setItems: setLocations,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchLocations,
    } = useAdminCrudList<Location, LocationFilters>({
        initialFilters: {
            search: "",
            status: "all",
            state: "all",
            level: "all",
        },
        fetchPage: fetchLocationsPage,
    });

    const fetchStates = useCallback(async () => {
        try {
            const states = await getDistinctStates();
            setStates(states);
        } catch (err) {
            console.error("Failed to fetch states", err);
        }
    }, []);

    useEffect(() => {
        void fetchStates();
    }, [fetchStates]);

    const handleToggleStatus = async (id: string) => {
        try {
            const response = await toggleLocationStatus(id);
            if (response.success) {
                setLocations(prev => prev.map(loc => loc.id === id ? { ...loc, isActive: !loc.isActive } : loc));
                showToast("Location status updated", "success");
            } else {
                showToast(response.message || "Failed to toggle status", "error");
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to toggle status", "error");
        }
    };
 
    const handleTogglePopular = async (id: string) => {
        try {
            const response = await togglePopularStatus(id);
            if (response.success) {
                setLocations(prev => prev.map(loc => loc.id === id ? { ...loc, isPopular: !loc.isPopular } : loc));
                showToast("Location popular status updated", "success");
            } else {
                showToast(response.message || "Failed to toggle popular status", "error");
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to toggle popular status", "error");
        }
    };
 
    const handleCreate = async (data: Partial<Location>) => {
        try {
            let response;
            const level = data.level;

            if (level === "state") {
                response = await createState({ name: data.name || "", ...data });
            } else if (level === "city") {
                const parentId = data.parentId;
                if (!parentId) throw new Error("State (Parent) is required for City creation");
                response = await createCity({ name: data.name || "", stateId: parentId, ...data });
            } else if (level === "area") {
                const parentId = data.parentId;
                if (!parentId) throw new Error("City (Parent) is required for Area creation");
                response = await createArea({ name: data.name || "", cityId: parentId, ...data });
            } else {
                response = await createLocation(data);
            }

            if (response.success && response.data) {
                setLocations(prev => [response.data!, ...prev]);
                showToast("Location created successfully", "success");
                return true;
            } else {
                showToast(response.message || "Failed to create location", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to create location", "error");
            return false;
        }
    };

    const handleUpdate = async (id: string, data: Partial<Location>) => {
        try {
            const response = await updateLocation(id, data);
            if (response.success && response.data) {
                setLocations(prev => prev.map(loc => loc.id === id ? { ...loc, ...response.data } : loc));
                showToast("Location updated successfully", "success");
                return true;
            } else {
                showToast(response.message || "Failed to update location", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update location", "error");
            return false;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this location? This action might fail if the location is in use.")) return;
        try {
            const response = await deleteLocation(id);
            if (response.success) {
                setLocations(prev => prev.filter(loc => loc.id !== id));
                showToast("Location deleted successfully", "success");
                return true;
            } else {
                showToast(response.message || "Failed to delete location", "error");
                return false;
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete location", "error");
            return false;
        }
    };

    return {
        locations,
        states,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        setPage,
        refresh: fetchLocations,
        handleToggleStatus,
        handleTogglePopular,
        handleDelete,
        handleCreate,
        handleUpdate
    };
}
