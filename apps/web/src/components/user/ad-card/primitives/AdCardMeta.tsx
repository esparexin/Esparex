"use client";

import { memo } from "react";
import { MapPin, Clock } from "@/icons/IconRegistry";
import { formatPrice, formatStableDate } from "@/lib/formatters";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { cn } from "@/components/ui/utils";
import {
  type AdCardData,
  getConditionBadge,
} from "../shared";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Decode common HTML entities so titles like "&amp;" render as "&". */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cleanTitle(raw: string): string {
  return decodeHtmlEntities(raw.replace(/\*\*/g, "").trim());
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

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

  const rawViews = adRecord.views;
  const dashboardViews =
    typeof rawViews === "number"
      ? rawViews
      : rawViews &&
          typeof rawViews === "object" &&
          "total" in rawViews &&
          typeof (rawViews as { total?: unknown }).total === "number"
        ? (rawViews as { total: number }).total
        : 0;

  const isDashboard = variant === "dashboard";
  const isList = variant === "list";

  const locationLabel = resolveListingLocationLabel(ad.location, "brief");
  const conditionBadge = getConditionBadge(ad);

  /* ── Price display ─────────────────────────────────────────────── */
  const isService =
    typeof adRecord.listingType === "string" &&
    adRecord.listingType === "service";

  const priceDisplay = (() => {
    if (isService && (adRecord.priceMin || adRecord.priceMax)) {
      if (adRecord.priceMin && adRecord.priceMax)
        return `${formatPrice(adRecord.priceMin as number)} – ${formatPrice(adRecord.priceMax as number)}`;
      if (adRecord.priceMin)
        return `From ${formatPrice(adRecord.priceMin as number)}`;
      return formatPrice(adRecord.priceMax as number);
    }
    return ad.price === 0 || ad.price === undefined
      ? "Free"
      : formatPrice(ad.price);
  })();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Title — 2-line clamp, clean line-height, proper text size */}
      <h3 className="font-semibold line-clamp-2 text-xs sm:text-sm leading-[1.35] min-h-[2.4rem] text-foreground-secondary tracking-tight">
        {cleanTitle(ad.title)}
      </h3>

      {/* Price + Condition Row */}
      <div className="flex items-center justify-between gap-1.5 mt-0.5 min-h-[1.5rem]">
        {/* Price text — ALWAYS text-green-600 for both numeric price and "Free" */}
        <span
          className={cn(
            "font-bold tracking-tight text-green-600 text-sm sm:text-base",
            isDashboard && "text-primary text-base"
          )}
          aria-label={`Price: ${priceDisplay}`}
        >
          {priceDisplay}
        </span>

        {/* Condition Badge (Power On / Power Off) — rendered right next to price */}
        {!isDashboard && conditionBadge && (
          <div className="shrink-0">{conditionBadge}</div>
        )}
      </div>

      {/* Location + Date Metadata Row — clean layout, no overlap */}
      <div
        className={cn(
          "flex items-center justify-between text-caption text-foreground-tertiary pt-1.5 mt-1 border-t border-slate-100 gap-2 min-w-0",
          isDashboard && "grid grid-cols-2 gap-2 justify-start border-none pt-0 mt-0",
          isList && "border-none pt-0 mt-0"
        )}
      >
        {isDashboard ? (
          <>
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3 text-foreground-subtle shrink-0" aria-hidden="true" />
              <span className="truncate text-caption">
                {"createdAt" in ad
                  ? formatStableDate(ad.createdAt as string)
                  : "Just now"}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-foreground-subtle text-caption">
                {dashboardViews} views
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Location — truncated cleanly with flex-1 min-w-0 */}
            <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
              {locationLabel && (
                <>
                  <MapPin
                    className="h-3 w-3 shrink-0 text-foreground-subtle/80"
                    aria-hidden="true"
                  />
                  <span className="truncate font-medium text-caption block shrink min-w-0">
                    {locationLabel}
                  </span>
                </>
              )}
            </div>

            {/* Date — shrink-0 ml-auto, clear spacing, WCAG AA contrast */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              {!isList && (
                <Clock
                  className="h-3 w-3 shrink-0 text-foreground-subtle/80"
                  aria-hidden="true"
                />
              )}
              <span className="whitespace-nowrap font-medium text-caption text-foreground-subtle">
                {"time" in ad ? (ad as { time: string }).time : "Just now"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

AdCardMeta.displayName = "AdCardMeta";
