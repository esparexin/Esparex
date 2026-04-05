import { apiClient } from "@/lib/api/client";
import type { EsparexRequestConfig } from "@/lib/api/client";
import { toApiResult } from "@/lib/api/result";
import { API_ROUTES } from "@/lib/api/routes";
export type { Location } from '@shared/types/Location';
import type { Location } from '@shared/types/Location';

/* -------------------------------------------------------------------------- */
/* SEARCH LOCATIONS (TEXT SEARCH)                                             */
/* -------------------------------------------------------------------------- */

export const searchLocations = async (
    query: string
): Promise<Location[]> => {
    const { data: result } = await toApiResult<Location[]>(
        apiClient.get(API_ROUTES.USER.LOCATIONS, {
            params: { q: query },
            skipHealthCheck: true,
        })
    );

    return Array.isArray(result) ? result : [];
};

export const lookupPincode = async (
    pincode: string
): Promise<Location | null> => {
    const normalizedPincode = String(pincode || "").trim();
    if (!/^\d{6}$/.test(normalizedPincode)) {
        return null;
    }

    const { data: result } = await toApiResult<Location>(
        apiClient.get(API_ROUTES.USER.LOCATIONS_PINCODE(normalizedPincode), {
            skipHealthCheck: true,
        })
    );

    return result || null;
};

/* -------------------------------------------------------------------------- */
/* GPS → REVERSE GEOCODE (PRIMARY, HIGH ACCURACY) [GET]                       */
/* -------------------------------------------------------------------------- */

export const reverseGeocode = async (
    lat: number,
    lng: number
): Promise<Location | null> => {
    const config: EsparexRequestConfig = {
        // Avoid browser-level cache reuse with a timestamped query param.
        // Do not send extra request headers here because cross-origin dev
        // requests from localhost:3000 -> localhost:5001 must stay CORS-safe.
        params: { lat, lng, _ts: Date.now() },
        skipHealthCheck: true,
        silent: true,
    };
    const { data: result } = await toApiResult<Location>(
        apiClient.get(API_ROUTES.USER.LOCATIONS_GEOCODE, config)
    );

    return result;
};

/* -------------------------------------------------------------------------- */
/* HIERARCHY LOOKUPS (STATE -> CITY -> AREA)                                  */
/* -------------------------------------------------------------------------- */

export const getStates = async (): Promise<Location[]> => {
    const { data: result } = await toApiResult<Location[]>(
        apiClient.get(API_ROUTES.USER.LOCATIONS_STATES, {
            skipHealthCheck: true,
        })
    );

    return Array.isArray(result) ? result : [];
};

export const getCitiesByState = async (stateId: string): Promise<Location[]> => {
    const normalizedStateId = String(stateId || '').trim();
    if (!normalizedStateId) return [];

    const { data: result } = await toApiResult<Location[]>(
        apiClient.get(API_ROUTES.USER.LOCATIONS_CITIES, {
            params: { stateId: normalizedStateId },
            skipHealthCheck: true,
        })
    );

    return Array.isArray(result) ? result : [];
};

export const getAreasByCity = async (cityId: string): Promise<Location[]> => {
    const normalizedCityId = String(cityId || '').trim();
    if (!normalizedCityId) return [];

    const { data: result } = await toApiResult<Location[]>(
        apiClient.get(API_ROUTES.USER.LOCATIONS_AREAS, {
            params: { cityId: normalizedCityId },
            skipHealthCheck: true,
        })
    );

    return Array.isArray(result) ? result : [];
};
