"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdCardCover, AdCardMeta } from "./primitives";
import { cn } from "@/components/ui/utils";
import {
  AdCardLinkWrapper,
  type AdCardData,
  useAdCardBase,
} from "./shared";

export interface AdCardDashboardProps {
  ad: AdCardData;
  onClick?: () => void;
  showBusinessBadge?: boolean;
  priority?: boolean;
  customStatus?: React.ReactNode;
  actions?: React.ReactNode;
  href?: string;
  className?: string;
}

export const AdCardDashboard = memo(function AdCardDashboard({
  ad,
  onClick,
  showBusinessBadge = true,
  priority = false,
  customStatus,
  actions,
  href,
  className,
}: AdCardDashboardProps) {
  const { imageUrl, useDeclarativeLink, handleCardClick } = useAdCardBase({
    ad,
    href,
    onClick,
    disableDeclarativeLink: Boolean(actions),
  });

  return (
    <AdCardLinkWrapper href={href} enabled={useDeclarativeLink}>
      <Card
        className={cn(
          "overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer border-border/40 bg-card/50 backdrop-blur-sm hover:-translate-y-1",
          ad.isSpotlight ? 'ring-2 ring-yellow-500 ring-offset-2' : '',
          className
        )}
        onClick={useDeclarativeLink ? undefined : handleCardClick}
      >
        <AdCardCover
          ad={ad}
          imageUrl={imageUrl}
          priority={priority}
          showBusinessBadge={showBusinessBadge}
          customStatus={customStatus}
          className="aspect-video w-full"
        >
          {actions && (
            <div className="absolute top-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </AdCardCover>

        <CardContent className="p-2.5 md:p-4 space-y-1 md:space-y-2">
          <Badge variant="secondary" className="mb-1 text-xs font-normal">
            {ad.category}
          </Badge>

          <AdCardMeta ad={ad} variant="dashboard" />
        </CardContent>
      </Card>
    </AdCardLinkWrapper>
  );
});

AdCardDashboard.displayName = "AdCardDashboard";
