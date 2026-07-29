"use client";

import { memo } from "react";
import { AdCardGrid, AdCardList } from "@/components/user/ad-card";
import { type Listing as Service } from "@/lib/api/user/listings";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

export const BrowseServicesCard = memo(function BrowseServicesCard({
  service,
  view = "grid",
  priority = false,
}: {
  service: Service;
  view?: "grid" | "list";
  priority?: boolean;
}) {
  const href = buildPublicListingDetailRoute({
    id: service.id,
    listingType: "service",
    seoSlug: service.seoSlug,
    title: service.title,
  });

  if (view === "list") {
    return <AdCardList ad={service} href={href} priority={priority} />;
  }

  return <AdCardGrid ad={service} href={href} priority={priority} />;
});
