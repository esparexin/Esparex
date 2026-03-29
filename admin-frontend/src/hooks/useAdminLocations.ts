import { useCallback, useEffect, useMemo, useState } from "react";
import {
    createArea,
    createCity,
    createLocation,
    createState,
    getDistinctStates,
    getLocations,
    toggleLocationStatus,
    togglePopularStatus,
    deleteLocation,
    updateLocation,
} from "@/lib/api/locations";
import { Location, LocationFilters } from "@/types/location";
import { useToast } from "@/context/ToastContext";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";

type UseAdminLocationsOptions = {
    filters: LocationFilters;
    page: number;
    limit?: number;
};

type PaginationState = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

const DEFAULT_LIMIT = 20;

type MutableLocationPayload = Partial<Location> & {
    parentStateId?: string;
    latitude?: string | number;
    longitude?: string | number;
    country?: string;
    name?: string;
    parentId?: string;
    level?: Location["level"];
};

const stripLocationFormHelpers = (data: MutableLocationPayload): Partial<Location> => {
    const { parentStateId: _parentStateId, ...rest } = data;
    const normalized = { ...rest } as MutableLocationPayload;

    if (normalized.parentId === "") {
        delete normalized.parentId;
    }
    if (normalized.country === "") {
        delete normalized.country;
    }

    return normalized;
};

export function useAdminLocations({
    filters,
    page,
    limit = DEFAULT_LIMIT,
}: UseAdminLocationsOptions) {
    const { showToast } = useToast();
    const [locations, setLocations] = useState<Location[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationState>({
        page,
        limit,
        total: 0,
        totalPages: 1,
    });

    const requestKey = useMemo(
        () => JSON.stringify({ filters, page, limit }),
        [filters, page, limit]
    );

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getLocations({
                ...filters,
                page,
                limit,
            });

            if (!response.success) {
                setLocations([]);
                setError(response.message || "Failed to fetch locations");
                return;
            }

            const parsed = parseAdminResponse<Location>(response);
            const nextPagination = parsed.pagination;

            setLocations(parsed.items);
            setPagination({
                page: nextPagination?.page ?? page,
                limit: nextPagination?.limit ?? limit,
                total: nextPagination?.total ?? parsed.items.length,
                totalPages: nextPagination?.totalPages ?? nextPagination?.pages ?? 1,
            });
        } catch (err) {
            setLocations([]);
            setError(err instanceof Error ? err.message : "Failed to fetch locations");
        } finally {
            setLoading(false);
        }
    }, [filters, limit, page]);

    useEffect(() => {
        void fetchLocations();
    }, [fetchLocations, requestKey]);

    useEffect(() => {
        let active = true;

        const loadStates = async () => {
            try {
                const nextStates = await getDistinctStates();
                if (active) {
                    setStates(nextStates);
                }
            } catch {
                if (active) {
                    setStates([]);
                }
            }
        };

        void loadStates();

        return () => {
            active = false;
        };
    }, []);

    const refresh = useCallback(async () => {
        await fetchLocations();
    }, [fetchLocations]);

    const handleToggleStatus = async (id: string) => {
        try {
            const response = await toggleLocationStatus(id);
            if (!response.success) {
                showToast(response.message || "Failed to update location status", "error");
                return;
            }

            await refresh();
            showToast("Location status updated", "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update location status", "error");
        }
    };

    const handleTogglePopular = async (id: string) => {
        try {
            const response = await togglePopularStatus(id);
            if (!response.success) {
                showToast(response.message || "Failed to update popularity", "error");
                return;
            }

            await refresh();
            showToast("Location popularity updated", "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update popularity", "error");
        }
    };

    const handleCreate = async (data: MutableLocationPayload) => {
        try {
            const payload = stripLocationFormHelpers(data);
            let response;

            if (payload.level === "state") {
                response = await createState({ name: payload.name || "", ...payload });
            } else if (payload.level === "city") {
                if (!payload.parentId) {
                    throw new Error("State is required for city creation");
                }
                response = await createCity({
                    name: payload.name || "",
                    stateId: payload.parentId,
                    ...payload,
                });
            } else if (payload.level === "area") {
                if (!payload.parentId) {
                    throw new Error("City is required for area creation");
                }
                response = await createArea({
                    name: payload.name || "",
                    cityId: payload.parentId,
                    ...payload,
                });
            } else {
                response = await createLocation(payload);
            }

            if (!response.success) {
                showToast(response.message || "Failed to create location", "error");
                return false;
            }

            await refresh();
            showToast("Location created successfully", "success");
            return true;
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to create location", "error");
            return false;
        }
    };

    const handleUpdate = async (id: string, data: MutableLocationPayload) => {
        try {
            const response = await updateLocation(id, stripLocationFormHelpers(data));
            if (!response.success) {
                showToast(response.message || "Failed to update location", "error");
                return false;
            }

            await refresh();
            showToast("Location updated successfully", "success");
            return true;
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update location", "error");
            return false;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this location? This action might fail if the location is in use.")) {
            return false;
        }

        try {
            const response = await deleteLocation(id);
            if (!response.success) {
                showToast(response.message || "Failed to delete location", "error");
                return false;
            }

            await refresh();
            showToast("Location deleted successfully", "success");
            return true;
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
        refresh,
        handleToggleStatus,
        handleTogglePopular,
        handleDelete,
        handleCreate,
        handleUpdate,
    };
}
