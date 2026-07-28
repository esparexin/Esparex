import { useCallback, useEffect, useMemo, useState } from "react";
import {
    createArea,
    createCity,
    createLocation,
    createState,
    getDistinctStates,
    getLocations,
    toggleLocationStatus,
    deleteLocation,
    updateLocation,
} from "@/lib/api/locations";
import { Location, LocationFilters } from "@/types/location";
import { showAdminPopup } from "@/lib/popup/popupEvents";
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

type MutableLocationPayload = Partial<Location> & {
    selectedStateId?: string;
    parentId?: string;
};

const DEFAULT_LIMIT = 20;

function stripLocationFormHelpers(data: MutableLocationPayload): Partial<Location> {
    const { selectedStateId: _s, parentId: _p, ...clean } = data;
    return clean;
}

export function useAdminLocations({
    filters,
    page,
    limit = DEFAULT_LIMIT,
}: UseAdminLocationsOptions) {
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
        void (async () => { await fetchLocations(); })();
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
                showAdminPopup({ type: "error", title: "Error", message: response.message || "Failed to update location status" });
                return;
            }

            await refresh();
            showAdminPopup({ type: "success", title: "Success", message: "Location status updated" });
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed to update location status" });
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
                showAdminPopup({ type: "error", title: "Error", message: response.message || "Failed to create location" });
                return false;
            }

            await refresh();
            showAdminPopup({ type: "success", title: "Success", message: "Location created successfully" });
            return true;
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed to create location" });
            return false;
        }
    };

    const handleUpdate = async (id: string, data: MutableLocationPayload) => {
        try {
            const response = await updateLocation(id, stripLocationFormHelpers(data));
            if (!response.success) {
                showAdminPopup({ type: "error", title: "Error", message: response.message || "Failed to update location" });
                return false;
            }

            await refresh();
            showAdminPopup({ type: "success", title: "Success", message: "Location updated successfully" });
            return true;
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed to update location" });
            return false;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await deleteLocation(id);
            if (!response.success) {
                showAdminPopup({ type: "error", title: "Error", message: response.message || "Failed to delete location" });
                return false;
            }

            await refresh();
            showAdminPopup({ type: "success", title: "Success", message: "Location deleted successfully" });
            return true;
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed to delete location" });
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
        handleDelete,
        handleCreate,
        handleUpdate,
    };
}
