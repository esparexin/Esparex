"use client";

import { useMemo } from "react";

import type { Ad } from "@/schemas/ad.schema";
import type { AdDetailNavigateFn } from "@/lib/routeUtils";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";
import { RelatedBusinessesSection } from "../related-businesses/RelatedBusinessesSection";

interface ListingRelatedBusinessesSectionProps {
    ad: Ad;
    navigateTo: AdDetailNavigateFn;
}

export function ListingRelatedBusinessesSection({
    ad,
    navigateTo,
}: ListingRelatedBusinessesSectionProps) {
    const discoveryContext = useMemo(() => {
        const coordinates =
            ad.location &&
            typeof ad.location === "object" &&
            ad.location.coordinates &&
            typeof ad.location.coordinates === "object" &&
            Array.isArray(ad.location.coordinates.coordinates) &&
            ad.location.coordinates.coordinates.length >= 2
                ? {
                    longitude: Number(ad.location.coordinates.coordinates[0]),
                    latitude: Number(ad.location.coordinates.coordinates[1]),
                }
                : null;

        return {
            city:
                (typeof ad.location === "object" && ad.location?.city) || undefined,
            locationId:
                typeof ad.location === "object"
                    ? normalizeOptionalObjectId(ad.location?.locationId)
                    : undefined,
            categoryId: normalizeOptionalObjectId(ad.categoryId),
            brandId: normalizeOptionalObjectId(ad.brandId),
            excludeBusinessId: normalizeOptionalObjectId(ad.businessId),
            listingType: ad.listingType,
            coordinates,
        };
    }, [ad]);

    return (
        <RelatedBusinessesSection
            navigateTo={navigateTo}
            city={discoveryContext.city}
            locationId={discoveryContext.locationId}
            listingCategoryId={discoveryContext.categoryId}
            brandId={discoveryContext.brandId}
            excludeBusinessId={discoveryContext.excludeBusinessId}
            listingType={discoveryContext.listingType}
            latitude={discoveryContext.coordinates?.latitude}
            longitude={discoveryContext.coordinates?.longitude}
        />
    );
}
