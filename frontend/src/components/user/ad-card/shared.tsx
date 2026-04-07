"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import { formatPrice } from "@/lib/formatters";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import type { AdData } from "@/types/home";
import type { UiAd } from "@/lib/mappers";
import type { Ad } from "@/schemas/ad.schema";

export type AdCardData = AdData | UiAd | Ad;

export interface UseAdCardNavigationOptions {
  href?: string;
  onClick?: () => void;
  disableDeclarativeLink?: boolean;
}

export interface UseAdCardBaseOptions extends UseAdCardNavigationOptions {
  ad: AdCardData;
}

interface AdCardLinkWrapperProps {
  href?: string;
  enabled: boolean;
  children: ReactNode;
}

export function useAdCardNavigation({
  href,
  onClick,
  disableDeclarativeLink = false,
}: UseAdCardNavigationOptions) {
  const router = useRouter();
  const useDeclarativeLink = Boolean(href && !onClick && !disableDeclarativeLink);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (href) {
      void router.push(href);
    }
  };

  return { useDeclarativeLink, handleCardClick };
}

export function AdCardLinkWrapper({ href, enabled, children }: AdCardLinkWrapperProps) {
  if (!enabled || !href) {
    return <>{children}</>;
  }
  return (
    <Link href={href} className="block w-full">
      {children}
    </Link>
  );
}

export function toAdRecord(ad: AdCardData): Record<string, unknown> {
  return ad as Record<string, unknown>;
}

export function resolveAdImageUrl(adRecord: Record<string, unknown>): string {
  const candidateImage =
    (typeof adRecord.image === "string" ? adRecord.image : undefined) ||
    (Array.isArray(adRecord.images) && typeof adRecord.images[0] === "string"
      ? adRecord.images[0]
      : undefined);

  return toSafeImageSrc(candidateImage, "");
}

export function resolveAdId(adRecord: Record<string, unknown>): string {
  return String(adRecord.id || adRecord._id || "");
}

export function useAdCardBase({
  ad,
  href,
  onClick,
  disableDeclarativeLink = false,
}: UseAdCardBaseOptions) {
  const { useDeclarativeLink, handleCardClick } = useAdCardNavigation({
    href,
    onClick,
    disableDeclarativeLink,
  });
  const adRecord = toAdRecord(ad);

  return {
    adRecord,
    imageUrl: resolveAdImageUrl(adRecord),
    adId: resolveAdId(adRecord),
    useDeclarativeLink,
    handleCardClick,
  };
}

export function getPlanBadge(ad: AdCardData, className?: string) {
  const adRecord = toAdRecord(ad);
  const isBoosted = adRecord.isBoosted === true;

  const badgeClasses = cn("border-0 text-2xs shadow-lg flex items-center", className);
  
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
}

export function AdCardPriceDisplay({ price, className }: { price: number; className?: string }) {
  return (
    <div className={cn("font-bold text-green-600", className)}>
      {price === 0 ? "Free" : formatPrice(price)}
    </div>
  );
}
