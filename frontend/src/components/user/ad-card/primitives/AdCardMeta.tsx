"use client";

import { memo } from "react";
import { Eye, Clock, MapPin } from "lucide-react";
import { formatPrice, formatStableDate } from "@/lib/formatters";
import { formatLocation } from "@/lib/location/locationService";
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

  // Listing type pill detection
  const isSparesDetected = adRecord.listingType === 'spare_part' || 
                           ad.category === 'spares' || 
                           ('spareParts' in ad && Array.isArray(ad.spareParts) && ad.spareParts.length > 0);
  
  const listingType = isSparesDetected ? 'spare_part' : (adRecord.listingType as string | undefined);
  
  const listingTypeConfig = listingType === 'service'
    ? { label: 'Service', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
    : listingType === 'spare_part'
    ? { label: 'Spare Part', className: 'bg-violet-50 text-violet-700 border-violet-100' }
    : { label: 'Device', className: 'bg-blue-50 text-link-dark border-blue-100' };

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

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="font-semibold line-clamp-2 text-sm leading-snug min-h-[2.4rem] text-slate-800">
        {ad.title.replace(/\*\*/g, '')}
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <span className={cn("font-bold", isDashboard ? "text-primary text-lg" : "text-link text-sm md:text-base")}>
          {(() => {
            if (adRecord.listingType === 'service' && (adRecord.priceMin || adRecord.priceMax)) {
              if (adRecord.priceMin && adRecord.priceMax) return `${formatPrice(adRecord.priceMin as number)} - ${formatPrice(adRecord.priceMax as number)}`;
              if (adRecord.priceMin) return `From ${formatPrice(adRecord.priceMin as number)}`;
              return formatPrice(adRecord.priceMax as number);
            }
            return (ad.price === 0 || ad.price === undefined) ? "Free" : formatPrice(ad.price);
          })()}
        </span>
        {!isDashboard && (
          <span className={cn(
            "shrink-0 text-2xs font-semibold px-1.5 py-0.5 rounded-md border leading-tight",
            listingTypeConfig.className
          )}>
            {listingTypeConfig.label}
          </span>
        )}
      </div>

      <div className={cn(
        "flex items-center justify-between text-2xs text-slate-400 pt-1.5 border-t border-slate-100 mt-0.5",
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
              {formatLocation(ad.location) && (
                <>
                  <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-slate-300" />
                  <span className="truncate">{formatLocation(ad.location)}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-1">
              {!isList && <Clock className="h-2.5 w-2.5 text-slate-300" />}
              <span className="whitespace-nowrap">{'time' in ad ? ad.time : 'Just now'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

AdCardMeta.displayName = "AdCardMeta";
