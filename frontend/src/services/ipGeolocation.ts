/**
 * IP-based Geolocation Service — Backend Proxy Version
 *
 * Routes through /api/v1/locations/ip-locate so the ipapi.co
 * API key stays on the server and is never exposed to the browser.
 *
 * Persistence is managed by LocationContext under the canonical key:
 * - esparex_user_choice
 */

import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/api/routes";
import { toApiResult } from "@/lib/api/result";
import type { GeoJSONPoint } from "@/types/location";

export interface IPGeolocationResult {
    city: string;
    state: string;
    country: string;
    coordinates: GeoJSONPoint;
}

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Detect location via the backend proxy (server-side ipapi.co + API key).
 */
export async function detectLocationByIP(): Promise<IPGeolocationResult | null> {
    if (!isBrowser()) return null;

    try {
        const { data } = await toApiResult<IPGeolocationResult>(
            apiClient.get(API_ROUTES.USER.LOCATIONS_IP_LOCATE, { skipHealthCheck: true })
        );

        if (!data?.city || !data.coordinates) {
            return null;
        }
        return data;
    } catch {
        return null;
    }
}
