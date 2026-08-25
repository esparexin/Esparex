"use client";

import { memo } from "react";
import { CardContent } from "@/components/ui/card";
import { AdCardCover, AdCardMeta, AdCardActions, AdCardShell } from "./primitives";
import { cn } from "@/components/ui/utils";
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
    prevProps.ad.image === nextProps.ad.image
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
        "duration-200 border border-border bg-card text-card-foreground shadow-2xs rounded-2xl",
        "hover:shadow-xs hover:border-border-hover hover:-translate-y-0.5 transition-all",
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
        className="aspect-[4/3] w-full"
      >
        {/* Favorite button — top-right overlay */}
        <AdCardActions
          adId={adId}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20"
        />
      </AdCardCover>

      {/* Content section */}
      <CardContent className="p-2 sm:p-2.5">
        <AdCardMeta ad={ad} variant="default" />
      </CardContent>
    </AdCardShell>
  );
}, areAdCardGridPropsEqual);

AdCardGrid.displayName = "AdCardGrid";
