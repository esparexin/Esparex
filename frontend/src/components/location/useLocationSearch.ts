const LOCATION_SEARCH_DEBOUNCE_MS = 150;

import { useState, useEffect, useRef, useCallback } from "react";
import { searchLocations, type Location } from "@/lib/api/user/locations";
import { getSearchCacheKey, getCacheEntry, setCacheEntry, isCacheAvailable } from "@/lib/locationCache";
import { useLocationStatus, useLocationDispatch } from "@/context/LocationContext";

import {
    type ErrorType,
    type LocationError,
    ERROR_MESSAGES,
    SEARCH_DEBOUNCE_MS,
} from "./locationSelectorCore.helpers";

export function useLocationSearch({
    isOpen,
    isPanel = false,
    query,
    onApplySelection,
    onClose,
}: {
    isOpen: boolean;
    isPanel?: boolean;
    query: string;
    onApplySelection: (loc: Location) => void;
    onClose?: () => void;
}) {
    const { loading: globalDetecting } = useLocationStatus();
    const { detectLocation } = useLocationDispatch();

    const [locations, setLocations] = useState<Location[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<LocationError | null>(null);
    const [showSkeleton, setShowSkeleton] = useState(false);

    const [detectFeedback, setDetectFeedback] = useState<string | null>(null);

    const [retryCount, setRetryCount] = useState(0);
    const [retryNonce, setRetryNonce] = useState(0);

    const abortControllerRef = useRef<AbortController | null>(null);

    const isDetecting = globalDetecting;

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

        if (isCacheAvailable()) {
            const cached = getCacheEntry<Location[]>(getSearchCacheKey(query));
            if (cached && !signal.aborted) {
                setLocations(cached);
                setIsSearching(false);
                setShowSkeleton(false);
                return;
            }
        }

        const skeletonTimer = setTimeout(() => {
            if (!signal.aborted) {
                setShowSkeleton(true);
            }
        }, SEARCH_DEBOUNCE_MS);

        setIsSearching(true);
        const debounce = setTimeout(async () => {
            let requestTimeoutId: ReturnType<typeof setTimeout> | null = null;
            try {
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
        }, LOCATION_SEARCH_DEBOUNCE_MS);

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
        
        const detectedLocation = await detectLocation(true, true);
        if (!detectedLocation) {
            setDetectFeedback("Could not detect current location. Please search manually.");
            return;
        }
        
        setDetectFeedback(null);
        
        // Pass it up to the caller to handle local state (e.g. Post-Ad forms)
        onApplySelection(detectedLocation as unknown as Location);
        
        if (isPanel) onClose?.();
        else onDone?.();
    };

    const setOptions = setLocations;

    const clearSearchSession = useCallback(() => {
        abortControllerRef.current?.abort();
        setOptions([]);
        setIsSearching(false);
        setShowSkeleton(false);
        setSearchError(null);
        setRetryCount(0);
    }, [setOptions]);

    return {
        locations, setLocations: setOptions,
        isSearching, setIsSearching,
        searchError, setSearchError,
        showSkeleton,
        isDetecting,
        detectFeedback, setDetectFeedback,
        retryCount, handleRetry,
        handleDetect,
        clearSearchSession
    };
}
