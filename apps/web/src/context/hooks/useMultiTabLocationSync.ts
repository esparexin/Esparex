"use client";

import { useEffect } from "react";
import type { LocationData, LocationStatus } from "@/types/location";
import {
    SEARCH_LOCATION_STORAGE_KEY,
    LOCATION_PROMPT_DISMISSED_KEY,
} from "./useLocationStorage";
import { parseStoredAppLocation } from "./locationStorage.helpers";

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
            if (e.key === SEARCH_LOCATION_STORAGE_KEY && e.newValue) {
                const storedLocation = parseStoredAppLocation(e.newValue);
                if (storedLocation) {
                    setLocation(storedLocation);
                    setStatus(getLocationStatus(storedLocation.source));
                }
            } else if (e.key === LOCATION_PROMPT_DISMISSED_KEY) {
                setPromptDismissed(e.newValue === "true");
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [getLocationStatus, setLocation, setPromptDismissed, setStatus]);
}
