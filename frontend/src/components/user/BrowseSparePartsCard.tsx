"use client";

import { memo } from "react";
import { CircuitBoard } from "lucide-react";

import { BrowseListingCard } from "@/components/user/BrowseListingCard";
import { type Listing as SparePartListing } from "@/lib/api/user/listings";
import { formatPrice } from "@/lib/formatters";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

export const BrowseSparePartsCard = memo(function BrowseSparePartsCard({ listing }: { listing: SparePartListing }) {
  const imageUrl = toSafeImageSrc(listing.images?.[0], "");
  const location =
    typeof listing.location === "object"
      ? listing.location?.city ?? ""
      : String(listing.location ?? "");

  return (
    <BrowseListingCard
      href={buildPublicListingDetailRoute({
        id: listing.id,
        listingType: "spare_part",
        seoSlug: listing.seoSlug,
        title: listing.title,
      })}
      imageUrl={imageUrl}
      title={listing.title}
      priceLabel={formatPrice(listing.price)}
      priceClassName="text-teal-700"
      badgeLabel="SPARE PART"
      badgeClassName="bg-teal-600 text-white"
      location={location}
      createdAt={listing.createdAt}
      fallbackIcon={CircuitBoard}
    />
  );
});
