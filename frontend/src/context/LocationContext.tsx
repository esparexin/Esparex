"use client";

import { API_ROUTES } from "@/api/routes";
import { getMe } from "@/api/user/users";
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
import { apiClient } from "@/lib/api/client";
import type { AppLocation, GeoJSONPoint } from "@/types/location";
import { DEFAULT_APP_LOCATION } from "@/types/location";
import {
    getCurrentLocationResult,
    normalizeLocation,
} from "@/lib/location/locationService";

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

export type LocationCoordinates = GeoJSONPoint;

export type LocationStatus =
    | "detecting"
    | "available"
    | "manual"
    | "unavailable";

export type LocationData = AppLocation;

export type LocationStateContextType = {
    location: LocationData;
    status: LocationStatus;
    detectError: string | null;
    loading: boolean;
    isLoaded: boolean;
    shouldShowFirstVisitPrompt: boolean;
    isPermissionBlocked: boolean;
    showPermissionBlockedModal: boolean;
    /** True when a previously saved location was silently cleared due to TTL expiry. */
    locationExpired: boolean;
};

export type LocationDispatchContextType = {
    detectLocation: (persist?: boolean, force?: boolean) => Promise<boolean>;
    detectApproximateLocation: (persist?: boolean, force?: boolean) => Promise<boolean>;
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

const SEARCH_LOCATION_STORAGE_KEY = "esparex_location";
const GEO_DETECTED_STORAGE_KEY = "esparex_geo_detected";
const LOCATION_PROMPT_DISMISSED_KEY = "esparex_location_prompt_dismissed";
const LOCATION_PERMISSION_BLOCKED_KEY = "esparex_location_permission_blocked";
const TTL_MANUAL_MS = 30 * 24 * 60 * 60 * 1000;
const TTL_AUTO_MS = 7 * 24 * 60 * 60 * 1000;

const getLocationStatus = (source: LocationData["source"]): LocationStatus =>
    source === "manual" ? "manual" : "available";

const writeStoredLocation = (nextLocation: LocationData) => {
    if (typeof window === "undefined") return;
    const serialized = JSON.stringify(nextLocation);
    localStorage.setItem(SEARCH_LOCATION_STORAGE_KEY, serialized);
};

const clearStoredLocation = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SEARCH_LOCATION_STORAGE_KEY);
};

/* -------------------------------------------------------------------------- */
/* CONTEXT */
/* -------------------------------------------------------------------------- */

const LocationStateContext = createContext<LocationStateContextType | undefined>(undefined);
const LocationActionsContext = createContext<LocationActionsContextType | undefined>(undefined);

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
    const [location, setLocation] = useState<LocationData>(DEFAULT_APP_LOCATION);
    const [status, setStatus] = useState<LocationStatus>("detecting");
    const [detectError, setDetectError] = useState<string | null>(null);
    const [promptDismissed, setPromptDismissed] = useState(false);
    const [showPermissionBlockedModal, setShowPermissionBlockedModal] = useState(false);
    const [isPermissionBlocked, setIsPermissionBlocked] = useState(false);
    const [shouldShowPromptAfterDelay, setShouldShowPromptAfterDelay] = useState(false);
    const [locationExpired, setLocationExpired] = useState(false);

    const initializedRef = useRef(false);
    const detectingRef = useRef(false);
    const autoDetectedRef = useRef(false);
    const locationSourceRef = useRef(location.source);
    const promptDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const detectDebounceTimersRef = useRef<{
        precise: ReturnType<typeof setTimeout> | null;
        approximate: ReturnType<typeof setTimeout> | null;
    }>({
        precise: null,
        approximate: null,
    });
    const detectDebounceResolversRef = useRef<{
        precise?: (value: boolean) => void;
        approximate?: (value: boolean) => void;
    }>({});

    useEffect(() => {
        locationSourceRef.current = location.source;
    }, [location.source]);

    /* ---------------------------------------------------------------------- */
    /* ANALYTICS                                                              */
    /* ---------------------------------------------------------------------- */

    const logAnalytics = useCallback(
        async (data: {
            source: "manual" | "default";
            city: string;
            state: string;
            reason: "manual_override" | "gps_denied";
            eventType?: "location_search";
            locationId?: string;
        }) => {
            try {
                await apiClient.post(API_ROUTES.USER.LOG_LOCATION_EVENT, data);
            } catch {
                /* silent */
            }
        },
        []
    );

    const persistPromptDismissed = useCallback((dismissed: boolean) => {
        setPromptDismissed(dismissed);
        if (typeof window === "undefined") return;

        if (dismissed) {
            localStorage.setItem(LOCATION_PROMPT_DISMISSED_KEY, "true");
            return;
        }

        localStorage.removeItem(LOCATION_PROMPT_DISMISSED_KEY);
    }, []);

    const readPermissionBlockedFlag = useCallback((): boolean => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(LOCATION_PERMISSION_BLOCKED_KEY) === "true";
    }, []);

    const setPermissionBlockedFlag = useCallback((blocked: boolean) => {
        setIsPermissionBlocked(blocked);
        if (typeof window === "undefined") return;

        if (blocked) {
            localStorage.setItem(LOCATION_PERMISSION_BLOCKED_KEY, "true");
        } else {
            localStorage.removeItem(LOCATION_PERMISSION_BLOCKED_KEY);
        }
    }, []);

    const dismissPermissionBlockedModal = useCallback(() => {
        setShowPermissionBlockedModal(false);
    }, []);

    const resetPermissionBlocked = useCallback(() => {
        setPermissionBlockedFlag(false);
    }, [setPermissionBlockedFlag]);

    const applyResolvedLocation = useCallback((nextLocation: LocationData, persist = false) => {
        setLocation(nextLocation);
        setStatus(getLocationStatus(nextLocation.source));
        setDetectError(null);
        autoDetectedRef.current = nextLocation.source === "auto" || nextLocation.source === "ip";
        persistPromptDismissed(true);

        if (typeof window !== "undefined" && autoDetectedRef.current) {
            sessionStorage.setItem(GEO_DETECTED_STORAGE_KEY, "true");
        }

        if (persist && typeof window !== "undefined") {
            writeStoredLocation(nextLocation);
        }
    }, [persistPromptDismissed]);

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

    const readStoredLocation = useCallback((): LocationData | null => {
        if (typeof window === "undefined") return null;

        try {
            const raw = localStorage.getItem(SEARCH_LOCATION_STORAGE_KEY);
            if (!raw) return null;

            const stored = JSON.parse(raw) as AppLocation & { detectedAt?: number };
            const ttl = stored.source === "manual" ? TTL_MANUAL_MS : TTL_AUTO_MS;
            const age = Date.now() - (stored.detectedAt ?? 0);

            if (age > ttl) {
                clearStoredLocation();
                return null;
            }

            return normalizeLocation(stored);
        } catch {
            return null;
        }
    }, []);

    /* ---------------------------------------------------------------------- */
    /* DETECTION                                                              */
    /* ---------------------------------------------------------------------- */

    const queueDebouncedDetection = useCallback(
        (
            mode: "precise" | "approximate",
            runner: () => Promise<boolean>,
            force: boolean
        ): Promise<boolean> => {
            if (force) return runner();

            const existingTimer = detectDebounceTimersRef.current[mode];
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const pendingResolver = detectDebounceResolversRef.current[mode];
            if (pendingResolver) {
                pendingResolver(false);
            }

            return new Promise<boolean>((resolve) => {
                detectDebounceResolversRef.current[mode] = resolve;
                detectDebounceTimersRef.current[mode] = setTimeout(async () => {
                    detectDebounceTimersRef.current[mode] = null;
                    detectDebounceResolversRef.current[mode] = undefined;
                    try {
                        resolve(await runner());
                    } catch {
                        resolve(false);
                    }
                }, 180);
            });
        },
        []
    );

    const runPreciseDetection = useCallback(
        async (persist = false, force = false) => {
            if (locationSourceRef.current === "manual" && !force) return false;

            if (typeof window !== "undefined") {
                const sessionDetected = sessionStorage.getItem(GEO_DETECTED_STORAGE_KEY);
                if (sessionDetected === "true" && !force) {
                    return false;
                }
            }

            if (autoDetectedRef.current && !force) return false;
            if (typeof window === "undefined" || detectingRef.current) return false;

            detectingRef.current = true;
            setStatus("detecting");
            setDetectError(null);

            try {
                const detectionResult = await getCurrentLocationResult({
                    allowIpFallback: false,
                    allowGeolocationPrompt: true,
                });
                const detected = detectionResult.location;

                if (!detected) {
                    setStatus(locationSourceRef.current === "manual" ? "manual" : "unavailable");
                    
                    // Handle permission denied
                    if (detectionResult.failure?.reason === "permission_denied") {
                        setPermissionBlockedFlag(true);
                        setShowPermissionBlockedModal(true);
                        logAnalytics({
                            source: "default",
                            city: "Unknown",
                            state: "Unknown",
                            reason: "gps_denied",
                        });
                    }
                    
                    setDetectError(
                        detectionResult.failure?.message ||
                        "Could not detect current location. Please select manually."
                    );
                    return false;
                }

                applyResolvedLocation(detected, persist);
                return true;
            } catch {
                setStatus(locationSourceRef.current === "manual" ? "manual" : "unavailable");
                setDetectError("Could not detect current location. Please select manually.");
                return false;
            } finally {
                detectingRef.current = false;
            }
        },
        [applyResolvedLocation, logAnalytics, setPermissionBlockedFlag]
    );

    const detectLocation = useCallback(
        async (persist = false, force = false) =>
            queueDebouncedDetection("precise", () => runPreciseDetection(persist, force), force),
        [queueDebouncedDetection, runPreciseDetection]
    );

    const runApproximateDetection = useCallback(
        async (persist = false, force = false) => {
            if (locationSourceRef.current === "manual" && !force) return false;
            if (typeof window === "undefined" || detectingRef.current) return false;

            detectingRef.current = true;
            setStatus("detecting");
            setDetectError(null);

            try {
                const detectionResult = await getCurrentLocationResult({
                    allowIpFallback: true,
                    allowGeolocationPrompt: false,
                    skipGeolocation: true,
                });
                const detected = detectionResult.location;

                if (!detected) {
                    setStatus(locationSourceRef.current === "manual" ? "manual" : "unavailable");
                    setDetectError(
                        detectionResult.failure?.message ||
                        "Could not detect approximate location. Please select manually."
                    );
                    return false;
                }

                applyResolvedLocation(detected, persist);
                return true;
            } catch {
                setStatus(locationSourceRef.current === "manual" ? "manual" : "unavailable");
                setDetectError("Could not detect approximate location. Please select manually.");
                return false;
            } finally {
                detectingRef.current = false;
            }
        },
        [applyResolvedLocation]
    );

    const detectApproximateLocation = useCallback(
        async (persist = false, force = false) =>
            queueDebouncedDetection(
                "approximate",
                () => runApproximateDetection(persist, force),
                force
            ),
        [queueDebouncedDetection, runApproximateDetection]
    );

    /* ---------------------------------------------------------------------- */
    /* INIT                                                                   */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        let cancelled = false;

        const initLocation = async () => {
            if (typeof window !== "undefined") {
                setPromptDismissed(localStorage.getItem(LOCATION_PROMPT_DISMISSED_KEY) === "true");
                const permBlocked = readPermissionBlockedFlag();
                setIsPermissionBlocked(permBlocked);
            }

            const hadStoredRaw = typeof window !== "undefined" && Boolean(localStorage.getItem(SEARCH_LOCATION_STORAGE_KEY));
            const storedLocation = readStoredLocation();
            if (storedLocation) {
                applyResolvedLocation(storedLocation, true);
                return;
            }
            // If there was saved data but readStoredLocation returned null, the TTL expired
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

            // PR 7 — Silent IP pre-detection.
            // On first visit we try an IP-based approximate location with a
            // 3-second timeout. If it succeeds the feed updates silently and
            // the first-visit prompt is suppressed entirely.
            // If it fails or times out we fall through and show the prompt
            // immediately (no extra 5-second wait).
            const IP_DETECT_TIMEOUT_MS = 3000;
            const ipDetectPromise = detectApproximateLocation(true, false);
            const timeoutPromise = new Promise<boolean>((resolve) =>
                setTimeout(() => resolve(false), IP_DETECT_TIMEOUT_MS)
            );

            const ipDetected = await Promise.race([ipDetectPromise, timeoutPromise]);
            if (cancelled) return;

            if (!ipDetected) {
                // IP detection failed or timed out — show first-visit prompt immediately.
                setShouldShowPromptAfterDelay(true);
            }
            // If ipDetected === true, applyResolvedLocation was already called
            // inside detectApproximateLocation, no prompt needed.
        };

        void initLocation();

        return () => {
            cancelled = true;
            if (promptDelayTimeoutRef.current) {
                clearTimeout(promptDelayTimeoutRef.current);
            }
            if (detectDebounceTimersRef.current.precise) {
                clearTimeout(detectDebounceTimersRef.current.precise);
                detectDebounceTimersRef.current.precise = null;
            }
            if (detectDebounceTimersRef.current.approximate) {
                clearTimeout(detectDebounceTimersRef.current.approximate);
                detectDebounceTimersRef.current.approximate = null;
            }
            if (detectDebounceResolversRef.current.precise) {
                detectDebounceResolversRef.current.precise(false);
                detectDebounceResolversRef.current.precise = undefined;
            }
            if (detectDebounceResolversRef.current.approximate) {
                detectDebounceResolversRef.current.approximate(false);
                detectDebounceResolversRef.current.approximate = undefined;
            }
        };
    }, [applyResolvedLocation, hydrateProfileLocation, readStoredLocation, readPermissionBlockedFlag, detectApproximateLocation]);

    /* ---------------------------------------------------------------------- */
    /* MANUAL                                                                 */
    /* ---------------------------------------------------------------------- */

    const setManualLocation = useCallback(
        (
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
            autoDetectedRef.current = true;
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
                    locationId: normalized.locationId || normalized.placeId,
                });
            }
        },
        [logAnalytics, persistPromptDismissed]
    );

    const clearLocation = useCallback(() => {
        setLocation(DEFAULT_APP_LOCATION);
        setStatus("available");
        setDetectError(null);
        autoDetectedRef.current = false;

        clearStoredLocation();
        sessionStorage.removeItem(GEO_DETECTED_STORAGE_KEY);
    }, []);

    const dismissFirstVisitPrompt = useCallback(() => {
        persistPromptDismissed(true);
    }, [persistPromptDismissed]);

    const shouldShowFirstVisitPrompt =
        status !== "detecting" &&
        location.source === "default" &&
        !promptDismissed &&
        !isPermissionBlocked &&
        shouldShowPromptAfterDelay;

    /* ---------------------------------------------------------------------- */

    const stateValue = useMemo(
        () => ({
            location,
            status,
            detectError,
            loading: status === "detecting",
            isLoaded: status !== "detecting",
            shouldShowFirstVisitPrompt,
            isPermissionBlocked,
            showPermissionBlockedModal,
            locationExpired,
        }),
        [
            detectError,
            isPermissionBlocked,
            location,
            locationExpired,
            shouldShowFirstVisitPrompt,
            showPermissionBlockedModal,
            status,
        ]
    );

    const actionsValue = useMemo(
        () => ({
            detectLocation,
            detectApproximateLocation,
            setManualLocation,
            clearLocation,
            dismissFirstVisitPrompt,
            dismissPermissionBlockedModal,
            resetPermissionBlocked,
        }),
        [
            clearLocation,
            detectApproximateLocation,
            detectLocation,
            dismissFirstVisitPrompt,
            dismissPermissionBlockedModal,
            resetPermissionBlocked,
            setManualLocation,
        ]
    );

    return (
        <LocationStateContext.Provider value={stateValue}>
            <LocationActionsContext.Provider value={actionsValue}>
                {children}
            </LocationActionsContext.Provider>
        </LocationStateContext.Provider>
    );
}

/* -------------------------------------------------------------------------- */
/* HOOK                                                                       */
/* -------------------------------------------------------------------------- */

export function useLocationState(): LocationStateContextType {
    const ctx = useContext(LocationStateContext);
    if (!ctx) {
        throw new Error("useLocationState must be used within LocationProvider");
    }
    return ctx;
}

export function useLocationDispatch(): LocationDispatchContextType {
    const ctx = useContext(LocationActionsContext);
    if (!ctx) {
        throw new Error("useLocationDispatch must be used within LocationProvider");
    }
    return ctx;
}

export function useLocationActions(): LocationActionsContextType {
    const ctx = useContext(LocationActionsContext);
    if (!ctx) {
        throw new Error("useLocationActions must be used within LocationProvider");
    }
    return ctx;
}



/* -------------------------------------------------------------------------- */
/* PRIMITIVE SELECTOR HOOK — PLATFORM-LEVEL LOOP PREVENTION                   */
/* -------------------------------------------------------------------------- */

/**
 * useLocationPrimitives — canonical safe hook for reading location data.
 *
 * ✅ Returns only scalar / stable primitive fields from the location state.
 * ✅ useMemo keyed on primitives ensures stable object identity.
 * ✅ Prevents the infinite-loop pattern where a full `location` object in a
 *    useEffect dependency array re-fires on every context re-render.
 *
 * USAGE RULE:
 *   ✅ const { city, state, coordinates } = useLocationPrimitives();
 *   ❌ const { location } = useLocationState();
 *      useEffect(() => { ... }, [location]);  ← NEVER DO THIS — causes infinite loops
 *
 * Components that need to call dispatch actions (setManualLocation, detectLocation, etc.)
 * should additionally call useLocationDispatch().
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
        [
            location.city,
            location.state,
            location.locationId,
            location.coordinates,
            location.formattedAddress,
            location.name,
            location.display,
            location.source,
            location.level,
            location.country,
        ]
    );
}
