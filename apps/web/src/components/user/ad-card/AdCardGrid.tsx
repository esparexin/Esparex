"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AdCardCover, AdCardMeta, AdCardActions } from "./primitives";
import { cn } from "@/components/ui/utils";
import {
  AdCardLinkWrapper,
  type AdCardData,
  useAdCardBase,
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
    prevProps.ad.price === nextProps.ad.price &&
    prevProps.ad.title === nextProps.ad.title &&
    prevProps.ad.isSpotlight === nextProps.ad.isSpotlight &&
    (prevProps.ad as Record<string, unknown>).isFeatured === (nextProps.ad as Record<string, unknown>).isFeatured &&
    (prevProps.ad as Record<string, unknown>).isPremium === (nextProps.ad as Record<string, unknown>).isPremium &&
    (prevProps.ad as Record<string, unknown>).isBoosted === (nextProps.ad as Record<string, unknown>).isBoosted &&
    prevProps.isSaved === nextProps.isSaved &&
    prevProps.priority === nextProps.priority &&
    prevProps.href === nextProps.href &&
    prevProps.showBusinessBadge === nextProps.showBusinessBadge &&
    prevProps.className === nextProps.className
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
    useAdCardBase({
      ad,
      href,
      onClick,
    });

  const isBusiness = Boolean(adRecord.isBusiness);

  return (
    <AdCardLinkWrapper href={resolvedHref} enabled={useDeclarativeLink}>
      {/* article gives screen readers proper document structure for list items */}
      <article aria-label={ad.title}>
        <Card
          tabIndex={useDeclarativeLink ? undefined : 0}
          role={useDeclarativeLink ? undefined : "button"}
          className={cn(
            "overflow-hidden transition-all duration-300 group cursor-pointer",
            "border-border bg-white shadow-premium rounded-2xl",
            "hover:shadow-premium-hover hover:-translate-y-1.5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            ad.isSpotlight &&
              "ring-2 ring-amber-400/30 shadow-[0_8px_30px_rgba(245,158,11,0.15)]",
            className
          )}
          onClick={useDeclarativeLink ? undefined : handleCardClick}
          onKeyDown={
            useDeclarativeLink
              ? undefined
              : (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick();
                  }
                }
          }
        >
          {/* Image section — AdCardCover handles promotion + verified badges internally */}
          <AdCardCover
            ad={ad}
            imageUrl={imageUrl}
            priority={priority}
            showBusinessBadge={showBusinessBadge && isBusiness}
            className="aspect-[4/3] w-full"
          >
            {/* Favorite button — bottom-right overlay */}
            {onToggleSave && (
              <AdCardActions
                adId={adId}
                isSaved={isSaved}
                onToggleSave={onToggleSave}
                isBusiness={isBusiness}
                showBusinessBadge={showBusinessBadge}
                className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2"
              />
            )}
          </AdCardCover>

          {/* Content section */}
          <CardContent className="p-3">
            <AdCardMeta ad={ad} variant="default" />
          </CardContent>
        </Card>
      </article>
    </AdCardLinkWrapper>
  );
}, areAdCardGridPropsEqual);

AdCardGrid.displayName = "AdCardGrid";
