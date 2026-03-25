"use client";

import { memo } from "react";
import { Wrench } from "lucide-react";

import { BrowseListingCard } from "@/components/user/BrowseListingCard";
import type { Service } from "@/lib/api/user/services";
import { formatPrice } from "@/lib/formatters";
import { toSafeImageSrc } from "@/lib/image/imageUrl";

export const BrowseServicesCard = memo(function BrowseServicesCard({ service }: { service: Service }) {
  const imageUrl = toSafeImageSrc(service.images?.[0], "");
  const location =
    typeof service.location === "object"
      ? service.location?.city ?? ""
      : String(service.location ?? "");

  const displayPrice =
    service.priceMin && service.priceMax
      ? `${formatPrice(service.priceMin)} – ${formatPrice(service.priceMax)}`
      : service.price
        ? formatPrice(service.price)
        : "Contact for price";

  return (
    <BrowseListingCard
      href={`/services/${service.seoSlug || service.id}`}
      imageUrl={imageUrl}
      title={service.title}
      priceLabel={displayPrice}
      priceClassName="text-blue-600"
      badgeLabel="SERVICE"
      badgeClassName="bg-blue-600 text-white"
      location={location}
      createdAt={service.createdAt}
      fallbackIcon={Wrench}
    />
  );
});
