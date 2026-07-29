"use client";

import { memo } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@esparex/ui";
import { Heart } from "@/icons/IconRegistry";
import { haptics } from "@/lib/haptics";
import { resolveListingCategoryLabel } from "@/lib/listings/listingPresentation";
import { AdCardMeta } from "./primitives";
import { cn } from "@/components/ui/utils";
import {
  AdCardLinkWrapper,
  type AdCardData,
  useAdCardBase,
  getPlanBadge,
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
    prevProps.ad.isSpotlight === nextProps.ad.isSpotlight &&
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
  const { imageUrl, adId, useDeclarativeLink, handleCardClick } =
    useAdCardBase({
      ad,
      href,
      onClick,
      disableDeclarativeLink: Boolean(onToggleSave),
    });

  const categoryLabel = resolveListingCategoryLabel(ad, "General");
  const planBadge = getPlanBadge(ad);

  return (
    <AdCardLinkWrapper href={href} enabled={useDeclarativeLink}>
      <article aria-label={ad.title}>
        <Card
          tabIndex={useDeclarativeLink ? undefined : 0}
          role={useDeclarativeLink ? undefined : "button"}
          className={cn(
            "overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer border border-border rounded-xl group bg-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            ad.isSpotlight ? "ring-2 ring-yellow-500 ring-offset-2" : "",
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
          <CardContent className="p-3 sm:p-4">
            <div className="flex min-w-0 items-start gap-3 sm:gap-5">
              {/* List View Image */}
              <div className="relative h-28 w-28 sm:h-32 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-muted/20">
                {imageUrl ? (
                  <Image
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
                  {onToggleSave && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full hover:bg-muted/40 shrink-0 -mt-1 -mr-1"
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
                          "h-4 w-4 sm:h-5 sm:w-5",
                          isSaved
                            ? "fill-red-500 text-red-500"
                            : "text-foreground-subtle"
                        )}
                      />
                    </Button>
                  )}
                </div>

                <div className="mt-2.5 flex min-w-0 items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] sm:text-tiny font-bold text-foreground-tertiary uppercase tracking-wide">
                    {categoryLabel}
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
