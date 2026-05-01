"use client";

import { memo } from "react";
import { Eye, Clock, MapPin } from "lucide-react";
import { formatPrice, formatStableDate } from "@/lib/formatters";
import {
  resolveListingLocationLabel,
  resolveListingTypeBadge,
} from "@/lib/listings/listingPresentation";
import { cn } from "@/components/ui/utils";
import type { AdData } from "@/types/home";
import type { UiAd } from "@/lib/mappers";
import type { Ad } from "@/schemas/ad.schema";

type AdCardData = AdData | UiAd | Ad;

interface AdCardMetaProps {
  ad: AdCardData;
  className?: string;
  variant?: "default" | "dashboard" | "list";
}

export const AdCardMeta = memo(function AdCardMeta({
  ad,
  className,
  variant = "default",
}: AdCardMetaProps) {
  const adRecord = ad as Record<string, unknown>;
  const listingTypeBadge = resolveListingTypeBadge({
    listingType: adRecord.listingType,
  });

  const rawViews = adRecord.views;
  const dashboardViews =
    typeof rawViews === "number"
      ? rawViews
      : (rawViews &&
        typeof rawViews === "object" &&
        "total" in rawViews &&
        typeof (rawViews as { total?: unknown }).total === "number"
        ? (rawViews as { total: number }).total
        : 0);

  const isDashboard = variant === "dashboard";
  const isList = variant === "list";
  const locationLabel = resolveListingLocationLabel(ad.location, "brief");

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="font-bold line-clamp-2 text-[13px] leading-[1.3] min-h-[2.2rem] text-foreground-secondary tracking-tight">
        {ad.title.replace(/\*\*/g, '')}
      </div>

      <div className="flex items-center justify-between gap-1.5 mt-0.5">
        <span className={cn("font-extrabold tracking-tight", isDashboard ? "text-primary text-lg" : "text-link-dark text-sm md:text-[15px]")}>
          {(() => {
            if (listingTypeBadge.type === "service" && (adRecord.priceMin || adRecord.priceMax)) {
              if (adRecord.priceMin && adRecord.priceMax) return `${formatPrice(adRecord.priceMin as number)} - ${formatPrice(adRecord.priceMax as number)}`;
              if (adRecord.priceMin) return `From ${formatPrice(adRecord.priceMin as number)}`;
              return formatPrice(adRecord.priceMax as number);
            }
            return (ad.price === 0 || ad.price === undefined) ? "Free" : formatPrice(ad.price);
          })()}
        </span>
        {!isDashboard && (
          <span className={cn(
            "shrink-0 text-[10px] font-bold px-2 h-4 flex items-center rounded-full border leading-none tracking-wide uppercase",
            listingTypeBadge.className
          )}>
            {listingTypeBadge.label}
          </span>
        )}
      </div>

      <div className={cn(
        "flex items-center justify-between text-[10px] text-foreground-subtle pt-1 mt-1 border-t border-slate-100/60",
        isDashboard && "grid grid-cols-2 gap-2 justify-start",
        isList && "border-none pt-0 mt-0"
      )}>
        {isDashboard ? (
          <>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {dashboardViews}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="truncate">
                {'createdAt' in ad ? formatStableDate(ad.createdAt as string) : 'Just now'}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {locationLabel && (
                <>
                  <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-foreground-subtle/80" />
                  <span className="truncate font-medium">{locationLabel}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-1">
              {!isList && <Clock className="h-2.5 w-2.5 text-foreground-subtle/80" />}
              <span className="whitespace-nowrap font-medium">{'time' in ad ? ad.time : 'Just now'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

AdCardMeta.displayName = "AdCardMeta";
