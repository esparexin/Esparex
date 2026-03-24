"use client";

import { memo } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Building2 } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { AdData } from "@/types/home";
import type { UiAd } from "@/utils/mappers";
import type { Ad } from "@/schemas/ad.schema";

type AdCardData = AdData | UiAd | Ad;

interface AdCardCoverProps {
  ad: AdCardData;
  imageUrl?: string;
  priority?: boolean;
  className?: string;
  showBusinessBadge?: boolean;
  customStatus?: React.ReactNode;
  children?: React.ReactNode;
}

export const AdCardCover = memo(function AdCardCover({
  ad,
  imageUrl,
  priority = false,
  className,
  showBusinessBadge = true,
  customStatus,
  children,
}: AdCardCoverProps) {
  const adRecord = ad as Record<string, unknown>;
  
  const getPlanBadge = () => {
    const isBoosted = adRecord.isBoosted === true;
    if (ad.price === 0) {
      return (
        <Badge className="bg-white/95 text-gray-600 border border-gray-300 text-[10px] md:text-xs shadow-sm">
          FREE
        </Badge>
      );
    }
    const badgeClasses = "border-0 text-[10px] md:text-xs shadow-lg flex items-center";
    if (ad.isSpotlight) {
      return (
        <Badge className={cn("bg-gradient-to-r from-yellow-500 to-orange-500 text-white", badgeClasses)}>
          <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" /> ⭐ Spotlight
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

  const isSold = typeof customStatus === 'string' && customStatus.toLowerCase().includes('sold');
  const isSpares = ad.category === 'spares' || ('spareParts' in ad && Array.isArray(ad.spareParts) && ad.spareParts.length > 0);
  const isPowerOn = 'deviceCondition' in ad && ad.deviceCondition === 'power_on';
  const isPowerOff = 'deviceCondition' in ad && ad.deviceCondition === 'power_off';

  return (
    <div className={cn("relative overflow-hidden bg-muted/20", className)}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={ad.title}
          fill
          priority={priority}
          unoptimized
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className={cn(
            "object-cover transition-transform duration-300 group-hover:scale-105",
            isSold ? "opacity-60" : ""
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
          <span className="text-xs md:text-sm">No Image</span>
        </div>
      )}

      {/* Dashboard Custom Status Badge */}
      {customStatus && (
        <div className="absolute top-2 left-2 z-20">
          {customStatus}
        </div>
      )}

      {/* Spares Badge */}
      {isSpares && (
        <div className={cn("absolute left-1.5 md:left-2 z-10", getPlanBadge() ? "top-8 md:top-9" : "top-1.5 md:top-2")}>
          <Badge className="bg-gray-800/90 text-white border-0 text-[9px] md:text-[10px] shadow-sm hover:bg-gray-900">
            SPARES
          </Badge>
        </div>
      )}

      {/* Device Condition Badge */}
      {(isPowerOn || isPowerOff) && (
        <div className="absolute right-1.5 md:right-2 z-10 top-1.5 md:top-2">
          <Badge className={cn(
            "border-0 text-[9px] md:text-[10px] shadow-sm",
            isPowerOn ? "bg-green-600/90 hover:bg-green-700" : "bg-red-600/90 hover:bg-red-700"
          )}>
            {isPowerOn ? 'POWER ON' : 'POWER OFF'}
          </Badge>
        </div>
      )}

      {/* Plan Badge */}
      {getPlanBadge() && (
        <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 z-10">
          {getPlanBadge()}
        </div>
      )}

      {/* Business Badge */}
      {Boolean(adRecord?.isBusiness) && Boolean(adRecord?.verified) && showBusinessBadge && (
        <div className="absolute top-0 right-0 h-full w-5 md:w-7 bg-gradient-to-b from-green-600 to-emerald-600 flex items-center justify-center shadow-lg z-10">
          <Building2 className="h-3 w-3 md:h-4 md:w-4 text-white transform -rotate-90" />
        </div>
      )}

      {children}
    </div>
  );
});

AdCardCover.displayName = "AdCardCover";
