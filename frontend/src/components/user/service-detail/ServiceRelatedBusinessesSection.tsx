"use client";

import type { UserPage } from "@/lib/routeUtils";
import { RelatedBusinessesSection } from "../related-businesses/RelatedBusinessesSection";

interface ServiceRelatedBusinessesSectionProps {
  city?: string;
  navigateTo: (
    page: UserPage,
    adId?: number,
    category?: string,
    businessId?: string,
    serviceId?: string
  ) => void;
}

export function ServiceRelatedBusinessesSection({
  city,
  navigateTo,
}: ServiceRelatedBusinessesSectionProps) {
  return (
    <RelatedBusinessesSection
      city={city}
      navigateTo={(page, _adId, category, sellerIdOrBusinessId) =>
        navigateTo(page as UserPage, undefined, category, sellerIdOrBusinessId)
      }
    />
  );
}
