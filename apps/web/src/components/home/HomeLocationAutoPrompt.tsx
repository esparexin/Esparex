"use client";

import { useEffect, useRef } from "react";
import { useLocationStatus, useLocationDispatch, useLocationData } from "@/context/LocationContext";
import logger from "@/lib/logger";

/**
 * Defers the automatic location detection until after the page's Largest
 * Contentful Paint (LCP). The geolocation → reverse-geocode chain (4s+ via
 * Nominatim) was firing on mount, competing with LCP for main-thread and
 * network resources. By waiting for idle, we keep the critical path clean.
 */
function deferUntilIdle(callback: () => void): () => void {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
        if (!cancelled) callback();
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
            .requestIdleCallback(run, { timeout: 5000 });
    } else {
        // Fallback: wait for page load + 2s
        timeoutId = setTimeout(run, 2000);
    }

    return () => {
        cancelled = true;
        if (idleId !== undefined && typeof window !== "undefined" && "cancelIdleCallback" in window) {
            (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
        }
        if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
}

export function HomeLocationAutoPrompt() {
    const { status, promptDismissed } = useLocationStatus();
    const { location } = useLocationData();
    const { detectLocation } = useLocationDispatch();
    const hasPrompted = useRef(false);

    useEffect(() => {
        // Only run once per session
        if (hasPrompted.current) {
            return undefined;
        }

        // If the global context resolved to 'prompt' and the user hasn't dismissed it,
        // and they don't have a saved location
        if (status === "prompt" && !promptDismissed && location.source === "default") {
            hasPrompted.current = true;
            // Defer until after LCP: don't compete with critical rendering path
            const cancel = deferUntilIdle(() => {
                // Trigger automatic detection (persist = true, force = false, isAutoPrompt = true)
                detectLocation(true, false, true).catch((e) => {
                    logger.error("[HomeLocationAutoPrompt] detectLocation error:", e);
                });
            });
            return cancel;
        }

        return undefined;
    }, [status, promptDismissed, location.source, detectLocation]);

    return null;
}
