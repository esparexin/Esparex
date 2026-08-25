"use client";

import { memo } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { CardContent } from "@/components/ui/card";
import { resolveListingCategoryLabel } from "@/lib/listings/listingPresentation";
import { AdCardShell, AdCardMeta, AdCardActions } from "./primitives";
import { cn } from "@/components/ui/utils";
import {
  type AdCardData,
  useAdCardBase,
  getPlanBadge,
  getConditionBadge,
  isSpotlightAd,
} from "./shared";

export interface AdCardListProps {
  ad: AdCardData;
  isSaved?: boolean;
  /**
   * IMPORTANT: Stabilize with useCallback at the call site.
   */
  onToggleSave?: (adId: string | number, e: React.MouseEvent) => void;
  onClick?: () => void;
  href?: string;
  priority?: boolean;
  className?: string;
}

function areAdCardListPropsEqual(
  prevProps: AdCardListProps,
  nextProps: AdCardListProps
): boolean {
  return (
    prevProps.ad.id === nextProps.ad.id &&
    prevProps.ad.price === nextProps.ad.price &&
    prevProps.ad.title === nextProps.ad.title &&
    isSpotlightAd(prevProps.ad) === isSpotlightAd(nextProps.ad) &&
    (prevProps.ad as Record<string, unknown>).isFeatured === (nextProps.ad as Record<string, unknown>).isFeatured &&
    (prevProps.ad as Record<string, unknown>).isPremium === (nextProps.ad as Record<string, unknown>).isPremium &&
    (prevProps.ad as Record<string, unknown>).isBoosted === (nextProps.ad as Record<string, unknown>).isBoosted &&
    prevProps.isSaved === nextProps.isSaved &&
    prevProps.priority === nextProps.priority &&
    prevProps.href === nextProps.href &&
    prevProps.className === nextProps.className
  );
}

export const AdCardList = memo(function AdCardList({
  ad,
  isSaved = false,
  onToggleSave,
  onClick,
  href,
  priority = false,
  className,
}: AdCardListProps) {
  const { href: resolvedHref, imageUrl, adId, useDeclarativeLink, handleCardClick } =
    useAdCardBase({
      ad,
      href,
      onClick,
    });

  const categoryLabel = resolveListingCategoryLabel(ad, "General");
  const planBadge = getPlanBadge(ad);
  const conditionBadge = getConditionBadge(ad);

  return (
    <AdCardShell
      ad={ad}
      resolvedHref={resolvedHref}
      useDeclarativeLink={useDeclarativeLink}
      handleCardClick={handleCardClick}
      className={cn(
        "hover:shadow-md hover:-translate-y-0.5 border border-border rounded-xl bg-card text-card-foreground",
        isSpotlightAd(ad) ? "ring-2 ring-amber-400/50 shadow-[0_8px_30px_rgba(245,158,11,0.2)]" : "",
        className
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex min-w-0 items-start gap-3 sm:gap-5">
          {/* List View Image */}
          <div className="relative h-28 w-28 sm:h-32 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-muted/20">
            {imageUrl ? (
              <SafeImage
                src={imageUrl}
                alt={ad.title}
                fill
                priority={priority}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 112px, 144px"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center bg-muted/20 text-foreground-subtle"
                aria-hidden="true"
              >
                <span className="text-tiny text-foreground-tertiary">No Image</span>
              </div>
            )}
            {planBadge && (
              <div className="absolute top-1.5 left-1.5 z-10">
                {planBadge}
              </div>
            )}
          </div>

          {/* List View Content */}
          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 min-h-[7rem] sm:min-h-[8rem]">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <AdCardMeta ad={ad} variant="list" />
              </div>
              <AdCardActions
                adId={adId}
                isSaved={isSaved}
                onToggleSave={onToggleSave}
                className="relative static shrink-0 -mt-1 -mr-1 shadow-none bg-transparent hover:bg-muted/40"
              />
            </div>

            <div className="mt-2.5 flex min-w-0 items-center justify-between gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-tiny font-normal text-muted-foreground uppercase tracking-wide">
                {categoryLabel}
              </span>
              {conditionBadge}
            </div>
          </div>
        </div>
      </CardContent>
    </AdCardShell>
  );
}, areAdCardListPropsEqual);

AdCardList.displayName = "AdCardList";
