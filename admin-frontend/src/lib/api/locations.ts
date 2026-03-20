import { adminFetch } from "./adminClient";
import { Location, LocationFilters } from "@/types/location";

const BASE_PATH = "/locations";

export interface Pagination {
    page: number;
    total: number;
    totalPages: number;
}

export const getLocations = async (filters: LocationFilters & { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (filters.search) query.append("search", filters.search);
    if (filters.status && filters.status !== "all") query.append("status", filters.status);
    if (filters.state && filters.state !== "all") query.append("state", filters.state);
    if (filters.level && filters.level !== "all") query.append("level", filters.level);
    if (filters.page) query.append("page", filters.page.toString());
    if (filters.limit) query.append("limit", filters.limit.toString());

    return adminFetch<{ items: Location[]; pagination: Pagination }>(`${BASE_PATH}?${query.toString()}`);
};

export const getDistinctStates = async () => {
    return adminFetch<string[]>(`${BASE_PATH}/states`);
};

export const createLocation = async (data: Partial<Location>) => {
    return adminFetch<Location>(BASE_PATH, {
        method: "POST",
        body: data,
    });
};

export const createState = async (data: Partial<Location> & { name: string }) => {
    return adminFetch<Location>(`${BASE_PATH}/states`, {
        method: "POST",
        body: data,
    });
};

export const createCity = async (data: Partial<Location> & { name: string; stateId: string }) => {
    return adminFetch<Location>(`${BASE_PATH}/cities`, {
        method: "POST",
        body: data,
    });
};

export const createArea = async (data: Partial<Location> & { name: string; cityId: string }) => {
    return adminFetch<Location>(`${BASE_PATH}/areas`, {
        method: "POST",
        body: data,
    });
};

export const updateLocation = async (id: string, data: Partial<Location>) => {
    return adminFetch<Location>(`${BASE_PATH}/${id}`, {
        method: "PUT",
        body: data,
    });
};

export const toggleLocationStatus = async (id: string) => {
    return adminFetch<Location>(`${BASE_PATH}/${id}/toggle`, {
        method: "PATCH",
    });
};

export const deleteLocation = async (id: string) => {
    return adminFetch(`${BASE_PATH}/${id}`, {
        method: "DELETE",
    });
};
