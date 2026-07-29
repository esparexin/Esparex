"use client";

import { memo } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@esparex/ui";
import { Heart } from "@/icons/IconRegistry";
import { haptics } from "@/lib/haptics";
import {
  resolveListingCategoryLabel,
  resolveListingLocationLabel,
} from "@/lib/listings/listingPresentation";
import { cn } from "@/components/ui/utils";
import {
  AdCardLinkWrapper,
  type AdCardData,
  useAdCardBase,
  getPlanBadge,
  getConditionBadge,
  AdCardPriceDisplay,
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
  const { adRecord, imageUrl, adId, useDeclarativeLink, handleCardClick } =
    useAdCardBase({
      ad,
      href,
      onClick,
      disableDeclarativeLink: Boolean(onToggleSave),
    });

  const deviceCondition = adRecord.deviceCondition as string | undefined;
  const categoryLabel = resolveListingCategoryLabel(ad, "General");
  const locationLabel = resolveListingLocationLabel(ad.location, "brief");
  const conditionBadge = getConditionBadge(deviceCondition);
  const planBadge = getPlanBadge(ad);

  return (
    <AdCardLinkWrapper href={href} enabled={useDeclarativeLink}>
      <article aria-label={ad.title}>
        <Card
          className={cn(
            "overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer border border-border rounded-xl group bg-white",
            ad.isSpotlight ? "ring-2 ring-yellow-500 ring-offset-2" : "",
            className
          )}
          onClick={useDeclarativeLink ? undefined : handleCardClick}
        >
          <CardContent className="p-3">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              {/* List View Image */}
              <div className="relative h-22 w-22 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={ad.title}
                    fill
                    priority={priority}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 88px, 112px"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center bg-muted/20 text-foreground-subtle"
                    aria-hidden="true"
                  >
                    <span className="text-2xs">No Image</span>
                  </div>
                )}
                {planBadge && (
                  <div className="absolute top-1 left-1 z-10 scale-75 origin-top-left">
                    {planBadge}
                  </div>
                )}
              </div>

              {/* List View Content */}
              <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <AdCardPriceDisplay
                      price={ad.price}
                      className="min-w-0 text-base md:text-lg font-bold tracking-tight"
                    />
                    {onToggleSave && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-11 w-11 rounded-full hover:bg-slate-100 -mt-1 -mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          haptics.toggle();
                          onToggleSave(adId, e);
                        }}
                        aria-label={
                          isSaved
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5",
                            isSaved
                              ? "fill-red-500 text-red-500"
                              : "text-foreground-subtle"
                          )}
                        />
                      </Button>
                    )}
                  </div>
                  {conditionBadge && (
                    <div className="flex items-center gap-1.5 mt-0.5 mb-1.5 flex-wrap">
                      {conditionBadge}
                    </div>
                  )}
                  <h3 className="line-clamp-2 break-words font-medium leading-[1.3] text-small text-foreground-secondary tracking-tight">
                    {ad.title}
                  </h3>
                </div>

                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-caption text-foreground-tertiary font-medium">
                  <span className="max-w-full rounded-full bg-slate-100/80 px-2 py-0.5 text-2xs font-bold text-muted-foreground uppercase tracking-wide">
                    {categoryLabel}
                  </span>
                  {locationLabel && (
                    <span className="min-w-0 max-w-full truncate sm:max-w-[150px]">
                      {locationLabel}
                    </span>
                  )}
                  <span className="whitespace-nowrap sm:ml-auto text-foreground-subtle">
                    {"time" in ad ? (ad as { time: string }).time : "Today"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </article>
    </AdCardLinkWrapper>
  );
}, areAdCardListPropsEqual);

AdCardList.displayName = "AdCardList";
