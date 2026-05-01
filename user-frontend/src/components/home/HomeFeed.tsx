"use client";

import { useMemo } from "react";
import { type HomeAdsPayload } from "@/lib/api/user/listings";
import { useLocationData } from "@/context/LocationContext";
import { getSearchLocationLabel } from "@/lib/location/locationLabels";
import { getLatitude, getLongitude } from "@/lib/location/coordinates";
import { HomeFeedClient } from "./HomeFeedClient";

interface HomeFeedProps {
    initialData?: HomeAdsPayload;
}

/**
 * HomeFeed - Wrapper component that provides a stable key to HomeFeedClient 
 * based on the current location context. This ensures that the feed state 
 * (ads, cursor, etc.) is reset correctly whenever the location changes.
 */
export function HomeFeed({ initialData }: HomeFeedProps) {
    const { location } = useLocationData();
    const latitude = getLatitude(location);
    const longitude = getLongitude(location);
    const locationSearchLabel = useMemo(() => getSearchLocationLabel(location), [location]);
    
    const locationContextKey = useMemo(
        () =>
            [
                location.locationId ?? "",
                locationSearchLabel ?? "",
                location.level ?? "",
                location.source ?? "",
                typeof latitude === "number" ? latitude.toFixed(3) : "",
                typeof longitude === "number" ? longitude.toFixed(3) : "",
            ].join("|"),
        [latitude, location.level, location.locationId, locationSearchLabel, location.source, longitude]
    );

    return (
        <HomeFeedClient 
            key={locationContextKey} 
            initialData={initialData} 
        />
    );
}
