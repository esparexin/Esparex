"use client";

import { memo } from "react";
import { MapPin, Clock } from "@/icons/IconRegistry";
import { formatPrice, formatStableDate } from "@/lib/formatters";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { cn } from "@/components/ui/utils";
import type { AdCardData } from "../shared";

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

  const isFree = ad.price === 0 || ad.price === undefined;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {/* Title — cleaned of markdown and decoded HTML entities */}
      <div className="font-semibold line-clamp-2 text-small leading-snug min-h-[2.2rem] text-foreground-secondary tracking-tight">
        {cleanTitle(ad.title)}
      </div>

      {/* Price row — price only, no competing badge */}
      <div className="flex items-center mt-0.5">
        <span
          className={cn(
            "font-bold tracking-tight",
            isDashboard ? "text-primary text-base" : "text-sm",
            isFree
              ? "text-foreground-subtle"
              : "text-green-600"
          )}
          aria-label={`Price: ${priceDisplay}`}
        >
          {priceDisplay}
        </span>
      </div>

      {/* Location + date row */}
      <div
        className={cn(
          "flex items-center justify-between text-caption text-foreground-tertiary pt-1 mt-1 border-t border-slate-100/60",
          isDashboard && "grid grid-cols-2 gap-2 justify-start",
          isList && "border-none pt-0 mt-0"
        )}
      >
        {isDashboard ? (
          <>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span className="truncate">
                {"createdAt" in ad
                  ? formatStableDate(ad.createdAt as string)
                  : "Just now"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-foreground-subtle">
                {dashboardViews} views
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Location — min-w prevents flex collapse to "M." on narrow mobile */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {locationLabel && (
                <>
                  <MapPin
                    className="h-2.5 w-2.5 flex-shrink-0 text-foreground-subtle/80"
                    aria-hidden="true"
                  />
                  <span className="truncate font-medium min-w-[40px]">
                    {locationLabel}
                  </span>
                </>
              )}
            </div>

            {/* Date — foreground-subtle without opacity modifier for WCAG AA contrast */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-1">
              {!isList && (
                <Clock
                  className="h-2.5 w-2.5 text-foreground-subtle/80"
                  aria-hidden="true"
                />
              )}
              <span className="whitespace-nowrap font-medium text-foreground-subtle">
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
