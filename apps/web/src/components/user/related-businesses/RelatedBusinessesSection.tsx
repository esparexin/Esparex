"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, MapPin, RefreshCcw, Wrench } from "@/icons/IconRegistry";

import { getBusinesses, type Business } from "@/lib/api/user/businesses";
import type { UserPage } from "@/lib/routeUtils";
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  toSafeImageSrc,
} from "@/lib/image/imageUrl";
import {
  type RelatedBusinessesDiscoveryContext,
  normalizeRelatedBusinessesDiscoveryContext,
} from "@/lib/listings/listingDiscoveryContext";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@esparex/ui";
import { queryKeys } from "@/hooks/queries/queryKeys";

import { SafeImage } from "@/components/ui/SafeImage";

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
    const scrollAmount = variant === "sidebar" ? 180 : 320;
    if (variant === "sidebar") {
      carouselRef.current.scrollBy({
        top: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    } else {
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (variant === "sidebar") {
    return (
      <div className="space-y-3 pt-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800">{sectionCopy.title}</h3>
            <p className="text-2xs text-slate-500 line-clamp-1">{sectionCopy.description}</p>
          </div>
          {!isLoading && businesses.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7 rounded-lg border-slate-200"
                onClick={() => scrollCarousel("left")}
                aria-label="Previous services"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7 rounded-lg border-slate-200"
                onClick={() => scrollCarousel("right")}
                aria-label="Next services"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-14 w-full animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : null}

        {!isLoading && isError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            <span>Unable to load nearby services.</span>
          </div>
        ) : null}

        {!isLoading && !isError && businesses.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-2xs text-slate-500">
            {sectionCopy.empty}
          </div>
        ) : null}

        {!isLoading && !isError && businesses.length > 0 ? (
          <div
            ref={carouselRef}
            className="flex flex-col gap-2 max-h-[220px] overflow-y-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {businesses.map((business) => {
              const distanceLabel = formatDistance(business.distanceKm);
              const locationLabel = resolveListingLocationLabel(business.location, "brief") || "Nearby";
              const imageSrc = toSafeImageSrc(business.coverImage || business.images?.[0], DEFAULT_IMAGE_PLACEHOLDER);
              const businessIdentifier = (business.slug || business.id || "").toString().trim();
              const businessHref = businessIdentifier ? `/business/${encodeURIComponent(businessIdentifier)}` : "/account/business";

              return (
                <Link
                  key={business.id}
                  href={businessHref}
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:bg-slate-50/60 transition-all group"
                >
                  <div className="relative size-10 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60">
                    <SafeImage
                      src={imageSrc}
                      alt={business.name}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="40px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                      {business.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-2xs text-slate-500 mt-0.5">
                      <span className="text-amber-500 font-semibold flex items-center">★ 4.5</span>
                      <span>·</span>
                      <span className="truncate">{locationLabel}</span>
                      {distanceLabel ? <span>· {distanceLabel}</span> : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}

        <div className="text-center pt-1">
          <Link
            href="/services"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
          >
            <span>View more services</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  const renderCard = (business: Business) => {
    const distanceLabel = formatDistance(business.distanceKm);
    const matchingServicesCount = business.matchingServicesCount || 0;
    const activeServicesCount = business.activeServicesCount || 0;
    const locationLabel = resolveListingLocationLabel(business.location, "full") || "Nearby";
    const imageSrc = toSafeImageSrc(business.coverImage || business.images?.[0], DEFAULT_IMAGE_PLACEHOLDER);
    const businessIdentifier = (business.slug || business.id || "").toString().trim();
    const businessHref = businessIdentifier ? `/business/${encodeURIComponent(businessIdentifier)}` : "/account/business";

    return (
      <Link key={business.id} href={businessHref} className="block shrink-0 group">
        <Card className="w-56 md:w-60 shrink-0 border border-border shadow-2xs rounded-xl bg-card p-2.5 md:p-3 space-y-2 group-hover:border-primary/40 transition-colors">
          <div className="flex items-start gap-2.5">
            <div className="relative size-11 md:size-12 shrink-0 rounded-lg overflow-hidden bg-muted/50 border border-border">
              <SafeImage
                src={imageSrc}
                alt={business.name}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="48px"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="line-clamp-1 text-xs font-bold text-foreground group-hover:text-primary transition-colors flex-1">
                  {business.name}
                </h3>
                {business.status === "live" && (
                  <Badge className="shrink-0 rounded-full bg-blue-50 text-blue-700 px-1.5 py-0.5 text-2xs font-semibold border-none">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-tiny text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                <span className="truncate">{locationLabel}</span>
                {distanceLabel ? <span className="shrink-0">· {distanceLabel}</span> : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex flex-wrap gap-1">
              {matchingServicesCount > 0 ? (
                <Badge variant="secondary" className="rounded-md bg-blue-50 px-1.5 py-0.5 text-2xs font-medium text-blue-700 border-none">
                  {matchingServicesCount} matching
                </Badge>
              ) : activeServicesCount > 0 ? (
                <Badge variant="secondary" className="rounded-md bg-slate-100 px-1.5 py-0.5 text-2xs font-medium text-slate-600 border-none">
                  {activeServicesCount} live
                </Badge>
              ) : null}
            </div>

            <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-md bg-blue-600 group-hover:bg-blue-700 text-white font-semibold text-2xs shrink-0 transition-colors">
              <Wrench className="mr-1 h-3 w-3" />
              View
            </span>
          </div>
        </Card>
      </Link>
    );
  };

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
          {businesses.map(renderCard)}
        </div>
      ) : null}
    </section>
  );
}
