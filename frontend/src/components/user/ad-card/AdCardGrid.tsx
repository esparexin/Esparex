"use client";

import { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { AdCardCover, AdCardMeta, AdCardActions } from "./primitives";
import type { AdData } from "@/types/home";
import type { UiAd } from "@/utils/mappers";
import type { Ad } from "@/schemas/ad.schema";

type AdCardData = AdData | UiAd | Ad;

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
  const router = useRouter();
  const useDeclarativeLink = Boolean(href && !onClick && !onToggleSave);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (href) {
      void router.push(href);
    }
  };

  const adRecord = ad as Record<string, unknown>;
  const candidateImage =
    (typeof adRecord.image === "string" ? adRecord.image : undefined) ||
    (Array.isArray(adRecord.images) && typeof adRecord.images[0] === "string"
      ? adRecord.images[0]
      : undefined);
  const imageUrl = toSafeImageSrc(candidateImage, "");
  const adIdStr = String(adRecord.id || adRecord._id || "");

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (!useDeclarativeLink || !href) return children;
    return (
      <Link href={href} className="block w-full">
        {children}
      </Link>
    );
  };

  return (
    <Wrapper>
      <Card
        className={`overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border border-slate-200 bg-white hover:-translate-y-0.5 rounded-xl ${ad.isSpotlight ? 'ring-2 ring-yellow-500 ring-offset-2' : ''} ${className || ''}`}
        onClick={useDeclarativeLink ? undefined : handleCardClick}
      >
        {/* Cover Section */}
        <AdCardCover
          ad={ad}
          imageUrl={imageUrl}
          priority={priority}
          showBusinessBadge={showBusinessBadge}
          className="aspect-square w-full"
        >
          {onToggleSave && (
            <AdCardActions
              adId={adIdStr}
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
          <AdCardMeta ad={ad} variant="default" />
        </CardContent>
      </Card>
    </Wrapper>
  );
});

AdCardGrid.displayName = "AdCardGrid";
