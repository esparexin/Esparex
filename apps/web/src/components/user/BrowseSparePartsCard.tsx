"use client";

import { memo } from "react";
import { AdCardGrid, AdCardList } from "@/components/user/ad-card";
import { type Listing as SparePartListing } from "@/lib/api/user/listings";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

export const BrowseSparePartsCard = memo(function BrowseSparePartsCard({
  listing,
  view = "grid",
  priority = false,
}: {
  listing: SparePartListing;
  view?: "grid" | "list";
  priority?: boolean;
}) {
  const href = buildPublicListingDetailRoute({
    id: listing.id,
    listingType: "spare_part",
    seoSlug: listing.seoSlug,
    title: listing.title,
  });

  if (view === "list") {
    return <AdCardList ad={listing} href={href} priority={priority} />;
  }

  return <AdCardGrid ad={listing} href={href} priority={priority} />;
});
