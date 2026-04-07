"use client";

import { memo } from "react";
import { Wrench } from "lucide-react";

import { BrowseListingCard } from "@/components/user/BrowseListingCard";
import { type Listing as Service } from "@/lib/api/user/listings";
import { formatPrice } from "@/lib/formatters";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

export const BrowseServicesCard = memo(function BrowseServicesCard({
  service,
  view = "grid",
}: {
  service: Service;
  view?: "grid" | "list";
}) {
  const imageUrl = toSafeImageSrc(service.images?.[0], "");
  const location =
    typeof service.location === "object"
      ? service.location?.city ?? ""
      : String(service.location ?? "");

  const displayPrice =
    service.priceMin != null && service.priceMax != null
      ? `${formatPrice(service.priceMin)} – ${formatPrice(service.priceMax)}`
      : service.price
        ? formatPrice(service.price)
        : "Contact for price";

  return (
    <BrowseListingCard
      href={buildPublicListingDetailRoute({
        id: service.id,
        listingType: "service",
        seoSlug: service.seoSlug,
        title: service.title,
      })}
      imageUrl={imageUrl}
      title={service.title}
      priceLabel={displayPrice}
      priceClassName="text-link"
      badgeLabel="SERVICE"
      badgeClassName="bg-blue-600 text-white"
      view={view}
      location={location}
      createdAt={service.createdAt}
      fallbackIcon={Wrench}
    />
  );
});
