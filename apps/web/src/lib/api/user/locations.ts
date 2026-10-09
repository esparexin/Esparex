import { apiClient } from "@/lib/api/client";
import type { EsparexRequestConfig } from "@/lib/api/client";
import { toApiResult } from "@/lib/api/result";
import { API_ROUTES } from "@esparex/shared";
export type { Location } from "@esparex/contracts";

import { Location } from "@esparex/contracts";
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
        // Do NOT add a _ts cache-buster here. The backend sets
        // Cache-Control: public, max-age=300 via publicCacheControl(),
        // and a unique query param per request defeats that caching,
        // causing 4s+ Nominatim calls on every geocode. The backend
        // cache is intentional — location data is stable for minutes.
        // (Removed 2026-10-07: was causing duplicate 4s requests.)
        params: { lat, lng },
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


