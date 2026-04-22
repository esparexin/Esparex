"use client";

import { useMemo } from "react";

import type { Ad } from "@/schemas/ad.schema";
import type { AdDetailNavigateFn } from "@/lib/routeUtils";
import { buildRelatedBusinessesDiscoveryContext } from "@/lib/listings/listingDiscoveryContext";
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
        return buildRelatedBusinessesDiscoveryContext(ad);
    }, [ad]);

    return (
        <RelatedBusinessesSection
            navigateTo={navigateTo}
            context={discoveryContext}
        />
    );
}
