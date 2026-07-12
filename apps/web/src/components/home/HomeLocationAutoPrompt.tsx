"use client";

import { useEffect, useRef } from "react";
import { useLocationStatus, useLocationDispatch, useLocationData } from "@/context/LocationContext";

export function HomeLocationAutoPrompt() {
    const { status, promptDismissed } = useLocationStatus();
    const { location } = useLocationData();
    const { detectLocation } = useLocationDispatch();
    const hasPrompted = useRef(false);

    useEffect(() => {
        // Only run once per session
        if (hasPrompted.current) {
            return;
        }

        // If the global context resolved to 'prompt' and the user hasn't dismissed it,
        // and they don't have a saved location
        if (status === "prompt" && !promptDismissed && location.source === "default") {
            hasPrompted.current = true;
            // Trigger automatic detection (persist = true, force = false, isAutoPrompt = true)
            detectLocation(true, false, true).catch((e) => {
                console.error(`[HomeLocationAutoPrompt] detectLocation error:`, e);
            }); 
        }
    }, [status, promptDismissed, location.source, detectLocation]);

    return null;
}
