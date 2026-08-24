"use client";

import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCcw } from "@/icons/IconRegistry";

import { getBusinesses } from "@/lib/api/user/businesses";
import type { UserPage } from "@/lib/routeUtils";
import {
  type RelatedBusinessesDiscoveryContext,
  normalizeRelatedBusinessesDiscoveryContext,
} from "@/lib/listings/listingDiscoveryContext";
import { Button } from "@esparex/ui";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { RelatedBusinessCard } from "./RelatedBusinessCard";
import { RelatedBusinessSidebar } from "./RelatedBusinessSidebar";

interface RelatedBusinessesSectionProps {
  context: RelatedBusinessesDiscoveryContext;
  variant?: "default" | "sidebar";
  navigateTo?: (
    page: UserPage,
    adId?: string | number,
    category?: string,
    sellerIdOrBusinessId?: string,
    serviceId?: string,
    sellerId?: string,
    sellerType?: "business" | "individual"
  ) => void;
}

const getSectionCopy = (listingType?: string) => {
  switch (listingType) {
    case "service":
      return {
        title: "Other Service Centers Nearby",
        empty: "No nearby service centers matched this service category yet.",
      };
    case "spare_part":
      return {
        title: "Nearby Repair Shops",
        empty: "No nearby repair shops matched this spare-part category yet.",
      };
    case "ad":
    default:
      return {
        title: "Nearby Repair Shops",
        empty: "No nearby repair shops matched this category yet.",
      };
  }
};

const formatDistance = (distanceKm?: number) => {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm)) {
    return null;
  }
  if (distanceKm < 1) {
    return `${Math.max(100, Math.round(distanceKm * 1000))} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
};

export function RelatedBusinessesSection({
  context,
  variant = "default",
  navigateTo: _navigateTo,
}: RelatedBusinessesSectionProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const normalizedContext = useMemo(
    () => normalizeRelatedBusinessesDiscoveryContext(context),
    [context]
  );
  const sectionCopy = getSectionCopy(normalizedContext.listingType);

  const queryParams = normalizedContext.queryParams;

  const {
    data: businesses = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.businesses.nearby(queryParams),
    queryFn: () => getBusinesses(queryParams),
    enabled: normalizedContext.canSearch,
    staleTime: 5 * 60 * 1000,
  });

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = 320;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (variant === "sidebar") {
    return (
      <RelatedBusinessSidebar
        businesses={businesses}
        isLoading={isLoading}
        isError={isError}
        title={sectionCopy.title}
        description=""
        emptyCopy={sectionCopy.empty}
        formatDistance={formatDistance}
      />
    );
  }

  return (
    <section id="nearby-repair-services" className="mt-2 md:mt-4">
      <div className="mb-3 md:mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold md:text-lg text-foreground">{sectionCopy.title}</h3>
        </div>
        {!isLoading && businesses.length > 0 ? (
          <div className="hidden gap-2 md:flex">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-xl border-border hover:bg-muted"
              onClick={() => scrollCarousel("left")}
              aria-label="Previous repair shops"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-xl border-border hover:bg-muted"
              onClick={() => scrollCarousel("right")}
              aria-label="Next repair shops"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[280px] w-64 flex-shrink-0 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : null}

      {!isLoading && isError ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 px-5 py-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Unable to load nearby repair shops
          </div>
          <p className="mt-1 text-xs text-amber-800">
            Try again to check nearby businesses with matching live services.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 rounded-xl border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100"
            onClick={() => void refetch()}
          >
            <RefreshCcw className="mr-2 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && !normalizedContext.canSearch ? (
        <div className="rounded-2xl border border-border bg-muted/40 px-5 py-4 text-xs md:text-sm text-foreground-subtle">
          Nearby repair shop suggestions are unavailable because this listing is missing location details.
        </div>
      ) : null}

      {!isLoading && !isError && normalizedContext.canSearch && businesses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/40 px-5 py-4 text-xs md:text-sm text-foreground-subtle">
          {sectionCopy.empty}
        </div>
      ) : null}

      {!isLoading && !isError && businesses.length > 0 ? (
        <div
          ref={carouselRef}
          className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {businesses.map((business) => (
            <RelatedBusinessCard
              key={business.id}
              business={business}
              distanceLabel={formatDistance(business.distanceKm)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
