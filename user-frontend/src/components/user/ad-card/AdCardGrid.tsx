"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { AdCardCover, AdCardMeta, AdCardActions } from "./primitives";
import { cn } from "@/components/ui/utils";
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

  const deviceCondition = adRecord.deviceCondition as string | undefined;
  const isBusiness = Boolean(adRecord.isBusiness);

  return (
    <AdCardLinkWrapper href={href} enabled={useDeclarativeLink}>
      <Card
        className={`overflow-hidden transition-all duration-500 group cursor-pointer border-slate-100 bg-white shadow-premium hover:shadow-premium-hover hover:-translate-y-1.5 rounded-[20px] ${
          ad.isSpotlight
            ? 'ring-2 ring-amber-400/30 shadow-[0_8px_30px_rgba(245,158,11,0.15)]'
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
              isBusiness={isBusiness}
              showBusinessBadge={showBusinessBadge}
              className="absolute"
            />
          )}
        </AdCardCover>

        {/* Content Section */}
        <CardContent className="p-3 space-y-1.5 min-h-[110px] flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {deviceCondition && (
                <Badge className={cn(
                  "border-none font-bold px-2 h-4 text-[9px] rounded-full uppercase tracking-tighter leading-none flex items-center",
                  deviceCondition === 'power_on' ? "bg-green-100/60 text-green-700" : "bg-red-100/60 text-red-700"
                )}>
                  {deviceCondition === 'power_on' ? 'Power On' : 'Power Off'}
                </Badge>
              )}
              {isBusiness && (
                <Badge className="bg-blue-50 text-blue-600 border-blue-100/50 text-[9px] h-4 px-1.5 rounded-full font-bold uppercase tracking-tighter leading-none flex items-center gap-1">
                  <Shield className="h-2 w-2" />
                  Verified
                </Badge>
              )}
            </div>
            <AdCardMeta ad={ad} variant="default" />
          </div>
        </CardContent>
      </Card>
    </AdCardLinkWrapper>
  );
});

AdCardGrid.displayName = "AdCardGrid";
