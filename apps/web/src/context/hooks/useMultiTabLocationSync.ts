"use client";

import { useEffect } from "react";
import type { LocationData, LocationStatus } from "../LocationContext";
import { LOCATION_PROMPT_DISMISSED_KEY } from "./useLocationStorage";

export function useMultiTabLocationSync({
    setLocation,
    setStatus,
    setPromptDismissed,
    getLocationStatus,
}: {
    setLocation: (loc: LocationData) => void;
    setStatus: (status: LocationStatus) => void;
    setPromptDismissed: (dismissed: boolean) => void;
    getLocationStatus: (source: LocationData["source"]) => LocationStatus;
}) {
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "esparex_app_location" && e.newValue) {
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

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [getLocationStatus, setLocation, setPromptDismissed, setStatus]);
}
