"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Crown, Star, Zap } from "@/icons/IconRegistry";
import { Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import { formatPrice } from "@/lib/formatters";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import type { AdData } from "@/types/home";
import type { UiAd } from "@/lib/mappers";
import type { Ad } from "@/schemas/ad.schema";

/* -------------------------------------------------------------------------- */
/* Core types                                                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Navigation helpers                                                          */
/* -------------------------------------------------------------------------- */

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

export function AdCardLinkWrapper({
  href,
  enabled,
  children,
}: AdCardLinkWrapperProps) {
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
  href: explicitHref,
  onClick,
  disableDeclarativeLink = false,
}: UseAdCardBaseOptions) {
  const adRecord = toAdRecord(ad);
  const adId = resolveAdId(adRecord);

  // Compute canonical listing detail route if explicit href is not passed
  const resolvedHref =
    explicitHref ||
    (adId
      ? buildPublicListingDetailRoute({
          id: adId,
          listingType: typeof adRecord.listingType === "string" ? adRecord.listingType : undefined,
          seoSlug: typeof adRecord.seoSlug === "string" ? adRecord.seoSlug : undefined,
          title: typeof adRecord.title === "string" ? adRecord.title : undefined,
        })
      : undefined);

  const { useDeclarativeLink, handleCardClick } = useAdCardNavigation({
    href: resolvedHref,
    onClick,
    disableDeclarativeLink,
  });

  return {
    adRecord,
    href: resolvedHref,
    imageUrl: resolveAdImageUrl(adRecord),
    adId,
    useDeclarativeLink,
    handleCardClick,
  };
}

/* -------------------------------------------------------------------------- */
/* Condition resolution (robust multi-source resolution)                     */
/* -------------------------------------------------------------------------- */

export function resolveDeviceCondition(
  ad: AdCardData
): "power_on" | "power_off" | undefined {
  const adRecord = toAdRecord(ad);

  // 1. Direct fields check
  const raw =
    (typeof adRecord.deviceCondition === "string"
      ? adRecord.deviceCondition
      : undefined) ||
    (typeof adRecord.condition === "string"
      ? adRecord.condition
      : undefined) ||
    (adRecord.specs && typeof adRecord.specs === "object"
      ? (adRecord.specs as Record<string, unknown>).deviceCondition ||
        (adRecord.specs as Record<string, unknown>).condition
      : undefined);

  if (typeof raw === "string" && raw.trim()) {
    const norm = raw.toLowerCase().trim().replace(/[\s_-]+/g, "_");
    if (
      norm.includes("power_on") ||
      norm.includes("powers_on") ||
      norm === "working"
    ) {
      return "power_on";
    }
    if (
      norm.includes("power_off") ||
      norm.includes("powers_off") ||
      norm === "dead"
    ) {
      return "power_off";
    }
  }

  // 2. Fallback title parsing for explicit condition indicators
  const title = typeof ad.title === "string" ? ad.title.toLowerCase() : "";
  if (
    title.includes("powers on") ||
    title.includes("power on") ||
    title.includes("(power on)") ||
    title.includes("- power on")
  ) {
    return "power_on";
  }
  if (
    title.includes("powers off") ||
    title.includes("power off") ||
    title.includes("(power off)") ||
    title.includes("- power off")
  ) {
    return "power_off";
  }

  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Date formatting helper for mobile cards (compact current year dates)       */
/* -------------------------------------------------------------------------- */

export function formatCompactCardDate(dateStr: string | undefined): string {
  if (!dateStr) return "Just now";
  const currentYear = new Date().getFullYear().toString();
  const yearRegex = new RegExp(`\\s*${currentYear}\\s*`, "g");
  return dateStr.replace(yearRegex, "").trim() || dateStr;
}

/* -------------------------------------------------------------------------- */
/* Badge design tokens                                                         */
/* -------------------------------------------------------------------------- */

const BADGE_BASE =
  "border-0 text-tiny font-bold uppercase tracking-wide h-5 px-2 rounded-full shadow-sm flex items-center gap-1";

/* -------------------------------------------------------------------------- */
/* Promotion badge (image overlay — top-left)                                 */
/* -------------------------------------------------------------------------- */

export function isSpotlightAd(ad: AdCardData): boolean {
  const adRecord = toAdRecord(ad);
  const spotlightExp = adRecord.spotlightExpiresAt ? new Date(String(adRecord.spotlightExpiresAt)).getTime() : 0;
  return Boolean(
    ad.isSpotlight === true ||
    adRecord.isSpotlight === true ||
    adRecord.spotlight === true ||
    adRecord.planType === 'SPOTLIGHT' ||
    adRecord.promotionType === 'SPOTLIGHT' ||
    adRecord.promotionType === 'SPOTLIGHT_CAT' ||
    (spotlightExp > 0 && spotlightExp > Date.now())
  );
}

export function getPlanBadge(
  ad: AdCardData,
  className?: string
): ReactNode | null {
  const adRecord = toAdRecord(ad);
  const isBoosted = adRecord.isBoosted === true;
  const isFeatured = adRecord.isFeatured === true;
  const isPremium = adRecord.isPremium === true;

  const merged = cn(BADGE_BASE, className);

  if (isSpotlightAd(ad)) {
    return (
      <Badge
        className={cn(
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-sm border border-amber-300/40",
          merged
        )}
        aria-label="Spotlight listing"
      >
        <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
        Spotlight
      </Badge>
    );
  }

  if (isFeatured) {
    return (
      <Badge
        className={cn(
          "bg-gradient-to-r from-purple-600 to-indigo-600 text-white",
          merged
        )}
        aria-label="Featured listing"
      >
        <Crown className="h-2.5 w-2.5" aria-hidden="true" />
        Featured
      </Badge>
    );
  }

  if (isPremium) {
    return (
      <Badge
        className={cn(
          "bg-gradient-to-r from-amber-400 to-yellow-600 text-white",
          merged
        )}
        aria-label="Premium listing"
      >
        <Star className="h-2.5 w-2.5" aria-hidden="true" />
        Premium
      </Badge>
    );
  }

  if (isBoosted) {
    return (
      <Badge
        className={cn(
          "bg-gradient-to-r from-sky-600 to-blue-700 text-white",
          merged
        )}
        aria-label="Boosted listing"
      >
        <Zap className="h-2.5 w-2.5" aria-hidden="true" />
        Boosted
      </Badge>
    );
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Status badge (image overlay — top-right)                                   */
/* -------------------------------------------------------------------------- */

export function getStatusBadge(
  ad: AdCardData,
  className?: string
): ReactNode | null {
  const adRecord = toAdRecord(ad);
  const status =
    typeof adRecord.status === "string" ? adRecord.status.toLowerCase() : "";
  const isReserved = adRecord.isReserved === true;
  const isNew = adRecord.isNew === true;

  const merged = cn(BADGE_BASE, className);

  if (status === "sold") {
    return (
      <Badge
        className={cn("bg-slate-700/90 text-white border-0", merged)}
        aria-label="Listing sold"
      >
        Sold
      </Badge>
    );
  }

  if (isReserved) {
    return (
      <Badge
        className={cn(
          "bg-amber-50 text-amber-700 border border-amber-200",
          merged
        )}
        aria-label="Listing reserved"
      >
        Reserved
      </Badge>
    );
  }

  if (isNew) {
    return (
      <Badge
        className={cn(
          "bg-blue-50 text-blue-700 border border-blue-200",
          merged
        )}
        aria-label="New listing"
      >
        New
      </Badge>
    );
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Compact Status Chip for Condition (Power On / Power Off)                   */
/*                                                                             */
/* Uses a lightweight CSS dot + label indicator to save ~30px horizontal      */
/* width over a bulky pill badge, leaving room for price & location.           */
/* -------------------------------------------------------------------------- */

export function getConditionBadge(
  input: string | AdCardData | undefined,
  className?: string
): ReactNode | null {
  let condition: "power_on" | "power_off" | undefined;

  if (typeof input === "string") {
    const norm = input.toLowerCase().trim().replace(/[\s_-]+/g, "_");
    if (norm.includes("power_on") || norm.includes("powers_on") || norm === "working") {
      condition = "power_on";
    } else if (norm.includes("power_off") || norm.includes("powers_off") || norm === "dead") {
      condition = "power_off";
    }
  } else if (input && typeof input === "object") {
    condition = resolveDeviceCondition(input);
  }

  if (!condition) return null;

  const isPowerOn = condition === "power_on";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border select-none shrink-0",
        isPowerOn
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200",
        className
      )}
      aria-label={`Condition: ${isPowerOn ? "Power On" : "Power Off"}`}
    >
      {isPowerOn ? (
        <>
          <Zap className="size-3 text-emerald-600 fill-emerald-600 shrink-0" aria-hidden="true" />
          <span>ON</span>
        </>
      ) : (
        <>
          <Power className="size-3 text-red-600 shrink-0" aria-hidden="true" />
          <span>OFF</span>
        </>
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Price display (ALWAYS text-green-600 for numeric prices and "Free")        */
/* -------------------------------------------------------------------------- */

export function AdCardPriceDisplay({
  price,
  className,
}: {
  price: number;
  className?: string;
}) {
  const isFree = price === 0;
  return (
    <div
      className={cn(
        "font-bold text-green-600 tracking-tight",
        className
      )}
      aria-label={`Price: ${isFree ? "Free" : formatPrice(price)}`}
    >
      {isFree ? "Free" : formatPrice(price)}
    </div>
  );
}
