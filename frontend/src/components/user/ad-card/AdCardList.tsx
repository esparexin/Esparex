"use client";

import { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Sparkles } from "lucide-react";
import { haptics } from "@/utils/haptics";
import { formatPrice } from "@/utils/formatters";
import { formatLocation } from "@/lib/location/locationService";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { cn } from "@/components/ui/utils";
import type { AdData } from "@/types/home";
import type { UiAd } from "@/utils/mappers";
import type { Ad } from "@/schemas/ad.schema";

type AdCardData = AdData | UiAd | Ad;

export interface AdCardListProps {
  ad: AdCardData;
  isSaved?: boolean;
  onToggleSave?: (adId: string | number, e: React.MouseEvent) => void;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export const AdCardList = memo(function AdCardList({
  ad,
  isSaved = false,
  onToggleSave,
  onClick,
  href,
  className,
}: AdCardListProps) {
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
  const isBoosted = adRecord.isBoosted === true;

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (!useDeclarativeLink || !href) return children;
    return (
      <Link href={href} className="block w-full">
        {children}
      </Link>
    );
  };

  const getPlanBadge = () => {
    if (ad.price === 0) {
      return (
        <Badge className="bg-white/95 text-gray-600 border border-gray-300 text-[10px] md:text-xs shadow-sm">
          FREE
        </Badge>
      );
    }
    const badgeClasses = "border-0 text-[10px] shadow-lg flex items-center";
    if (ad.isSpotlight) {
      return (
        <Badge className={cn("bg-gradient-to-r from-yellow-500 to-orange-500 text-white", badgeClasses)}>
          <Sparkles className="h-2 w-2 mr-0.5" /> ⭐ Spotlight
        </Badge>
      );
    }
    if (isBoosted) {
      return (
        <Badge className={cn("bg-gradient-to-r from-sky-600 to-blue-700 text-white", badgeClasses)}>
          🚀 Boosted
        </Badge>
      );
    }
    return null;
  };

  return (
    <Wrapper>
      <Card
        className={cn(
          "overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer border-slate-100 rounded-2xl group",
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
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100px, 150px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                  <span className="text-[10px]">No Image</span>
                </div>
              )}
              {getPlanBadge() && (
                <div className="absolute top-1 left-1 z-10 scale-75 origin-top-left">
                  {getPlanBadge()}
                </div>
              )}
            </div>

            {/* List View Content */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">{ad.title}</h3>
                  {onToggleSave && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-11 w-11 rounded-full hover:bg-slate-100 -mt-1 -mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        haptics.toggle();
                        onToggleSave(adIdStr, e);
                      }}
                      aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={cn("h-5 w-5", isSaved ? "fill-red-500 text-red-500" : "text-slate-300")} />
                    </Button>
                  )}
                </div>
                <div className="text-xl font-bold text-green-600 mt-1">
                  {ad.price === 0 ? "Free" : formatPrice(ad.price)}
                </div>
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
    </Wrapper>
  );
});

AdCardList.displayName = "AdCardList";
