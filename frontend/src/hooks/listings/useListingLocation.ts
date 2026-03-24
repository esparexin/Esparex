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
        coordinates: GeoJSONPoint | null,
        meta?: { city?: string; state?: string; id?: string }
    ) => {
        const normalized = normalizeListingLocation({
            display,
            coordinates,
            city: meta?.city,
            state: meta?.state,
            locationId: meta?.id
        });
        
        setListingLocation(normalized);
        onLocationChange?.(normalized);
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
