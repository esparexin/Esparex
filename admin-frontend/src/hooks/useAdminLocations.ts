import { useState, useEffect, useCallback } from "react";
import { getLocations, getDistinctStates, toggleLocationStatus, deleteLocation } from "@/lib/api/locations";
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
            const response = await getDistinctStates();
            if (response.success) {
                const parsed = parseAdminResponse<string>(response);
                setStates(parsed.items);
            }
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

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this location? This action might fail if the location is in use.")) return;
        try {
            const response = await deleteLocation(id);
            if (response.success) {
                setLocations(prev => prev.filter(loc => loc.id !== id));
                showToast("Location deleted successfully", "success");
            } else {
                showToast(response.message || "Failed to delete location", "error");
            }
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete location", "error");
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
        handleDelete
    };
}
