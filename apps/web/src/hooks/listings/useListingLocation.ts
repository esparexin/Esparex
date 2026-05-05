"use client";
 
import { useState, useCallback, useMemo } from "react";
import type { ListingLocation } from "@/types/listing";
import { normalizeListingLocation } from "@/lib/listings/locationUtils";
import type { GeoJSONPoint } from "@/types/location";
 
interface UseListingLocationProps {
    onLocationChange?: (location: ListingLocation | null) => void;
}
 
/**
 * 📍 Unified Location Hook for Listings
 * Enforces `locationId` and canonical structure.
 */
export function useListingLocation({ onLocationChange }: UseListingLocationProps = {}) {
    const [listingLocation, setListingLocation] = useState<ListingLocation | null>(null);
 
    const setLocation = useCallback((
        display: string,
        coordinates: GeoJSONPoint | null | undefined,
        meta?: { city?: string; state?: string; id?: string }
    ) => {
        const normalized = normalizeListingLocation({
            display,
            coordinates,
            city: meta?.city,
            state: meta?.state,
            locationId: meta?.id
        });

        if (!normalized) {
            setListingLocation(null);
            onLocationChange?.(null);
            return;
        }

        const canonicalLocation: ListingLocation = {
            display: normalized.display ?? "",
            city: normalized.city ?? "",
            state: normalized.state ?? "",
            country: normalized.country,
            locationId: normalized.locationId,
            coordinates: normalized.coordinates,
        };

        setListingLocation(canonicalLocation);
        onLocationChange?.(canonicalLocation);
    }, [onLocationChange]);
 
    const clearLocation = useCallback(() => {
        setListingLocation(null);
        onLocationChange?.(null);
    }, [onLocationChange]);
 
    return useMemo(() => ({
        listingLocation,
        setListingLocation,
        setLocation,
        clearLocation,
        locationId: listingLocation?.locationId,
        locationDisplay: listingLocation?.display,
        coordinates: listingLocation?.coordinates
    }), [listingLocation, setListingLocation, setLocation, clearLocation]);
}
