"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, CheckCircle, MapPin, RefreshCcw, Wrench } from "lucide-react";

import { getBusinesses, type Business } from "@/lib/api/user/businesses";
import type { UserPage } from "@/lib/routeUtils";
import { ROUTES } from "@/lib/logic/routes";
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  toSafeImageSrc,
} from "@/lib/image/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/hooks/queries/queryKeys";

interface RelatedBusinessesSectionProps {
  city?: string;
  locationId?: string;
  listingCategoryId?: string;
  brandId?: string;
  excludeBusinessId?: string;
  listingType?: string;
  latitude?: number;
  longitude?: number;
  navigateTo: (
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
  city,
  locationId,
  listingCategoryId,
  brandId,
  excludeBusinessId,
  listingType,
  latitude,
  longitude,
  navigateTo,
}: RelatedBusinessesSectionProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const hasGeoPoint = typeof latitude === "number" && typeof longitude === "number";
  const canSearch = Boolean(city || locationId || hasGeoPoint);
  const sectionCopy = getSectionCopy(listingType);

  const queryParams = useMemo(
    () => ({
      city,
      locationId,
      listingCategoryId,
      brandId,
      excludeBusinessId,
      latitude,
      longitude,
      radiusKm: hasGeoPoint ? 35 : undefined,
      limit: 12,
      serviceOnly: true,
    }),
    [brandId, city, excludeBusinessId, hasGeoPoint, latitude, listingCategoryId, locationId, longitude]
  );

  const {
    data: businesses = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.businesses.nearby(queryParams),
    queryFn: () => getBusinesses(queryParams),
    enabled: canSearch,
    staleTime: 5 * 60 * 1000,
  });

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const renderCard = (business: Business) => {
    const distanceLabel = formatDistance(business.distanceKm);
    const matchingServicesCount = business.matchingServicesCount || 0;
    const activeServicesCount = business.activeServicesCount || 0;

    return (
      <Card
        key={business.id}
        className="w-64 flex-shrink-0 overflow-hidden border-0 shadow-sm rounded-2xl bg-white"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 rounded-t-2xl">
          <Image
            src={toSafeImageSrc(business.coverImage || business.images?.[0], DEFAULT_IMAGE_PLACEHOLDER)}
            alt={business.businessName || business.name}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          {business.verified ? (
            <Badge className="absolute left-2.5 top-2.5 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white border-none">
              <CheckCircle className="mr-1 h-2.5 w-2.5" />
              Verified
            </Badge>
          ) : null}
        </div>

        <CardContent className="space-y-3 p-3.5">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-sm font-bold text-slate-900">
              {business.businessName || business.name}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="h-3 w-3 flex-shrink-0 text-slate-300" />
              <span className="truncate">
                {business.location?.city || business.location?.display || "Nearby"}
              </span>
              {distanceLabel ? <span className="flex-shrink-0">· {distanceLabel}</span> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {matchingServicesCount > 0 ? (
              <Badge variant="secondary" className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border-none">
                {matchingServicesCount} matching
              </Badge>
            ) : null}
            {activeServicesCount > 0 ? (
              <Badge variant="secondary" className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border-none">
                {activeServicesCount} live
              </Badge>
            ) : null}
            {typeof business.trustScore === "number" ? (
              <Badge variant="secondary" className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border-none">
                Trust {business.trustScore}
              </Badge>
            ) : null}
          </div>

          <Button
            size="sm"
            className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-95"
            onClick={() => {
              navigateTo(ROUTES.PUBLIC_PROFILE, undefined, undefined, business.slug || business.id);
            }}
          >
            <Wrench className="mr-1.5 h-3.5 w-3.5" />
            View Service Center
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="mt-8 md:mt-12 px-4 md:px-0">
      <div className="mb-4 md:mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold md:text-xl text-slate-900">{sectionCopy.title}</h2>
          <p className="mt-0.5 text-xs text-slate-400 hidden md:block">
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

      {!isLoading && !isError && !canSearch ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
          Nearby service-center suggestions are unavailable because this listing is missing location details.
        </div>
      ) : null}

      {!isLoading && !isError && canSearch && businesses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
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
