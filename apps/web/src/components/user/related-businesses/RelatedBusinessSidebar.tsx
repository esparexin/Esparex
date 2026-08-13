import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/icons/IconRegistry";
import type { Business } from "@/lib/api/user/businesses";
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  toSafeImageSrc,
} from "@/lib/image/imageUrl";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { Button } from "@esparex/ui";
import { SafeImage } from "@/components/ui/SafeImage";

interface RelatedBusinessSidebarProps {
  businesses: Business[];
  isLoading: boolean;
  isError: boolean;
  title: string;
  description: string;
  emptyCopy: string;
  formatDistance: (distanceKm?: number) => string | null;
}

export function RelatedBusinessSidebar({
  businesses,
  isLoading,
  isError,
  title,
  description,
  emptyCopy,
  formatDistance,
}: RelatedBusinessSidebarProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollVertical = (direction: "up" | "down") => {
    if (!carouselRef.current) return;
    const scrollAmount = 180;
    carouselRef.current.scrollBy({
      top: direction === "up" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <p className="text-2xs text-slate-500 line-clamp-1">{description}</p>
        </div>
        {!isLoading && businesses.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7 rounded-lg border-slate-200"
              onClick={() => scrollVertical("up")}
              aria-label="Previous services"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7 rounded-lg border-slate-200"
              onClick={() => scrollVertical("down")}
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
          {emptyCopy}
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
