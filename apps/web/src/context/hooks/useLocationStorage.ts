"use client";

import { useCallback } from "react";
import { API_ROUTES } from "@/lib/api/routes";
import { apiClient } from "@/lib/api/client";
import { type AppLocation } from "@/types/location";
import { parseStoredAppLocation } from "./locationStorage.helpers";

export const SEARCH_LOCATION_STORAGE_KEY = "esparex_location";
export const GEO_DETECTED_STORAGE_KEY = "esparex_geo_detected";
export const LOCATION_PROMPT_DISMISSED_KEY = "esparex_location_prompt_dismissed";
export const LOCATION_PERMISSION_BLOCKED_KEY = "esparex_location_permission_blocked";

export function useLocationStorage() {
    const writeStoredLocation = useCallback((nextLocation: AppLocation) => {
        if (typeof window === "undefined") return;
        const serialized = JSON.stringify({
            ...nextLocation,
            detectedAt: Date.now()
        });
        localStorage.setItem(SEARCH_LOCATION_STORAGE_KEY, serialized);
    }, []);

    const clearStoredLocation = useCallback(() => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(SEARCH_LOCATION_STORAGE_KEY);
    }, []);

    const readStoredLocation = useCallback((): AppLocation | null => {
        if (typeof window === "undefined") return null;

        const raw = localStorage.getItem(SEARCH_LOCATION_STORAGE_KEY);
        const stored = parseStoredAppLocation(raw);

        if (!stored && raw) {
            clearStoredLocation();
        }

        return stored;
    }, [clearStoredLocation]);

    const logAnalytics = useCallback(async (data: {
        source: "auto" | "ip" | "manual" | "default";
        city: string;
        state: string;
        reason: string;
        eventType?: 
            | "location_search" 
            | "ad_view" 
            | "ad_post"
            | "location_prompt_dismissed"
            | "location_permission_granted"
            | "location_prompt_shown"
            | "location_permission_denied"
            | "location_permission_requested";
        locationId?: string;
    }) => {
        try {
            // Remove empty locationId to prevent Zod ObjectId validation errors
            const payload = { ...data };
            if (!payload.locationId) {
                delete payload.locationId;
            }
            await apiClient.post(API_ROUTES.USER.LOG_LOCATION_EVENT, payload, { silent: true });
        } catch {
            /* silent */
        }
    }, []);

    const setPromptDismissedFlag = useCallback((dismissed: boolean) => {
        if (typeof window === "undefined") return;
        if (dismissed) {
            localStorage.setItem(LOCATION_PROMPT_DISMISSED_KEY, "true");
        } else {
            localStorage.removeItem(LOCATION_PROMPT_DISMISSED_KEY);
        }
    }, []);

    const readPermissionBlockedFlag = useCallback((): boolean => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(LOCATION_PERMISSION_BLOCKED_KEY) === "true";
    }, []);

    const setPermissionBlockedFlag = useCallback((blocked: boolean) => {
        if (typeof window === "undefined") return;
        if (blocked) {
            localStorage.setItem(LOCATION_PERMISSION_BLOCKED_KEY, "true");
        } else {
            localStorage.removeItem(LOCATION_PERMISSION_BLOCKED_KEY);
        }
    }, []);

    return {
        readStoredLocation,
        writeStoredLocation,
        clearStoredLocation,
        logAnalytics,
        setPromptDismissedFlag,
        readPermissionBlockedFlag,
        setPermissionBlockedFlag
    };
}
