"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AdCardCover, AdCardMeta, AdCardActions } from "./primitives";
import {
  AdCardLinkWrapper,
  type AdCardData,
  useAdCardBase,
  getPlanBadge,
  AdCardPriceDisplay,
} from "./shared";

export interface AdCardGridProps {
  ad: AdCardData;
  isSaved?: boolean;
  onToggleSave?: (adId: string | number, e: React.MouseEvent) => void;
  onClick?: () => void;
  showBusinessBadge?: boolean;
  priority?: boolean;
  href?: string;
  className?: string;
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
  const { adRecord, imageUrl, adId, useDeclarativeLink, handleCardClick } = useAdCardBase({
    ad,
    href,
    onClick,
    disableDeclarativeLink: Boolean(onToggleSave),
  });

  return (
    <AdCardLinkWrapper href={href} enabled={useDeclarativeLink}>
      <Card
        className={`overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border border-slate-200 bg-white hover:-translate-y-0.5 rounded-xl ${ad.isSpotlight ? 'ring-2 ring-yellow-500 ring-offset-2' : ''} ${className || ''}`}
        onClick={useDeclarativeLink ? undefined : handleCardClick}
      >
        <AdCardCover
          ad={ad}
          imageUrl={imageUrl}
          priority={priority}
          showBusinessBadge={showBusinessBadge}
          className="aspect-square w-full"
        >
          {getPlanBadge(ad, "absolute top-2 left-2 z-10")}
          {onToggleSave && (
            <AdCardActions
              adId={adId}
              isSaved={isSaved}
              onToggleSave={onToggleSave}
              isBusiness={'isBusiness' in adRecord ? Boolean(adRecord.isBusiness) : false}
              showBusinessBadge={showBusinessBadge}
              className="absolute"
            />
          )}
        </AdCardCover>

        {/* Content Section */}
        <CardContent className="p-2.5 md:p-4 space-y-1 md:space-y-2">
          <AdCardPriceDisplay price={ad.price} className="text-emerald-600" />
          <AdCardMeta ad={ad} variant="default" />
        </CardContent>
      </Card>
    </AdCardLinkWrapper>
  );
});

AdCardGrid.displayName = "AdCardGrid";
