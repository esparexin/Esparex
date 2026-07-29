"use client";

import { memo } from "react";
import { MapPin, Clock } from "@/icons/IconRegistry";
import { formatPrice, formatStableDate } from "@/lib/formatters";
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
    <div className={cn("flex flex-col justify-between gap-1.5", className)}>
      {/* Price Row — Standalone bold green price display */}
      <div className="flex items-center justify-between min-h-[1.5rem]">
        <span
          className={cn(
            "font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400",
            isList ? "text-base sm:text-lg" : isDashboard ? "text-base" : "text-sm sm:text-base"
          )}
          aria-label={`Price: ${priceDisplay}`}
        >
          {priceDisplay}
        </span>
      </div>

      {/* Title — De-congested with leading-snug and flexible line-clamp container */}
      <div className="min-h-[2rem] sm:min-h-[2.5rem] flex items-start my-0.5">
        <h3 className={cn(
          "font-semibold line-clamp-2 leading-snug text-slate-800 tracking-tight",
          isList ? "text-xs sm:text-sm" : "text-xs sm:text-small"
        )}>
          {sanitizeListingTitle(ad.title, ad)}
        </h3>
      </div>

      {/* Location + Condition Badge (replaces Date) Metadata Row */}
      <div
        className={cn(
          "flex items-center justify-between text-tiny text-foreground-tertiary pt-1.5 mt-0.5 border-t border-border/40 gap-2 min-w-0",
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

            {/* Condition Badge (Power On / Power Off) — Date removed per specification */}
            {!isDashboard && conditionBadge && (
              <div className="shrink-0 ml-auto flex items-center">
                {conditionBadge}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

AdCardMeta.displayName = "AdCardMeta";
