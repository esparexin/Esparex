"use client";

import { useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { DEFAULT_APP_LOCATION, type AppLocation, type GeoJSONPoint } from "@/types/location";
import { normalizeToAppLocation as normalizeLocation } from "@/lib/location/locationService";

interface UseLocationActionHandlersProps {
    setLocation: (loc: AppLocation) => void;
    setStatus: (status: any) => void;
    setDetectError: (err: string | null) => void;
    persistPromptDismissed: (dismissed: boolean) => void;
    writeStoredLocation: (loc: AppLocation) => void;
    clearStoredLocation: () => void;
    logAnalytics: (data: any) => void;
    autoDetectedRef: { current: boolean };
}

export function useLocationActionHandlers({
    setLocation,
    setStatus,
    setDetectError,
    persistPromptDismissed,
    writeStoredLocation,
    clearStoredLocation,
    logAnalytics,
    autoDetectedRef
}: UseLocationActionHandlersProps) {
    const setManualLocation = useCallback((
        city: string,
        state?: string,
        name?: string,
        id?: string,
        coordinates?: GeoJSONPoint,
        options?: {
            silent?: boolean;
            country?: string;
            level?: AppLocation["level"];
            persistProfile?: boolean;
            logSelectionAnalytics?: boolean;
        }
    ) => {
        const normalized = normalizeLocation(
            {
                city,
                state: state || city,
                country: options?.country,
                level: options?.level,
                name: name || city,
                display: name || city,
                locationId: id,
                coordinates,
                source: "manual",
            },
            "manual"
        );

        if (!normalized) return;

        setLocation(normalized);
        setStatus("manual");
        setDetectError(null);
        autoDetectedRef.current = false;
        persistPromptDismissed(true);

        writeStoredLocation(normalized);

        if (options?.persistProfile) {
            void apiClient
                .patch(API_ROUTES.USER.USERS_ME, {
                    city: normalized.city,
                    state: normalized.state,
                    ...(normalized.locationId ? { locationId: normalized.locationId } : {}),
                    ...(normalized.coordinates ? { coordinates: normalized.coordinates } : {}),
                })
                .catch(() => {/* unauthenticated — ignore */ });
        }

        if (!options?.silent && options?.logSelectionAnalytics !== false) {
            logAnalytics({
                source: "manual",
                city: normalized.city,
                state: normalized.state || "Unknown",
                reason: "manual_override",
                eventType: "location_search",
                locationId: normalized.locationId,
            });
        }
    }, [setLocation, setStatus, setDetectError, autoDetectedRef, persistPromptDismissed, writeStoredLocation, logAnalytics]);

    const clearLocation = useCallback(() => {
        setLocation(DEFAULT_APP_LOCATION);
        setStatus("available");
        setDetectError(null);
        autoDetectedRef.current = false;

        clearStoredLocation();
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("esparex_geo_detected");
        }
    }, [setLocation, setStatus, setDetectError, autoDetectedRef, clearStoredLocation]);

    const dismissFirstVisitPrompt = useCallback(() => {
        persistPromptDismissed(true);
    }, [persistPromptDismissed]);

    return {
        setManualLocation,
        clearLocation,
        dismissFirstVisitPrompt
    };
}
