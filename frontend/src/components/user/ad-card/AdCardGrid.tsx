"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AdCardCover, AdCardMeta, AdCardActions } from "./primitives";
import {
  AdCardLinkWrapper,
  type AdCardData,
  useAdCardBase,
  getPlanBadge,
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
        className={`overflow-hidden transition-all duration-300 group cursor-pointer border border-black bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 rounded-2xl ${
          ad.isSpotlight
            ? 'ring-1 ring-yellow-400/60 shadow-[0_4px_20px_rgba(234,179,8,0.12)]'
            : ''
        } ${className || ''}`}
        onClick={useDeclarativeLink ? undefined : handleCardClick}
      >
        <AdCardCover
          ad={ad}
          imageUrl={imageUrl}
          priority={priority}
          showBusinessBadge={showBusinessBadge}
          className="aspect-[4/3] w-full"
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
        <CardContent className="p-3 md:p-4 space-y-1 md:space-y-2">
          <AdCardMeta ad={ad} variant="default" />
        </CardContent>
      </Card>
    </AdCardLinkWrapper>
  );
});

AdCardGrid.displayName = "AdCardGrid";
