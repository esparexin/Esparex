import { useState, useEffect, useRef, useCallback } from "react";
import { searchLocations, type Location } from "@/lib/api/user/locations";
import { getCurrentLocationResult } from "@/lib/location/locationService";
import { getSearchCacheKey, getCacheEntry, setCacheEntry, isCacheAvailable } from "@/lib/locationCache";
import { useLocationState, useLocationDispatch } from "@/context/LocationContext";
import {
    type DetectedLocationShape,
    type ErrorType,
    type LocationError,
    ERROR_MESSAGES,
    SEARCH_DEBOUNCE_MS,
    toDetectedSelection
} from "./locationSelectorCore.helpers";

export function useLocationSearch({
    mode,
    isOpen,
    isPanel = false,
    query,
    onApplySelection,
    onClose,
}: {
    mode: "search" | "profile" | "postAd";
    isOpen: boolean;
    isPanel?: boolean;
    query: string;
    onApplySelection: (loc: Location) => void;
    onClose?: () => void;
}) {
    const { loading: globalDetecting } = useLocationState();
    const { detectLocation, detectApproximateLocation } = useLocationDispatch();

    const [locations, setLocations] = useState<Location[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<LocationError | null>(null);
    const [showSkeleton, setShowSkeleton] = useState(false);

    const [localDetecting, setLocalDetecting] = useState(false);
    const [detectFeedback, setDetectFeedback] = useState<string | null>(null);
    const [showApproximateFallback, setShowApproximateFallback] = useState(false);

    const [retryCount, setRetryCount] = useState(0);
    const [retryNonce, setRetryNonce] = useState(0);

    const abortControllerRef = useRef<AbortController | null>(null);

    const isDetecting = mode === "postAd" ? localDetecting : globalDetecting;

    // Search effect
    useEffect(() => {
        const interactionOpen = isPanel || isOpen;
        if (!interactionOpen) return;

        if (query.length < 2) {
            setLocations([]);
            setIsSearching(false);
            setSearchError(null);
            setShowSkeleton(false);
            abortControllerRef.current?.abort();
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setSearchError(null);

        const skeletonTimer = setTimeout(() => {
            if (!signal.aborted) {
                setShowSkeleton(true);
            }
        }, SEARCH_DEBOUNCE_MS);

        setIsSearching(true);
        const debounce = setTimeout(async () => {
            let requestTimeoutId: ReturnType<typeof setTimeout> | null = null;
            try {
                if (isCacheAvailable()) {
                    const cacheKey = getSearchCacheKey(query);
                    const cached = getCacheEntry<Location[]>(cacheKey);
                    if (cached && !signal.aborted) {
                        setLocations(cached);
                        setIsSearching(false);
                        setShowSkeleton(false);
                        clearTimeout(skeletonTimer);
                        return;
                    }
                }

                const timeoutPromise = new Promise<never>((_, reject) => {
                    requestTimeoutId = setTimeout(() => reject(new Error("timeout")), 10000);
                });

                const backendResults = (await Promise.race([
                    searchLocations(query),
                    timeoutPromise,
                ])) as Location[];

                if (!signal.aborted) {
                    setLocations(backendResults);
                    if (isCacheAvailable() && backendResults.length > 0) {
                        setCacheEntry(getSearchCacheKey(query), backendResults);
                    }
                    if (backendResults.length === 0) {
                        setSearchError({
                            type: "not_found",
                            message: ERROR_MESSAGES.not_found,
                            retryable: false,
                        });
                    }
                }
            } catch (errorUnknown) {
                const runtimeError = errorUnknown as Error;
                if (runtimeError.name !== "AbortError" && !signal.aborted) {
                    let errorType: ErrorType = "unknown";
                    const errorStatus = (runtimeError as { response?: { status?: number } }).response?.status;
                    if (runtimeError.message === "timeout") {
                        errorType = "timeout";
                    } else if (!navigator.onLine) {
                        errorType = "network";
                    } else if (typeof errorStatus === "number" && errorStatus >= 500) {
                        errorType = "server";
                    }

                    setSearchError({
                        type: errorType,
                        message: ERROR_MESSAGES[errorType],
                        retryable: true,
                    });

                    if (isCacheAvailable()) {
                        const cached = getCacheEntry<Location[]>(getSearchCacheKey(query));
                        if (cached) setLocations(cached);
                        else setLocations([]);
                    } else {
                        setLocations([]);
                    }
                }
            } finally {
                if (requestTimeoutId) clearTimeout(requestTimeoutId);
                clearTimeout(skeletonTimer);
                setIsSearching(false);
                setShowSkeleton(false);
            }
        }, 300);

        return () => {
            clearTimeout(debounce);
            clearTimeout(skeletonTimer);
            abortControllerRef.current?.abort();
            setIsSearching(false);
            setShowSkeleton(false);
        };
    }, [isOpen, isPanel, query, retryNonce]);

    const handleRetry = useCallback(() => {
        if (retryCount >= 3) {
            setSearchError({
                type: "unknown",
                message: "Maximum retry attempts reached. Please try again later.",
                retryable: false,
            });
            return;
        }
        setRetryCount((prev) => prev + 1);
        setSearchError(null);
        setRetryNonce((prev) => prev + 1);
    }, [retryCount]);

    const handleDetect = async (onDone?: () => void) => {
        setDetectFeedback(null);
        setShowApproximateFallback(false);
        if (mode === "postAd") {
            setLocalDetecting(true);
            try {
                const detectionResult = await getCurrentLocationResult({
                    allowIpFallback: false,
                    allowGeolocationPrompt: true,
                });
                const detected = toDetectedSelection(detectionResult.location as DetectedLocationShape);
                if (!detected?.coordinates) {
                    setDetectFeedback("Could not detect current location. You can try approximate location or search manually.");
                    setShowApproximateFallback(true);
                    return;
                }
                onApplySelection(detected);
                setDetectFeedback(null);
                setShowApproximateFallback(false);
                if (isPanel) onClose?.();
                else onDone?.();
                return;
            } finally {
                setLocalDetecting(false);
            }
        }
        const detected = await detectLocation(true, true);
        if (!detected) {
            setDetectFeedback("Could not detect current location. You can try approximate location or search manually.");
            setShowApproximateFallback(true);
            return;
        }
        setDetectFeedback(null);
        setShowApproximateFallback(false);
        if (isPanel) onClose?.();
        else onDone?.();
    };

    const handleApproximateDetect = async (onDone?: () => void) => {
        setDetectFeedback(null);
        if (mode === "postAd") {
            setLocalDetecting(true);
            try {
                const detectionResult = await getCurrentLocationResult({
                    allowIpFallback: true,
                    allowGeolocationPrompt: false,
                    skipGeolocation: true,
                });
                const detected = toDetectedSelection(detectionResult.location as DetectedLocationShape);
                if (!detected?.coordinates) {
                    setDetectFeedback("Could not detect approximate location. Please search manually.");
                    return;
                }
                onApplySelection(detected);
                setDetectFeedback(null);
                setShowApproximateFallback(false);
                if (isPanel) onClose?.();
                else onDone?.();
                return;
            } finally {
                setLocalDetecting(false);
            }
        }
        const detected = await detectApproximateLocation(true, true);
        if (!detected) {
            setDetectFeedback("Could not detect approximate location. Please search manually.");
            return;
        }
        setDetectFeedback(null);
        setShowApproximateFallback(false);
        if (isPanel) onClose?.();
        else onDone?.();
    };

    const clearSearchSession = useCallback(() => {
        abortControllerRef.current?.abort();
        setOptions([]);
        setIsSearching(false);
        setShowSkeleton(false);
        setSearchError(null);
        setRetryCount(0);
        setLocalDetecting(false);
    }, []);

    const setOptions = setLocations;

    return {
        locations, setLocations: setOptions,
        isSearching, setIsSearching,
        searchError, setSearchError,
        showSkeleton,
        isDetecting,
        detectFeedback, setDetectFeedback,
        showApproximateFallback,
        retryCount, handleRetry,
        handleDetect, handleApproximateDetect,
        clearSearchSession
    };
}
