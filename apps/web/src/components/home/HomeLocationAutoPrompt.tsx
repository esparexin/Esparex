"use client";

import { useEffect, useRef } from "react";
import { useLocationStatus, useLocationDispatch, useLocationData } from "@/context/LocationContext";

export function HomeLocationAutoPrompt() {
    const { status, promptDismissed } = useLocationStatus();
    const { location } = useLocationData();
    const { detectLocation } = useLocationDispatch();
    const hasPrompted = useRef(false);

    useEffect(() => {
        console.log(`[HomeLocationAutoPrompt] Mounted. hasPrompted.current: ${hasPrompted.current}, status: ${status}, promptDismissed: ${promptDismissed}, location.source: ${location.source}`);
        // Only run once per session
        if (hasPrompted.current) {
            console.log(`[HomeLocationAutoPrompt] Exiting early because hasPrompted.current is true.`);
            return;
        }

        // If the global context resolved to 'prompt' and the user hasn't dismissed it,
        // and they don't have a saved location
        if (status === "prompt" && !promptDismissed && location.source === "default") {
            console.log(`[HomeLocationAutoPrompt] Conditions met. Triggering detectLocation(true, false, true).`);
            hasPrompted.current = true;
            // Trigger automatic detection (persist = true, force = false, isAutoPrompt = true)
            detectLocation(true, false, true).catch((e) => {
                console.error(`[HomeLocationAutoPrompt] detectLocation error:`, e);
            }); 
        } else {
            console.log(`[HomeLocationAutoPrompt] Conditions NOT met. status === "prompt": ${status === "prompt"}, !promptDismissed: ${!promptDismissed}, location.source === "default": ${location.source === "default"}`);
        }
    }, [status, promptDismissed, location.source, detectLocation]);

    return null;
}
