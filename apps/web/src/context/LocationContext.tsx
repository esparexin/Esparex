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
// Hooks
import {
    useLocationStorage,
    GEO_DETECTED_STORAGE_KEY,
    LOCATION_PROMPT_DISMISSED_KEY,
} from "./hooks/useLocationStorage";
import { useUnifiedLocationDetection } from "@/hooks/useUnifiedLocationDetection";
import { useLocationActionHandlers } from "./hooks/useLocationActionHandlers";

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

const LOCATION_PROMPT_DELAY_MS = 800;

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

    const initializedRef = useRef(false);
    const promptDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        
        // Expiration logic is handled by setting a timestamp in localstorage instead of just a boolean
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
        setStatus(location.source === "manual" ? "manual_selection" : "prompt"); // Back to prompt so they can retry or manual
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
        
        // Fire analytics
        logAnalytics?.({
            source: 'default',
            city: 'Unknown',
            state: 'Unknown',
            reason: 'requesting_permission',
            eventType: 'location_permission_requested'
        });
        
        const result = await unifiedDetect({ persist, force });

        if (isAutoPrompt && result?.failure) {
            // Check native browser state to see if it's STILL prompt (meaning user dismissed it instead of denying)
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

    const readPromptDismissedFromStorage = () => {
        if (typeof window === "undefined") return false;
        
        const isDismissed = localStorage.getItem(LOCATION_PROMPT_DISMISSED_KEY) === "true";
        if (!isDismissed) return false;
        
        // Check 30-day expiry for "Not Now"
        const expiryStr = localStorage.getItem(LOCATION_PROMPT_DISMISSED_KEY + "_expiry");
        if (expiryStr) {
            const expiry = parseInt(expiryStr, 10);
            if (!isNaN(expiry) && Date.now() > expiry) {
                // Expired! Reset it.
                localStorage.removeItem(LOCATION_PROMPT_DISMISSED_KEY);
                localStorage.removeItem(LOCATION_PROMPT_DISMISSED_KEY + "_expiry");
                return false;
            }
        }
        
        return true;
    };

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        let cancelled = false;

        const initLocation = async () => {
            setStatus("checking");
            
            const isDismissed = readPromptDismissedFromStorage();
            setPromptDismissed(isDismissed);
            
            const permBlocked = readPermissionBlockedFlag();
            if (permBlocked) {
                setStatus("denied");
            }

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
            
            // Capability-based permission check
            let browserState = "prompt";
            if (typeof navigator !== "undefined" && navigator.permissions) {
                try {
                    const result = await navigator.permissions.query({ name: 'geolocation' });
                    browserState = result.state;
                    
                    // Listen for changes natively
                    result.onchange = () => {
                        if (result.state === "denied") {
                            setStatus("denied");
                            setPermissionBlockedFlag(true);
                        } else if (result.state === "granted") {
                            // If granted out of band, trigger auto-detect
                            detectLocation(true, true);
                        }
                    };
                } catch {
                    // Fallback to prompt if API fails (e.g. older Safari)
                }
            }

            if (permBlocked || browserState === "denied") {
                setStatus("denied");
                setPermissionBlockedFlag(true);
            } else if (!isDismissed) {
                // Introduce the delay before prompting
                promptDelayTimeoutRef.current = setTimeout(() => {
                    if (!cancelled) {
                        setStatus(prev => {
                            if (prev === "checking" || prev === "unknown") {
                                // Defer analytics to avoid side-effects in reducer
                                setTimeout(() => {
                                    logAnalytics?.({
                                        source: 'default',
                                        city: 'Unknown',
                                        state: 'Unknown',
                                        reason: 'initial_prompt_shown',
                                        eventType: 'location_prompt_shown'
                                    });
                                }, 0);
                                return "prompt";
                            }
                            return prev;
                        });
                    }
                }, LOCATION_PROMPT_DELAY_MS);
            } else {
                setStatus("prompt"); // It's dismissed, but the state is still prompt/available to be activated manually
            }
        };

        void initLocation();

        return () => {
            cancelled = true;
            if (promptDelayTimeoutRef.current) clearTimeout(promptDelayTimeoutRef.current);
        };
    }, [applyResolvedLocation, hydrateProfileLocation, readStoredLocation, readPermissionBlockedFlag, setPermissionBlockedFlag, logAnalytics, detectLocation]);

    // ── Multi-Tab Synchronization ─────────────────────────────────────────────
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'esparex_app_location' && e.newValue) {
                try {
                    const newLocation = JSON.parse(e.newValue) as LocationData;
                    setLocation(newLocation);
                    setStatus(getLocationStatus(newLocation.source));
                } catch {
                    // Ignore parse errors
                }
            } else if (e.key === LOCATION_PROMPT_DISMISSED_KEY) {
                setPromptDismissed(e.newValue === "true");
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

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
