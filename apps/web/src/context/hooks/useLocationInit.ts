"use client";

import { useCallback, useEffect, useRef } from "react";
import { getMe } from "@/lib/api/user/users";
import { normalizeToAppLocation as normalizeLocation } from "@/lib/location/locationService";
import type { LocationData, LocationStatus } from "@/types/location";
import { DEFAULT_APP_LOCATION } from "@/types/location";
import { useLocationStorage, LOCATION_PROMPT_DISMISSED_KEY } from "./useLocationStorage";

const LOCATION_PROMPT_DELAY_MS = 800;

export function useLocationInit({
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
}: {
    initialHasAuthCookie: boolean;
    readStoredLocation: () => LocationData | null;
    applyResolvedLocation: (loc: LocationData, persist?: boolean) => void;
    readPermissionBlockedFlag: () => boolean;
    setPermissionBlockedFlag: (flag: boolean) => void;
    setStatus: React.Dispatch<React.SetStateAction<LocationStatus>>;
    setLocation: (loc: LocationData) => void;
    setPromptDismissed: (dismissed: boolean) => void;
    setLocationExpired: (expired: boolean) => void;
    logAnalytics?: ReturnType<typeof useLocationStorage>["logAnalytics"];
    detectLocation: (persist?: boolean, force?: boolean, isAutoPrompt?: boolean) => Promise<LocationData | null>;
}) {
    const initializedRef = useRef(false);
    const promptDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const readPromptDismissedFromStorage = useCallback(() => {
        if (typeof window === "undefined") return false;

        const isDismissed = localStorage.getItem(LOCATION_PROMPT_DISMISSED_KEY) === "true";
        if (!isDismissed) return false;

        const expiryStr = localStorage.getItem(LOCATION_PROMPT_DISMISSED_KEY + "_expiry");
        if (expiryStr) {
            const expiry = parseInt(expiryStr, 10);
            if (!isNaN(expiry) && Date.now() > expiry) {
                localStorage.removeItem(LOCATION_PROMPT_DISMISSED_KEY);
                localStorage.removeItem(LOCATION_PROMPT_DISMISSED_KEY + "_expiry");
                return false;
            }
        }

        return true;
    }, []);

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

            let browserState = "prompt";
            if (typeof navigator !== "undefined" && navigator.permissions) {
                try {
                    const result = await navigator.permissions.query({ name: "geolocation" });
                    browserState = result.state;

                    result.onchange = () => {
                        if (result.state === "denied") {
                            setStatus("denied");
                            setPermissionBlockedFlag(true);
                        } else if (result.state === "granted") {
                            void detectLocation(true, true);
                        }
                    };
                } catch {
                    // Fallback for older browsers
                }
            }

            if (permBlocked || browserState === "denied") {
                setStatus("denied");
                setPermissionBlockedFlag(true);
            } else if (!isDismissed) {
                promptDelayTimeoutRef.current = setTimeout(() => {
                    if (!cancelled) {
                        setStatus((prev) => {
                            if (prev === "checking" || prev === "unknown") {
                                setTimeout(() => {
                                    logAnalytics?.({
                                        source: "default",
                                        city: "Unknown",
                                        state: "Unknown",
                                        reason: "initial_prompt_shown",
                                        eventType: "location_prompt_shown",
                                    });
                                }, 0);
                                return "prompt";
                            }
                            return prev;
                        });
                    }
                }, LOCATION_PROMPT_DELAY_MS);
            } else {
                setStatus("prompt");
            }
        };

        void initLocation();

        return () => {
            cancelled = true;
            if (promptDelayTimeoutRef.current) clearTimeout(promptDelayTimeoutRef.current);
        };
    }, [
        applyResolvedLocation,
        detectLocation,
        hydrateProfileLocation,
        logAnalytics,
        readPermissionBlockedFlag,
        readPromptDismissedFromStorage,
        readStoredLocation,
        setLocation,
        setLocationExpired,
        setPermissionBlockedFlag,
        setPromptDismissed,
        setStatus,
    ]);
}
