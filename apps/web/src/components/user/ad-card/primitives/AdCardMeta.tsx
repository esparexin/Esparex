"use client";

import { memo } from "react";
import { MapPin, Clock } from "@/icons/IconRegistry";
import { formatPrice, formatStableDate } from "@/lib/formatters";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { cn } from "@/components/ui/utils";
import {
  type AdCardData,
  getConditionBadge,
  formatCompactCardDate,
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

  const rawDate = "time" in ad ? (ad as { time: string }).time : undefined;
  const compactDate = formatCompactCardDate(rawDate);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Title — Global Token "small" (13px / leading-normal = 1.5). Zero clipping! */}
      <h3 className="font-semibold line-clamp-2 text-small leading-normal text-slate-800 tracking-tight mb-0.5">
        {cleanTitle(ad.title)}
      </h3>

      {/* Price + Condition Row — ALWAYS text-green-600 for both numeric price and "Free" */}
      <div className="flex items-center justify-between gap-1.5 min-h-[1.5rem]">
        <span
          className={cn(
            "font-bold tracking-tight text-green-600 text-body sm:text-h4",
            isDashboard && "text-primary text-base"
          )}
          aria-label={`Price: ${priceDisplay}`}
        >
          {priceDisplay}
        </span>

        {/* Compact Condition Status Chip — dot indicator, lightweight */}
        {!isDashboard && conditionBadge && (
          <div className="shrink-0 ml-auto">{conditionBadge}</div>
        )}
      </div>

      {/* Location + Date Metadata Row — clean layout, no overlap, compact date */}
      <div
        className={cn(
          "flex items-center justify-between text-tiny text-slate-500 pt-1.5 mt-1 border-t border-slate-100 gap-2 min-w-0",
          isDashboard && "grid grid-cols-2 gap-2 justify-start border-none pt-0 mt-0",
          isList && "border-none pt-0 mt-0"
        )}
      >
        {isDashboard ? (
          <>
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
              <span className="truncate text-tiny">
                {"createdAt" in ad
                  ? formatStableDate(ad.createdAt as string)
                  : "Just now"}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-slate-500 text-tiny">
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
                    className="h-3 w-3 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <span className="truncate font-medium text-tiny block shrink min-w-0">
                    {locationLabel}
                  </span>
                </>
              )}
            </div>

            {/* Date — compact date without redundant year, shrink-0 ml-auto */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              {!isList && (
                <Clock
                  className="h-3 w-3 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
              )}
              <span className="whitespace-nowrap font-medium text-tiny text-slate-500">
                {compactDate}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

AdCardMeta.displayName = "AdCardMeta";
