"use client";

import { memo } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Building2 } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { AdData } from "@/types/home";
import type { UiAd } from "@/lib/mappers";
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

  return (
    <div className={cn("relative overflow-hidden bg-muted/20", className)}>
      {imageUrl ? (
        <SafeImage
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

      {/* Plan Badge (Spotlight/Boosted Only) */}
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
