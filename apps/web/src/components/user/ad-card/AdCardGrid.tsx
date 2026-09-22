"use client";

import { memo } from "react";
import { CardContent } from "@esparex/ui";
import { AdCardCover, AdCardMeta, AdCardActions, AdCardShell } from "./primitives";
import { cn } from "@/lib/utils";
import {
  type AdCardData,
  useAdCardBase,
  isSpotlightAd,
} from "./shared";

interface AdCardGridProps {
  ad: AdCardData;
  isSaved?: boolean;
  /**
   * IMPORTANT: Stabilize with useCallback at the call site.
   */
  onToggleSave?: (adId: string | number, e: React.MouseEvent) => void;
  onClick?: () => void;
  showBusinessBadge?: boolean;
  priority?: boolean;
  href?: string;
  className?: string;
  responsiveCompactList?: boolean;
}

function areAdCardGridPropsEqual(
  prevProps: AdCardGridProps,
  nextProps: AdCardGridProps
): boolean {
  return (
    prevProps.ad.id === nextProps.ad.id &&
    prevProps.isSaved === nextProps.isSaved &&
    isSpotlightAd(prevProps.ad) === isSpotlightAd(nextProps.ad) &&
    prevProps.ad.title === nextProps.ad.title &&
    prevProps.ad.price === nextProps.ad.price &&
    prevProps.ad.image === nextProps.ad.image &&
    prevProps.responsiveCompactList === nextProps.responsiveCompactList &&
    (prevProps.ad as Record<string, unknown>).listingType === (nextProps.ad as Record<string, unknown>).listingType
  );
}

export const AdCardGrid = memo(function AdCardGrid({
  ad,
  isSaved = false,
  onToggleSave,
  onClick,
  showBusinessBadge = true,
  priority = false,
  href,
  className,
  responsiveCompactList = false,
}: AdCardGridProps) {
  const { adRecord, href: resolvedHref, imageUrl, adId, useDeclarativeLink, handleCardClick } =
    useAdCardBase({ ad, href, onClick });

  const isBusiness = Boolean(adRecord.isBusiness);

  return (
    <AdCardShell
      ad={ad}
      resolvedHref={resolvedHref}
      useDeclarativeLink={useDeclarativeLink}
      handleCardClick={handleCardClick}
      className={cn(
        "duration-200 border border-border bg-card text-card-foreground shadow-2xs transition-all hover:shadow-xs hover:border-border-hover",
        responsiveCompactList
          ? "flex flex-row sm:flex-col items-stretch rounded-xl sm:rounded-2xl"
          : "flex flex-col rounded-2xl hover:-translate-y-0.5",
        isSpotlightAd(ad) &&
          "ring-2 ring-amber-400/50 shadow-xs",
        className
      )}
    >
      {/* Image section — AdCardCover handles promotion + verified badges internally */}
      <AdCardCover
        ad={ad}
        imageUrl={imageUrl}
        priority={priority}
        showBusinessBadge={showBusinessBadge && isBusiness}
        className={cn(
          responsiveCompactList
            ? "w-24 h-24 sm:w-full sm:aspect-[4/3] shrink-0 rounded-l-xl sm:rounded-t-2xl sm:rounded-l-none"
            : "aspect-[4/3] w-full"
        )}
      >
        {/* Favorite button — default overlay when not in responsive compact list mode */}
        {!responsiveCompactList && (
          <AdCardActions
            adId={adId}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20"
          />
        )}
      </AdCardCover>

      {/* Favorite button — placed at top-right of shell for responsive compact list mode */}
      {responsiveCompactList && (
        <AdCardActions
          adId={adId}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20"
        />
      )}

      {/* Content section */}
      <CardContent
        className={cn(
          responsiveCompactList
            ? "flex-1 min-w-0 p-2.5 sm:p-3.5 pr-8 sm:pr-3.5 flex flex-col justify-between"
            : "p-3 pt-2 sm:p-3.5 sm:pt-2.5"
        )}
      >
        <AdCardMeta ad={ad} variant="default" />
      </CardContent>
    </AdCardShell>
  );
}, areAdCardGridPropsEqual);

AdCardGrid.displayName = "AdCardGrid";
