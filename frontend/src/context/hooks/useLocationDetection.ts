"use client";

import { useCallback, useRef } from "react";
import { 
    getCurrentLocationResult, 
    reverseGeocode as reverseGeocodeLocation,
    isGenericDetectedLocation 
} from "@/lib/location/locationService";
import type { AppLocation } from "@/types/location";

interface UseLocationDetectionProps {
    applyResolvedLocation: (nextLocation: AppLocation, persist?: boolean) => void;
    currentSource: AppLocation["source"];
    setStatus: (status: any) => void;
    setDetectError: (err: string | null) => void;
    setPermissionBlockedFlag: (blocked: boolean) => void;
    setShowPermissionBlockedModal: (show: boolean) => void;
    logAnalytics: (data: any) => void;
}

export function useLocationDetection({
    applyResolvedLocation,
    currentSource,
    setStatus,
    setDetectError,
    setPermissionBlockedFlag,
    setShowPermissionBlockedModal,
    logAnalytics
}: UseLocationDetectionProps) {
    const detectingRef = useRef(false);
    const autoDetectedRef = useRef(false);
    const detectDebounceTimersRef = useRef<{ precise: NodeJS.Timeout | null }>({ precise: null });
    const detectDebounceResolversRef = useRef<{ precise?: (value: boolean) => void }>({});

    const runPreciseDetection = useCallback(async (persist = false, force = false): Promise<boolean> => {
        if (currentSource === "manual" && !force) return false;
        
        if (typeof window !== "undefined") {
            const sessionDetected = sessionStorage.getItem("esparex_geo_detected");
            if (sessionDetected === "true" && !force) return false;
        }

        if (autoDetectedRef.current && !force) return false;
        if (typeof window === "undefined" || detectingRef.current) return false;

        detectingRef.current = true;
        setStatus("detecting");
        setDetectError(null);

        try {
            const detectionResult = await getCurrentLocationResult({ mode: "precise" });
            const detected = detectionResult.location;

            if (!detected) {
                setStatus(currentSource === "manual" ? "manual" : "unavailable");
                
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

            autoDetectedRef.current = true;
            applyResolvedLocation(detected, persist);
            return true;
        } catch {
            setStatus(currentSource === "manual" ? "manual" : "unavailable");
            setDetectError("Could not detect current location. Please select manually.");
            return false;
        } finally {
            detectingRef.current = false;
        }
    }, [currentSource, setStatus, setDetectError, setPermissionBlockedFlag, setShowPermissionBlockedModal, logAnalytics, applyResolvedLocation]);

    const detectLocation = useCallback(async (persist = false, force = false): Promise<boolean> => {
        if (force) return runPreciseDetection(persist, force);

        const mode = "precise";
        const existingTimer = detectDebounceTimersRef.current[mode];
        if (existingTimer) clearTimeout(existingTimer);

        const pendingResolver = detectDebounceResolversRef.current[mode];
        if (pendingResolver) pendingResolver(false);

        return new Promise<boolean>((resolve) => {
            detectDebounceResolversRef.current[mode] = resolve;
            detectDebounceTimersRef.current[mode] = setTimeout(async () => {
                detectDebounceTimersRef.current[mode] = null;
                detectDebounceResolversRef.current[mode] = undefined;
                try {
                    resolve(await runPreciseDetection(persist, force));
                } catch {
                    resolve(false);
                }
            }, 180);
        });
    }, [runPreciseDetection]);

    const performReverseGeocode = useCallback(async (lat: number, lng: number) => {
        try {
            const refreshedLocation = await reverseGeocodeLocation(lat, lng);
            if (!refreshedLocation || isGenericDetectedLocation(refreshedLocation)) return;
            applyResolvedLocation({ ...refreshedLocation, source: "auto" }, true);
        } catch {
            /* silent self-heal */
        }
    }, [applyResolvedLocation]);

    return {
        detectLocation,
        performReverseGeocode,
        detectingRef,
        autoDetectedRef,
        detectDebounceTimersRef,
        detectDebounceResolversRef
    };
}
