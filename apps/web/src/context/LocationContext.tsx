"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useRef,
    useCallback,
    useMemo,
} from "react";
import type { AppLocation, GeoJSONPoint } from "@/types/location";
import { DEFAULT_APP_LOCATION } from "@/types/location";
import { isGenericDetectedLocation } from "@/lib/location/locationService";

// Hooks
import {
    useLocationStorage,
    GEO_DETECTED_STORAGE_KEY,
    LOCATION_PROMPT_DISMISSED_KEY,
} from "./hooks/useLocationStorage";
import { useUnifiedLocationDetection } from "@/hooks/useUnifiedLocationDetection";
import { useLocationActionHandlers } from "./hooks/useLocationActionHandlers";
import { useLocationInit } from "./hooks/useLocationInit";
import { useMultiTabLocationSync } from "./hooks/useMultiTabLocationSync";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

export type LocationCoordinates = GeoJSONPoint;
export type LocationStatus = "unknown" | "checking" | "prompt" | "granted" | "denied" | "manual_selection";
export type LocationData = AppLocation;

export type LocationDataContextType = {
    location: LocationData;
    isLoaded: boolean;
};

export type LocationStatusContextType = {
    status: LocationStatus;
    detectError: string | null;
    loading: boolean;
    locationExpired: boolean;
    detectFeedback: string | null;
    promptDismissed: boolean;
};

export type LocationDispatchContextType = {
    detectLocation: (persist?: boolean, force?: boolean, isAutoPrompt?: boolean) => Promise<LocationData | null>;
    setManualLocation: (
        city: string,
        state?: string,
        name?: string,
        id?: string,
        coordinates?: LocationCoordinates,
        options?: {
            silent?: boolean;
            country?: string;
            level?: LocationData["level"];
            persistProfile?: boolean;
            logSelectionAnalytics?: boolean;
        }
    ) => void;
    clearLocation: () => void;
};

export type LocationActionsContextType = LocationDispatchContextType;

const getLocationStatus = (source: LocationData["source"]): LocationStatus =>
    source === "manual" ? "manual_selection" : "granted";

/* -------------------------------------------------------------------------- */
/* CONTEXT */
/* -------------------------------------------------------------------------- */

const LocationActionsContext = createContext<LocationActionsContextType | undefined>(undefined);
const LocationDataContext = createContext<LocationDataContextType | undefined>(undefined);
const LocationStatusContext = createContext<LocationStatusContextType | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/* PROVIDER */
/* -------------------------------------------------------------------------- */

export function LocationProvider({
    children,
    initialHasAuthCookie = false,
}: {
    children: ReactNode;
    initialHasAuthCookie?: boolean;
}) {
    // ── Core State ────────────────────────────────────────────────────────────
    const [location, setLocation] = useState<LocationData>(DEFAULT_APP_LOCATION);
    const [status, setStatus] = useState<LocationStatus>("unknown");
    const [detectError, setDetectError] = useState<string | null>(null);
    const [_promptDismissed, setPromptDismissed] = useState(false);
    const [locationExpired, setLocationExpired] = useState(false);

    const genericLocationRefreshKeyRef = useRef<string | null>(null);
    const autoDetectedRef = useRef(false);

    // ── Logic Hooks ───────────────────────────────────────────────────────────
    const {
        readStoredLocation,
        writeStoredLocation,
        clearStoredLocation,
        logAnalytics,
        setPromptDismissedFlag,
        readPermissionBlockedFlag,
        setPermissionBlockedFlag
    } = useLocationStorage();

    const persistPromptDismissed = useCallback((dismissed: boolean) => {
        setPromptDismissed(dismissed);
        setPromptDismissedFlag(dismissed);
        
        if (dismissed && typeof window !== "undefined") {
            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
            localStorage.setItem(LOCATION_PROMPT_DISMISSED_KEY + "_expiry", expiry.toString());
            
            logAnalytics?.({
                source: 'default',
                city: 'Unknown',
                state: 'Unknown',
                reason: 'prompt_dismissed',
                eventType: 'location_prompt_dismissed'
            });
        }
    }, [setPromptDismissedFlag, logAnalytics]);

    const applyResolvedLocation = useCallback((nextLocation: LocationData, persist = false) => {
        setLocation(nextLocation);
        setStatus(getLocationStatus(nextLocation.source));
        setDetectError(null);
        persistPromptDismissed(true);

        if (typeof window !== "undefined" && nextLocation.source === "auto") {
            sessionStorage.setItem(GEO_DETECTED_STORAGE_KEY, "true");
        }

        if (persist) {
            writeStoredLocation(nextLocation);
        }
    }, [persistPromptDismissed, writeStoredLocation]);

    const handleSuccess = useCallback((loc: LocationData, persist?: boolean) => {
        autoDetectedRef.current = true;
        setPermissionBlockedFlag(false);
        applyResolvedLocation(loc, persist);
        
        logAnalytics?.({
            source: 'auto',
            city: loc.city || 'Unknown',
            state: loc.state || 'Unknown',
            reason: 'permission_granted',
            eventType: 'location_permission_granted'
        });
    }, [applyResolvedLocation, setPermissionBlockedFlag, logAnalytics]);

    const handleError = useCallback((msg: string) => {
        setStatus(location.source === "manual" ? "manual_selection" : "prompt");
        setDetectError(msg);
    }, [location.source]);

    const handlePermissionBlocked = useCallback(() => {
        setStatus("denied");
        setDetectError("Location access is disabled for this site. Enable it in your browser's site settings.");
        setPermissionBlockedFlag(true);
        
        logAnalytics?.({
            source: 'default',
            city: 'Unknown',
            state: 'Unknown',
            reason: 'permission_denied',
            eventType: 'location_permission_denied'
        });
    }, [setPermissionBlockedFlag, logAnalytics]);

    const { detect: unifiedDetect, isDetecting, feedback: detectFeedback } = useUnifiedLocationDetection({
        onSuccess: handleSuccess,
        onError: handleError,
        onPermissionBlocked: handlePermissionBlocked,
        logAnalytics
    });

    const detectLocation = useCallback(async (persist = false, force = false, isAutoPrompt = false): Promise<LocationData | null> => {
        if (isDetecting && !force) {
            return null;
        }
        setStatus("checking");
        
        logAnalytics?.({
            source: 'default',
            city: 'Unknown',
            state: 'Unknown',
            reason: 'requesting_permission',
            eventType: 'location_permission_requested'
        });
        
        const result = await unifiedDetect({ persist, force });

        if (isAutoPrompt && result?.failure) {
            if (typeof navigator !== "undefined" && navigator.permissions) {
                try {
                    const permResult = await navigator.permissions.query({ name: 'geolocation' });
                    if (permResult.state === "prompt" && (result.failure.reason === "timeout" || result.failure.reason === "position_unavailable")) {
                        persistPromptDismissed(true);
                    }
                } catch {
                    // Ignore Safari permission query errors
                }
            }
        }
        
        return result?.location || null;
    }, [isDetecting, unifiedDetect, logAnalytics, persistPromptDismissed]);

    const performReverseGeocode = useCallback(async (lat: number, lng: number) => {
        try {
            const { reverseGeocode: reverseGeocodeLocation } = await import("@/lib/location/locationService");
            const refreshedLocation = await reverseGeocodeLocation(lat, lng);
            if (!refreshedLocation || isGenericDetectedLocation(refreshedLocation)) return;
            applyResolvedLocation({ ...refreshedLocation, source: "auto" }, true);
        } catch {
            /* silent self-heal */
        }
    }, [applyResolvedLocation]);

    const {
        setManualLocation,
        clearLocation
    } = useLocationActionHandlers({
        setLocation,
        setStatus,
        setDetectError,
        persistPromptDismissed,
        writeStoredLocation,
        clearStoredLocation,
        logAnalytics,
        autoDetectedRef
    });

    // ── Auto-Heal: Reverse Geocode Imprecise Coordinates ──────────────────────
    useEffect(() => {
        const coordinates = location.coordinates?.coordinates;
        if (!coordinates || coordinates.length < 2) return;

        const [lng, lat] = coordinates;
        const staleDetectedLocation = {
            source: location.source,
            formattedAddress: location.formattedAddress,
            display: location.display,
            name: location.name,
            city: location.city,
        };
        if (!isGenericDetectedLocation(staleDetectedLocation)) return;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const refreshKey = `${location.source}:${lat.toFixed(6)}:${lng.toFixed(6)}`;
        if (genericLocationRefreshKeyRef.current === refreshKey) return;
        genericLocationRefreshKeyRef.current = refreshKey;

        void performReverseGeocode(lat, lng);
    }, [location, performReverseGeocode]);

    // ── Initialization & Storage Sync Sub-Hooks ───────────────────────────────
    useLocationInit({
        initialHasAuthCookie,
        readStoredLocation,
        applyResolvedLocation,
        readPermissionBlockedFlag,
        setPermissionBlockedFlag,
        setStatus,
        setLocation,
        setPromptDismissed,
        setLocationExpired,
        logAnalytics,
        detectLocation,
    });

    useMultiTabLocationSync({
        setLocation,
        setStatus,
        setPromptDismissed,
        getLocationStatus,
    });

    // ── Context Values ────────────────────────────────────────────────────────

    const dataValue = useMemo<LocationDataContextType>(
        () => ({
            location,
            isLoaded: status !== "checking" && status !== "unknown",
        }),
        [location, status]
    );

    const statusContextValue = useMemo<LocationStatusContextType>(
        () => ({
            status,
            detectError,
            loading: isDetecting,
            locationExpired,
            detectFeedback,
            promptDismissed: _promptDismissed,
        }),
        [status, detectError, isDetecting, locationExpired, detectFeedback, _promptDismissed]
    );

    const actionsValue = useMemo(
        () => ({
            detectLocation,
            setManualLocation,
            clearLocation,
        }),
        [clearLocation, detectLocation, setManualLocation]
    );

    return (
        <LocationDataContext.Provider value={dataValue}>
            <LocationStatusContext.Provider value={statusContextValue}>
                <LocationActionsContext.Provider value={actionsValue}>
                    {children}
                </LocationActionsContext.Provider>
            </LocationStatusContext.Provider>
        </LocationDataContext.Provider>
    );
}

/* -------------------------------------------------------------------------- */
/* HOOKS ──────────────────────────────────────────────────────────────────── */

export function useLocationDispatch(): LocationDispatchContextType {
    const ctx = useContext(LocationActionsContext);
    if (!ctx) throw new Error("useLocationDispatch must be used within LocationProvider");
    return ctx;
}

export function useLocationActions(): LocationActionsContextType {
    const ctx = useContext(LocationActionsContext);
    if (!ctx) throw new Error("useLocationActions must be used within LocationProvider");
    return ctx;
}

export function useLocationData(): LocationDataContextType {
    const ctx = useContext(LocationDataContext);
    if (!ctx) throw new Error("useLocationData must be used within LocationProvider");
    return ctx;
}

export function useLocationStatus(): LocationStatusContextType {
    const ctx = useContext(LocationStatusContext);
    if (!ctx) throw new Error("useLocationStatus must be used within LocationProvider");
    return ctx;
}

