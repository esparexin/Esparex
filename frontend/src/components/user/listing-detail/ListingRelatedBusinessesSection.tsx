"use client";

import { useMemo } from "react";

import type { Ad } from "@/schemas/ad.schema";
import type { UserPage } from "@/lib/routeUtils";
import { extractCityFromLocation, formatLocation } from "@/lib/location/locationService";
import { RelatedBusinessesSection } from "../related-businesses/RelatedBusinessesSection";

interface ListingRelatedBusinessesSectionProps {
    ad: Ad;
    navigateTo: (
        page: UserPage,
        adId?: string | number,
        category?: string,
        sellerIdOrBusinessId?: string,
        serviceId?: string,
        sellerId?: string,
        sellerType?: "business" | "individual"
    ) => void;
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
