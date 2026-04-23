import { useState, useCallback, useRef } from "react";
import type { AppLocation } from "@/types/location";
import { getCurrentLocationResult, type LocationDetectResult } from "@/lib/location/locationService";

interface UnifiedLocationDetectionProps {
    onSuccess?: (location: AppLocation, persist?: boolean) => void;
    onError?: (message: string) => void;
    onPermissionBlocked?: () => void;
    logAnalytics?: (event: any) => void;
}

export type DetectionPhase = "idle" | "requesting" | "precise_search" | "retrying" | "approximate_fallback" | "done" | "error";

export function useUnifiedLocationDetection({
    onSuccess,
    onError,
    onPermissionBlocked,
    logAnalytics
}: UnifiedLocationDetectionProps = {}) {
    const [isDetecting, setIsDetecting] = useState(false);
    const [phase, setPhase] = useState<DetectionPhase>("idle");
    const [feedback, setFeedback] = useState<string | null>(null);
    const detectingRef = useRef(false);

    const detect = useCallback(async (options: { 
        persist?: boolean; 
        force?: boolean;
        allowApproximate?: boolean;
    } = {}): Promise<LocationDetectResult | null> => {
        if (detectingRef.current && !options.force) return null;

        detectingRef.current = true;
        setIsDetecting(true);
        setPhase("requesting");
        setFeedback("Requesting GPS access...");

        // Status ticker simulator for better UX during long timeouts
        const ticker = setInterval(() => {
            setPhase(prev => {
                if (prev === "requesting") return "precise_search";
                if (prev === "precise_search") return "retrying";
                return prev;
            });
            setFeedback(prev => {
                if (prev?.includes("Requesting")) return "Finding satellite signal...";
                if (prev?.includes("Finding")) return "Improving accuracy...";
                if (prev?.includes("Improving")) return "Still searching...";
                return prev;
            });
        }, 4000);

        try {
            const result = await getCurrentLocationResult({
                allowApproximateFallback: options.allowApproximate ?? true,
                maximumAgeMs: options.force ? 0 : 300000,
                timeoutMs: 20000
            });

            clearInterval(ticker);

            if (result.location) {
                setPhase("done");
                setFeedback(null);
                onSuccess?.(result.location, options.persist);
                const mappedSource = result.source === "auto" ? "auto" : result.source === "ip" ? "ip" : "manual";
                const reason = mappedSource === "auto" ? "gps_allowed" : mappedSource === "ip" ? "ip_fallback" : "manual_select";
                
                logAnalytics?.({ 
                    source: mappedSource,
                    city: result.location.city || 'Unknown',
                    state: result.location.state || 'Unknown',
                    reason,
                    eventType: 'location_search'
                });
                return result;
            }

            if (result.failure) {
                setPhase("error");
                if (result.failure.reason === "permission_denied") {
                    onPermissionBlocked?.();
                } else {
                    onError?.(result.failure.message);
                }
                setFeedback(result.failure.message);
            }
            return result;
        } catch (err) {
            clearInterval(ticker);
            setPhase("error");
            const msg = "An unexpected error occurred during detection.";
            onError?.(msg);
            setFeedback(msg);
            return null;
        } finally {
            detectingRef.current = false;
            setIsDetecting(false);
        }
    }, [onSuccess, onError, onPermissionBlocked, logAnalytics]);

    return {
        detect,
        isDetecting,
        phase,
        feedback,
        setFeedback
    };
}
