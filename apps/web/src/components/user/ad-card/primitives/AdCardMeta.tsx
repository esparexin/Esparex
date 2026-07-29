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

const HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#039;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

/** Decode common HTML entities in a single regex pass to prevent double-unescaping. */
function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str.replace(/&(?:amp|lt|gt|quot|#39|#039|apos|nbsp);/g, (match) => HTML_ENTITY_MAP[match] || match);
}

function cleanTitle(raw: string): string {
  if (!raw) return "";
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
    <div className={cn("flex flex-col justify-between gap-1.5", className)}>
      {/* Price Row — Standalone bold green price display */}
      <div className="flex items-center justify-between min-h-[1.25rem]">
        <span
          className={cn(
            "font-bold tracking-tight text-emerald-600 dark:text-emerald-400",
            isDashboard ? "text-base" : "text-sm"
          )}
          aria-label={`Price: ${priceDisplay}`}
        >
          {priceDisplay}
        </span>
      </div>

      {/* Title — De-congested with leading-relaxed and equalized 2-line height container */}
      <div className="min-h-[2.5rem] sm:min-h-[2.75rem] flex items-start">
        <h3 className="font-medium line-clamp-2 text-xs sm:text-small leading-relaxed text-foreground-secondary tracking-tight">
          {cleanTitle(ad.title)}
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
