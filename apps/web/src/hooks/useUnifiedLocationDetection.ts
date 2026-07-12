import { useState, useCallback, useRef } from "react";
import type { AppLocation } from "@/types/location";
import { 
    detectPreciseLocationGenerator, 
    LOCATION_STATE_MESSAGES,
    type LocationDetectionState,
    type LocationDetectResult 
} from "@/lib/location/locationService";

interface UnifiedLocationDetectionProps {
    onSuccess?: (location: AppLocation, persist?: boolean) => void;
    onError?: (message: string) => void;
    onPermissionBlocked?: () => void;
    logAnalytics?: (data: {
        source: "auto" | "ip" | "manual" | "default";
        city: string;
        state: string;
        reason: string;
        eventType?: "location_search" | "ad_view" | "ad_post";
        locationId?: string;
    }) => void;
}

export type DetectionPhase = LocationDetectionState;

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
        setPhase("checking_permission");
        setFeedback(LOCATION_STATE_MESSAGES["checking_permission"]);

        try {
            const generator = detectPreciseLocationGenerator({
                allowApproximateFallback: options.allowApproximate ?? true,
                maximumAgeMs: options.force ? 0 : 300000,
                timeoutMs: 20000
            });

            let finalResult: LocationDetectResult | null = null;
            let lastState: LocationDetectionState = "checking_permission";
            
            while (true) {
                const { value, done } = await generator.next();
                
                if (done) {
                    finalResult = value as LocationDetectResult;
                    break;
                } else {
                    lastState = value as LocationDetectionState;
                    setPhase(lastState);
                    setFeedback(LOCATION_STATE_MESSAGES[lastState] || null);
                }
            }

            const result = finalResult;

            if (result && result.location) {
                setPhase("location_resolved");
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

            if (result && result.failure) {
                // The generator already yielded the correct error state, so phase and feedback are already set via SSOT
                if (result.failure.reason === "permission_denied") {
                    onPermissionBlocked?.();
                } else {
                    onError?.(LOCATION_STATE_MESSAGES[lastState] || result.failure.message);
                }
            }
            return result;
        } catch {
            setPhase("network_error");
            const msg = LOCATION_STATE_MESSAGES["network_error"];
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
