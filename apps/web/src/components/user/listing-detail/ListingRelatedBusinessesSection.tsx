"use client";

import { useMemo } from "react";

import type { Ad } from "@/schemas/ad.schema";
import type { AdDetailNavigateFn } from "@/lib/routeUtils";
import { buildRelatedBusinessesDiscoveryContext } from "@/lib/listings/listingDiscoveryContext";
import { RelatedBusinessesSection } from "../related-businesses/RelatedBusinessesSection";

interface ListingRelatedBusinessesSectionProps {
    ad: Ad;
    navigateTo: AdDetailNavigateFn;
    variant?: "default" | "sidebar";
}

export function ListingRelatedBusinessesSection({
    ad,
    navigateTo,
    variant = "default",
}: ListingRelatedBusinessesSectionProps) {
    const discoveryContext = useMemo(() => {
        return buildRelatedBusinessesDiscoveryContext(ad);
    }, [ad]);

    return (
        <RelatedBusinessesSection
            navigateTo={navigateTo}
            context={discoveryContext}
            variant={variant}
        />
    );
}
