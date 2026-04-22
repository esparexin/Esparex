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
import { getMe } from "@/lib/api/user/users";
import { 
    normalizeToAppLocation as normalizeLocation 
} from "@/lib/location/locationService";
import type { AppLocation, GeoJSONPoint } from "@/types/location";
import { DEFAULT_APP_LOCATION } from "@/types/location";
import { isGenericDetectedLocation } from "@/lib/location/locationService";
import { shouldShowLocationFirstVisitPrompt } from "./locationPrompt";

// Hooks
import {
    useLocationStorage,
    GEO_DETECTED_STORAGE_KEY,
    LOCATION_PROMPT_DISMISSED_KEY,
} from "./hooks/useLocationStorage";
import { useLocationDetection } from "./hooks/useLocationDetection";
import { useLocationActionHandlers } from "./hooks/useLocationActionHandlers";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

export type LocationCoordinates = GeoJSONPoint;
export type LocationStatus = "detecting" | "available" | "manual" | "unavailable";
export type LocationData = AppLocation;

// ── Domain-split state types ──────────────────────────────────────────────────
// LocationDataContext  — stable location value; only changes when user sets a new location.
// LocationStatusContext — volatile detection state; changes during GPS flow.
// Most components only need location data; subscribing to the full state causes
// unnecessary re-renders every time GPS status cycles.

export type LocationDataContextType = {
    location: LocationData;
    isLoaded: boolean;
};

export type LocationStatusContextType = {
    status: LocationStatus;
    detectError: string | null;
    loading: boolean;
    shouldShowFirstVisitPrompt: boolean;
    isPermissionBlocked: boolean;
    showPermissionBlockedModal: boolean;
    locationExpired: boolean;
};

// Merged type kept for backward-compat (useLocationState still works)
export type LocationStateContextType = LocationDataContextType & LocationStatusContextType;

export type LocationDispatchContextType = {
    detectLocation: (persist?: boolean, force?: boolean) => Promise<boolean>;
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
    dismissFirstVisitPrompt: () => void;
    dismissPermissionBlockedModal: () => void;
    resetPermissionBlocked: () => void;
};

export type LocationActionsContextType = LocationDispatchContextType;

const LOCATION_PROMPT_DELAY_MS = 800;

const getLocationStatus = (source: LocationData["source"]): LocationStatus =>
    source === "manual" ? "manual" : "available";

/* -------------------------------------------------------------------------- */
/* CONTEXT */
/* -------------------------------------------------------------------------- */

const LocationStateContext = createContext<LocationStateContextType | undefined>(undefined);
const LocationActionsContext = createContext<LocationActionsContextType | undefined>(undefined);

// Focused domain contexts
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
    const [status, setStatus] = useState<LocationStatus>("detecting");
    const [detectError, setDetectError] = useState<string | null>(null);
    const [promptDismissed, setPromptDismissed] = useState(false);
    const [showPermissionBlockedModal, setShowPermissionBlockedModal] = useState(false);
    const [isPermissionBlocked, setIsPermissionBlocked] = useState(false);
    const [shouldShowPromptAfterDelay, setShouldShowPromptAfterDelay] = useState(false);
    const [locationExpired, setLocationExpired] = useState(false);

    const initializedRef = useRef(false);
    const promptDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const genericLocationRefreshKeyRef = useRef<string | null>(null);

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
    }, [setPromptDismissedFlag]);

    const applyResolvedLocation = useCallback((nextLocation: LocationData, persist = false) => {
        setShouldShowPromptAfterDelay(false);
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

    const {
        detectLocation,
        performReverseGeocode,
        autoDetectedRef
    } = useLocationDetection({
        applyResolvedLocation,
        currentSource: location.source,
        setStatus,
        setDetectError,
        setPermissionBlockedFlag,
        setShowPermissionBlockedModal,
        logAnalytics
    });

    const {
        setManualLocation,
        clearLocation,
        dismissFirstVisitPrompt
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

    // ── Initialization ────────────────────────────────────────────────────────
    const hydrateProfileLocation = useCallback(async (): Promise<LocationData | null> => {
        if (!initialHasAuthCookie) return null;
        try {
            const user = await getMe({ silent: true });
            if (!user?.location?.city) return null;

            return normalizeLocation(
                {
                    city: user.location.city,
                    state: user.location.state,
                    coordinates: user.location.coordinates,
                    locationId: user.locationId || user.location.id,
                    source: "manual",
                    name: user.location.city,
                    display: user.location.city,
                },
                "manual"
            );
        } catch {
            return null;
        }
    }, [initialHasAuthCookie]);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        let cancelled = false;

        const initLocation = async () => {
            setPromptDismissed(readPromptDismissedFromStorage());
            setShouldShowPromptAfterDelay(false);
            const permBlocked = readPermissionBlockedFlag();
            setIsPermissionBlocked(permBlocked);

            const hadStoredRaw = typeof window !== "undefined" && Boolean(localStorage.getItem("esparex_location"));
            const storedLocation = readStoredLocation();
            if (storedLocation) {
                applyResolvedLocation(storedLocation, true);
                return;
            }
            if (hadStoredRaw) {
                setLocationExpired(true);
            }

            const profileLocation = await hydrateProfileLocation();
            if (cancelled) return;

            if (profileLocation) {
                applyResolvedLocation(profileLocation, true);
                return;
            }

            setLocation(DEFAULT_APP_LOCATION);
            setStatus("available");
            setDetectError(null);
            autoDetectedRef.current = false;
            promptDelayTimeoutRef.current = setTimeout(() => {
                if (!cancelled) {
                    setShouldShowPromptAfterDelay(true);
                }
            }, LOCATION_PROMPT_DELAY_MS);
        };

        void initLocation();

        return () => {
            cancelled = true;
            if (promptDelayTimeoutRef.current) clearTimeout(promptDelayTimeoutRef.current);
        };
    }, [applyResolvedLocation, hydrateProfileLocation, readStoredLocation, readPermissionBlockedFlag, autoDetectedRef]);

    const readPromptDismissedFromStorage = () => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(LOCATION_PROMPT_DISMISSED_KEY) === "true";
    };

    const resetPermissionBlocked = useCallback(() => {
        setPermissionBlockedFlag(false);
        setIsPermissionBlocked(false);
    }, [setPermissionBlockedFlag]);

    const dismissPermissionBlockedModal = useCallback(() => {
        setShowPermissionBlockedModal(false);
    }, []);

    const shouldShowFirstVisitPrompt = shouldShowLocationFirstVisitPrompt({
        status,
        source: location.source,
        promptDismissed,
        isPermissionBlocked,
        promptDelayElapsed: shouldShowPromptAfterDelay,
    });

    // ── Context Values ────────────────────────────────────────────────────────

    const dataValue = useMemo<LocationDataContextType>(
        () => ({
            location,
            isLoaded: status !== "detecting",
        }),
        [location, status]
    );

    const statusValue = useMemo<LocationStatusContextType>(
        () => ({
            status,
            detectError,
            loading: status === "detecting",
            shouldShowFirstVisitPrompt,
            isPermissionBlocked,
            showPermissionBlockedModal,
            locationExpired,
        }),
        [detectError, isPermissionBlocked, locationExpired, shouldShowFirstVisitPrompt, showPermissionBlockedModal, status]
    );

    // Backward-compat merged view — only re-evaluates when either domain changes
    const stateValue = useMemo<LocationStateContextType>(
        () => ({ ...dataValue, ...statusValue }),
        [dataValue, statusValue]
    );

    const actionsValue = useMemo(
        () => ({
            detectLocation,
            setManualLocation,
            clearLocation,
            dismissFirstVisitPrompt,
            dismissPermissionBlockedModal,
            resetPermissionBlocked,
        }),
        [clearLocation, detectLocation, dismissFirstVisitPrompt, dismissPermissionBlockedModal, resetPermissionBlocked, setManualLocation]
    );

    return (
        <LocationDataContext.Provider value={dataValue}>
            <LocationStatusContext.Provider value={statusValue}>
                <LocationStateContext.Provider value={stateValue}>
                    <LocationActionsContext.Provider value={actionsValue}>
                        {children}
                    </LocationActionsContext.Provider>
                </LocationStateContext.Provider>
            </LocationStatusContext.Provider>
        </LocationDataContext.Provider>
    );
}

/* -------------------------------------------------------------------------- */
/* HOOKS ──────────────────────────────────────────────────────────────────── */

export function useLocationState(): LocationStateContextType {
    const ctx = useContext(LocationStateContext);
    if (!ctx) throw new Error("useLocationState must be used within LocationProvider");
    return ctx;
}

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

// ── Focused domain hooks ──────────────────────────────────────────────────────
// Prefer these over useLocationState() when a component only needs one domain.

/**
 * useLocationData — subscribe only to location value + isLoaded.
 * Components using this do NOT re-render when GPS detection cycles.
 */
export function useLocationData(): LocationDataContextType {
    const ctx = useContext(LocationDataContext);
    if (!ctx) throw new Error("useLocationData must be used within LocationProvider");
    return ctx;
}

/**
 * useLocationStatus — subscribe only to detection status, errors, and UI prompt state.
 * Components using this do NOT re-render when the stored location changes.
 */
export function useLocationStatus(): LocationStatusContextType {
    const ctx = useContext(LocationStatusContext);
    if (!ctx) throw new Error("useLocationStatus must be used within LocationProvider");
    return ctx;
}

/**
 * useLocationPrimitives — stable selector hook to prevent infinite loops in effects.
 */
export function useLocationPrimitives() {
    const { location } = useLocationState();

    return useMemo(
        () => ({
            city: location.city,
            state: location.state,
            locationId: location.locationId,
            coordinates: location.coordinates,
            formattedAddress: location.formattedAddress,
            name: location.name,
            display: location.display,
            source: location.source,
            level: location.level,
            country: location.country,
        }),
        [location.city, location.state, location.locationId, location.coordinates, location.formattedAddress, location.name, location.display, location.source, location.level, location.country]
    );
}
