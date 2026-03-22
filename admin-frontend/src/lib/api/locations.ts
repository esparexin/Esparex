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

export const getDistinctStates = async (): Promise<string[]> => {
    const env = await adminFetch<string[]>(`${BASE_PATH}/states`);
    return env.data ?? [];
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

export interface LocationAnalyticsFilters {
    city?: string;
    state?: string;
    district?: string;
    country?: string;
}

export interface LocationAnalyticsData {
    totalLocations: number;
    totalAds: number;
    totalUsers: number;
    topCities: Array<{ _id: string; city: string; state: string; adsCount: number }>;
    adsByState: Array<{ _id: string; count: number }>;
    hotZones: Array<{ _id: string; city: string; state: string; popularityScore: number; isHotZone: boolean }>;
    monthlyTrends?: Array<{ month: string; ads: number; users: number }>;
}

export const getLocationAnalytics = async (filters: LocationAnalyticsFilters = {}): Promise<LocationAnalyticsData> => {
    const query = new URLSearchParams();
    if (filters.city) query.append("city", filters.city);
    if (filters.state) query.append("state", filters.state);
    if (filters.district) query.append("district", filters.district);
    if (filters.country) query.append("country", filters.country);
    const qs = query.toString();
    const env = await adminFetch<LocationAnalyticsData>(`${BASE_PATH}/analytics${qs ? `?${qs}` : ""}`);
    return env.data!;
};

export interface Geofence {
    id: string;
    name: string;
    type: "Polygon";
    color: string;
    isActive: boolean;
    createdAt?: string;
}

export const getGeofences = async (): Promise<Geofence[]> => {
    const env = await adminFetch<Geofence[]>(`/geofences`);
    return env.data ?? [];
};

export const toggleGeofenceStatus = async (id: string): Promise<Geofence> => {
    const env = await adminFetch<Geofence>(`/geofences/${id}/toggle`, { method: "PATCH" });
    return env.data!;
};

export const deleteGeofence = async (id: string) => {
    return adminFetch(`/geofences/${id}`, { method: "DELETE" });
};
