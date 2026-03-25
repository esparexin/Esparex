"use client";

import { useMemo } from "react";

import type { Ad } from "@/schemas/ad.schema";
import type { AdDetailNavigateFn } from "@/lib/routeUtils";
import { extractCityFromLocation, formatLocation } from "@/lib/location/locationService";
import { RelatedBusinessesSection } from "../related-businesses/RelatedBusinessesSection";

interface ListingRelatedBusinessesSectionProps {
    ad: Ad;
    navigateTo: AdDetailNavigateFn;
}

export function ListingRelatedBusinessesSection({
    ad,
    navigateTo,
}: ListingRelatedBusinessesSectionProps) {
    const city = useMemo(
        () => extractCityFromLocation(formatLocation(ad.location)),
        [ad.location]
    );

    return <RelatedBusinessesSection city={city} navigateTo={navigateTo} />;
}
