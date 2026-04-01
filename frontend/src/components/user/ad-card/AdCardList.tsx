"use client";

import { memo } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { formatLocation } from "@/lib/location/locationService";
import { cn } from "@/components/ui/utils";
import {
  AdCardLinkWrapper,
  type AdCardData,
  useAdCardBase,
  getPlanBadge,
  AdCardPriceDisplay,
} from "./shared";

export interface AdCardListProps {
  ad: AdCardData;
  isSaved?: boolean;
  onToggleSave?: (adId: string | number, e: React.MouseEvent) => void;
  onClick?: () => void;
  href?: string;
  priority?: boolean;
  className?: string;
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
  const { imageUrl, adId, useDeclarativeLink, handleCardClick } = useAdCardBase({
    ad,
    href,
    onClick,
    disableDeclarativeLink: Boolean(onToggleSave),
  });

  return (
    <AdCardLinkWrapper href={href} enabled={useDeclarativeLink}>
      <Card
        className={cn(
          "overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer border-slate-100 rounded-xl group",
          ad.isSpotlight ? 'ring-2 ring-yellow-500 ring-offset-2' : '',
          className
        )}
        onClick={useDeclarativeLink ? undefined : handleCardClick}
      >
        <CardContent className="p-3">
          <div className="flex gap-4">
            {/* List View Image */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={ad.title}
                  fill
                  priority={priority}
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100px, 150px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                  <span className="text-[10px]">No Image</span>
                </div>
              )}
              {getPlanBadge(ad) && (
                <div className="absolute top-1 left-1 z-10 scale-75 origin-top-left">
                  {getPlanBadge(ad)}
                </div>
              )}
            </div>

            {/* List View Content */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <AdCardPriceDisplay price={ad.price} className="text-base md:text-xl" />
                  {onToggleSave && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-11 w-11 rounded-full hover:bg-slate-100 -mt-2 -mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        haptics.toggle();
                        onToggleSave(adId, e);
                      }}
                      aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={cn("h-5 w-5", isSaved ? "fill-red-500 text-red-500" : "text-slate-300")} />
                    </Button>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 mt-1">{ad.title}</h3>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium">{ad.category}</span>
                {formatLocation(ad.location) && (
                  <span className="truncate max-w-[150px]">{formatLocation(ad.location)}</span>
                )}
                <span className="ml-auto whitespace-nowrap">
                  {'time' in ad ? ad.time : "Today"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdCardLinkWrapper>
  );
});

AdCardList.displayName = "AdCardList";
