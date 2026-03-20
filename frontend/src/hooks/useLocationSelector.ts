"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useLocationState, useLocationDispatch } from "@/context/LocationContext";
import { toGeoPoint, type GeoJSONPoint } from "@shared/utils/geoUtils";
import { useDismissableLayer } from "@/hooks/useDismissableLayer";

export interface SelectorLocationMeta {
    city?: string;
    state?: string;
    id?: string;
    name?: string;
}

export interface UseLocationSelectorProps {
    mode?: "header" | "local";
    onLocationSelect?: (locationData: {
        city: string;
        state: string;
        display: string;
        coordinates?: GeoJSONPoint | null;
        locationId?: string;
    }) => void;
    initialDisplay?: string;
}

export function useLocationSelector({ mode = "local", onLocationSelect, initialDisplay }: UseLocationSelectorProps = {}) {
    const { location: globalLocation } = useLocationState();
    const { setManualLocation } = useLocationDispatch();

    // UI state for dropdown (mostly for header mode but useful locally too)
    const [showLocationSelector, setShowLocationSelector] = useState(false);
    const locationDropdownRef = useRef<HTMLDivElement>(null);

    // Form/Local state
    const [locationDisplay, setLocationDisplay] = useState(initialDisplay || "");
    const [locationMeta, setLocationMeta] = useState<SelectorLocationMeta | null>(null);
    const [coordinates, setCoordinates] = useState<GeoJSONPoint | null>(null);

    // Pre-populate from global context for local post-ad logic if not set.
    // Scalars extracted here so the effect does NOT depend on the full
    // globalLocation object — object-reference churn caused infinite loops.
    const {
        city: glCity,
        state: glState,
        locationId: glLocationId,
        coordinates: glCoordinates,
        formattedAddress: glFormattedAddress,
    } = globalLocation ?? {};

    const prePopulatedRef = useRef(false);
    useEffect(() => {
        if (mode !== "local") return;
        if (prePopulatedRef.current || locationDisplay) return;
        if (!glCity) return;

        prePopulatedRef.current = true;
        setLocationDisplay(glFormattedAddress || glCity);
        setLocationMeta({
            city: glCity,
            state: glState,
            id: glLocationId,
        });

        if (glCoordinates) {
            try {
                setCoordinates(toGeoPoint(glCoordinates));
            } catch {
                // Ignore — validation handles it on submit.
            }
        }
    }, [
        // ✅ Scalar primitives only — safe against object-identity re-renders.
        // ❌ Never use globalLocation (full object) here.
        glCity,
        glState,
        glLocationId,
        glCoordinates,
        glFormattedAddress,
        locationDisplay,
        mode,
    ]);

    useDismissableLayer({
        isOpen: showLocationSelector,
        containerRef: locationDropdownRef,
        onDismiss: () => setShowLocationSelector(false),
    });

    const handleLocationSelect = useCallback(
        (display: string, rawCoords?: unknown, meta?: SelectorLocationMeta) => {
            let parsedCoords: GeoJSONPoint | null = null;

            if (rawCoords) {
                try {
                    parsedCoords = toGeoPoint(rawCoords);
                } catch {
                    parsedCoords = null;
                }
            }

            setLocationDisplay(display);
            setCoordinates(parsedCoords);
            setLocationMeta(meta ?? null);

            if (mode === "header" && meta?.city && meta?.state) {
                setManualLocation(meta.city, meta.state, meta.name ?? display, meta.id, parsedCoords ?? undefined);
            }

            if (onLocationSelect) {
                onLocationSelect({
                    city: meta?.city || display || "",
                    state: meta?.state || "",
                    display,
                    coordinates: parsedCoords,
                    locationId: meta?.id,
                });
            }

            setShowLocationSelector(false);
        },
        [mode, onLocationSelect, setManualLocation]
    );

    const toggleLocationSelector = useCallback(() => setShowLocationSelector(prev => !prev), []);

    return {
        showLocationSelector,
        setShowLocationSelector,
        locationDropdownRef,
        toggleLocationSelector,

        locationDisplay,
        setLocationDisplay,
        locationMeta,
        setLocationMeta,
        coordinates,
        setCoordinates,

        setLocation: handleLocationSelect,
        handleLocationSelect, // Alias for older usages
        globalLocation
    };
}
