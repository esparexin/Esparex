"use client";

import { memo } from "react";
import { MapPin, Clock } from "@/icons/IconRegistry";
import { formatPrice, formatStableDate, formatShortRelativeTime } from "@/lib/formatters";
import { resolveListingLocationLabel, sanitizeListingTitle } from "@/lib/listings/listingPresentation";
import { cn } from "@/components/ui/utils";
import {
  type AdCardData,
  getConditionBadge,
} from "../shared";

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
    <div className={cn("flex flex-col justify-between gap-1", className)}>
      {/* Price + Condition Badge Row */}
      <div className="flex items-center justify-between min-h-[1.25rem] gap-1.5">
        <span
          className={cn(
            "font-normal sm:font-bold tracking-tight text-emerald-700 dark:text-emerald-400 truncate",
            isList ? "text-body sm:text-h4" : isDashboard ? "text-body sm:text-body-lg" : "text-body sm:text-body-lg"
          )}
          aria-label={`Price: ${priceDisplay}`}
        >
          {priceDisplay}
        </span>
        {!isDashboard && !isList && conditionBadge && (
          <div className="shrink-0 flex items-center">
            {conditionBadge}
          </div>
        )}
      </div>

      {/* Title — De-congested with snug line-height and discrete Geist font size */}
      <div className="min-h-[1.75rem] sm:min-h-[2.25rem] flex items-start">
        <h3 className={cn(
          "font-normal sm:font-semibold line-clamp-2 leading-snug text-foreground tracking-normal",
          isList ? "text-caption sm:text-body" : "text-caption sm:text-body"
        )}>
          {sanitizeListingTitle(ad.title, ad)}
        </h3>
      </div>

      {/* Location + Date Metadata Row */}
      <div
        className={cn(
          "flex items-center justify-between text-tiny text-foreground-tertiary pt-1.5 mt-1 border-t border-border/40 gap-2 min-w-0",
          isDashboard && "grid grid-cols-2 gap-2 justify-start border-none pt-0 mt-0",
          isList && "border-none pt-0 mt-0"
        )}
      >
        {isDashboard ? (
          <>
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3 text-foreground-subtle shrink-0" aria-hidden="true" />
              <span className="truncate text-tiny">
                {"createdAt" in ad
                  ? formatStableDate(ad.createdAt as string)
                  : "Just now"}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-foreground-tertiary text-tiny">
                {dashboardViews} views
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Location — clean display with flex-1 min-w-0 */}
            <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
              {locationLabel && (
                <>
                  <MapPin
                    className="h-3 w-3 shrink-0 text-foreground-subtle"
                    aria-hidden="true"
                  />
                  <span className="truncate font-medium text-tiny block shrink min-w-0 text-foreground-tertiary">
                    {locationLabel}
                  </span>
                </>
              )}
            </div>

            {/* Posted Date */}
            {!isList && (
              <span className="shrink-0 text-tiny text-foreground-tertiary font-normal">
                {"createdAt" in ad && ad.createdAt
                  ? formatShortRelativeTime(ad.createdAt as string)
                  : "Just now"}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
});

AdCardMeta.displayName = "AdCardMeta";
