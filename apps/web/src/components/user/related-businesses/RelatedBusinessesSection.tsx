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
        description: "Businesses offering related live services near this listing.",
        empty: "No nearby service centers matched this service category yet.",
      };
    case "spare_part":
      return {
        title: "Nearby Repair Services",
        description: "Service centers near this listing that offer relevant live services.",
        empty: "No nearby repair services matched this spare-part category yet.",
      };
    case "ad":
    default:
      return {
        title: "Nearby Repair Services",
        description: "Service centers near this listing that offer relevant live services.",
        empty: "No nearby repair services matched this category yet.",
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
        description={sectionCopy.description}
        emptyCopy={sectionCopy.empty}
        formatDistance={formatDistance}
      />
    );
  }

  return (
    <section id="nearby-repair-services" className="mt-4 md:mt-6 px-3.5 md:px-0">
      <div className="mb-4 md:mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold md:text-xl text-foreground">{sectionCopy.title}</h2>
          <p className="mt-0.5 text-xs text-foreground-subtle hidden md:block">
            {sectionCopy.description}
          </p>
        </div>
        {!isLoading && businesses.length > 0 ? (
          <div className="hidden gap-2 md:flex">
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-xl border-slate-200"
              onClick={() => scrollCarousel("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-xl border-slate-200"
              onClick={() => scrollCarousel("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[320px] w-72 flex-shrink-0 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {!isLoading && isError ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            Unable to load nearby service centers
          </div>
          <p className="mt-1 text-amber-700">
            Try again to check nearby businesses with matching live services.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 rounded-xl border-amber-300 bg-transparent text-amber-800 hover:bg-amber-100"
            onClick={() => void refetch()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && !normalizedContext.canSearch ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-foreground-tertiary">
          Nearby service-center suggestions are unavailable because this listing is missing location details.
        </div>
      ) : null}

      {!isLoading && !isError && normalizedContext.canSearch && businesses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-foreground-tertiary">
          {sectionCopy.empty}
        </div>
      ) : null}

      {!isLoading && !isError && businesses.length > 0 ? (
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
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
