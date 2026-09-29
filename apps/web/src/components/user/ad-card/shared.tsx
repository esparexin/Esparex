"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Zap, Badge, Power } from "@esparex/ui";
import { cn } from "@/lib/utils";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { resolveListingTypeBadge } from "@/lib/listings/listingPresentation";
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

export type AdCardClickEvent =
  | React.MouseEvent
  | { target?: EventTarget | null; currentTarget?: EventTarget | null };

export type AdCardKeyboardEvent =
  | React.KeyboardEvent
  | { key: string; target?: EventTarget | null; currentTarget?: EventTarget | null; preventDefault?: () => void };

export function useAdCardNavigation({
  href,
  onClick,
  disableDeclarativeLink = false,
}: UseAdCardNavigationOptions) {
  const router = useRouter();
  const useDeclarativeLink = Boolean(href && !onClick && !disableDeclarativeLink);

  const handleCardClick = (e?: AdCardClickEvent) => {
    // If the click originated from a descendant interactive element (button, link, input), let it handle its own event
    const target = e?.target as HTMLElement | undefined;
    const currentTarget = e?.currentTarget as HTMLElement | undefined;
    const interactive = target?.closest?.("button, [role='button'], a, input, select, textarea");
    if (interactive && interactive !== currentTarget) {
      return;
    }
    if (onClick) {
      onClick();
      return;
    }
    if (href) {
      void router.push(href);
    }
  };

  const handleKeyDown = (e: AdCardKeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      const target = e.target as HTMLElement | undefined;
      const currentTarget = e.currentTarget as HTMLElement | undefined;
      const interactive = target?.closest?.("button, [role='button'], a, input, select, textarea");
      if (interactive && interactive !== currentTarget) {
        return;
      }
      e.preventDefault?.();
      handleCardClick();
    }
  };

  return { useDeclarativeLink, handleCardClick, handleKeyDown };
}

export function AdCardLinkWrapper({
  href: _href,
  enabled: _enabled,
  children,
}: AdCardLinkWrapperProps) {
  // Stretched link pattern delegates navigation to the internal title Link,
  // preventing invalid HTML5 <button> inside <a> nesting while maintaining 100% surface clickability.
  return <>{children}</>;
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

  const { useDeclarativeLink, handleCardClick, handleKeyDown } = useAdCardNavigation({
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
    handleKeyDown,
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
    (typeof adRecord.deviceCondition === "string" ? adRecord.deviceCondition : undefined) ||
    (typeof adRecord.condition === "string" ? adRecord.condition : undefined) ||
    (adRecord.specs && typeof adRecord.specs === "object"
      ? (adRecord.specs as Record<string, unknown>).deviceCondition ||
        (adRecord.specs as Record<string, unknown>).condition
      : undefined);

  if (typeof raw === "string" && raw.trim()) {
    const norm = raw.toLowerCase().trim().replace(/[\s_-]+/g, "_");
    if (norm.includes("power_on") || norm.includes("powers_on") || norm === "working") return "power_on";
    if (norm.includes("power_off") || norm.includes("powers_off") || norm === "dead") return "power_off";
  }

  // 2. Fallback title parsing for explicit condition indicators
  const title = typeof ad.title === "string" ? ad.title.toLowerCase() : "";
  if (/powers?\s+on|\(power\s+on\)|-\s*power\s+on/.test(title)) return "power_on";
  if (/powers?\s+off|\(power\s+off\)|-\s*power\s+off/.test(title)) return "power_off";

  return undefined;
}

/* -------------------------------------------------------------------------- */
/* Badge design tokens                                                         */
/* -------------------------------------------------------------------------- */

const BADGE_BASE =
  "border-0 text-tiny font-bold uppercase tracking-wide h-4.5 px-1.5 rounded-md shadow-2xs flex items-center gap-1";

/* -------------------------------------------------------------------------- */
/* Promotion badge (image overlay — top-left)                                 */
/* -------------------------------------------------------------------------- */

export function isSpotlightAd(ad: AdCardData): boolean {
  const r = toAdRecord(ad);
  const status = typeof r.status === "string" ? r.status.toLowerCase() : "";
  if (status && status !== "live" && status !== "active") {
    return false;
  }
  const exp = r.spotlightExpiresAt ? new Date(String(r.spotlightExpiresAt)).getTime() : 0;
  return Boolean(
    ad.isSpotlight || r.isSpotlight || r.spotlight ||
    r.planType === 'SPOTLIGHT' || r.promotionType === 'SPOTLIGHT' || r.promotionType === 'SPOTLIGHT_CAT' ||
    (exp > 0 && exp > Date.now())
  );
}


/* -------------------------------------------------------------------------- */
/* Listing type badge (Ad, Service, Parts)                                   */
/* -------------------------------------------------------------------------- */

export function ListingTypeBadge({
  ad,
  className,
}: {
  ad: AdCardData;
  className?: string;
}): ReactNode | null {
  const adRecord = toAdRecord(ad);
  const typeBadge = resolveListingTypeBadge(adRecord);
  if (!typeBadge) {
    return null;
  }

  return (
    <Badge
      className={cn(
        "border text-tiny font-bold px-1.5 h-4.5 rounded-md uppercase tracking-wide flex items-center shadow-2xs select-none backdrop-blur-xs",
        typeBadge.className,
        className
      )}
      aria-label={`Listing type: ${typeBadge.label}`}
    >
      <span>{typeBadge.label}</span>
    </Badge>
  );
}

/**
 * Determines whether a category pill should be displayed on a listing card.
 * Prevents redundant/duplicate badges when the category matches the listing type badge
 * (e.g. Service badge on thumbnail + duplicate "SERVICE" pill below), or is a generic fallback.
 */
export function shouldDisplayCategoryBadge(
  categoryLabel: string | null | undefined,
  ad: AdCardData
): boolean {
  if (!categoryLabel) return false;

  const normalized = categoryLabel.trim().toLowerCase();
  if (normalized === "general" || normalized === "category" || normalized === "") {
    return false;
  }

  const adRecord = toAdRecord(ad);
  const typeBadge = resolveListingTypeBadge(adRecord);
  const typeLabel = (typeBadge?.label || "").trim().toLowerCase();
  const rawType = (
    typeof adRecord.listingType === "string" ? adRecord.listingType : ""
  ).trim().toLowerCase();

  // If the category label directly matches the listing type badge or listingType property
  if (normalized === typeLabel || normalized === rawType) {
    return false;
  }

  // Handle service plural/singular variations (e.g. "service", "services", "repair services")
  if (
    (typeLabel === "service" || rawType === "service") &&
    (normalized === "service" ||
      normalized === "services" ||
      normalized === "repair services" ||
      normalized === "repair service")
  ) {
    return false;
  }

  // Handle parts variations (e.g. "parts", "spare part", "spare parts", "spare_part", "spare_parts")
  if (
    (typeLabel === "parts" || rawType === "spare_part" || rawType === "spare-part") &&
    (normalized === "parts" ||
      normalized === "part" ||
      normalized === "spare part" ||
      normalized === "spare parts" ||
      normalized === "spare_part" ||
      normalized === "spare_parts")
  ) {
    return false;
  }

  // Handle device / ad variations (e.g. "device", "devices", "ad", "ads")
  if (
    (typeLabel === "device" || typeLabel === "ad" || rawType === "ad" || rawType === "device") &&
    (normalized === "device" || normalized === "devices" || normalized === "ad" || normalized === "ads")
  ) {
    return false;
  }

  return true;
}

export function getPlanBadge(
  ad: AdCardData,
  className?: string
): ReactNode | null {
  if (!isSpotlightAd(ad)) {
    return null;
  }

  const merged = cn(BADGE_BASE, className);

  return (
    <Badge
      className={cn("bg-warning text-warning-foreground font-bold shadow-sm border border-warning/30", merged)}
      aria-label="Spotlight listing"
    >
      <Zap className="h-2.5 w-2.5" aria-hidden="true" />
      Spotlight
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Overlay badge (image overlay — top-right corner of card thumbnail)         */
/*                                                                             */
/* NOTE: This is distinct from profile/StatusBadge.tsx (listing lifecycle     */
/* status text indicator) and CreditPackFormatters.tsx (credit pack status).  */
/* These three serve different domains and must NOT be consolidated.           */
/* -------------------------------------------------------------------------- */

export function getAdOverlayBadge(
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
        className={cn("bg-foreground/90 text-background border-0", merged)}
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
          "bg-warning/10 text-warning border border-warning/20",
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
          "bg-primary/10 text-primary border border-primary/20",
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
        "inline-flex items-center gap-1 text-tiny font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border select-none shrink-0",
        isPowerOn
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-destructive/10 text-destructive border-destructive/20",
        className
      )}
      aria-label={`Condition: ${isPowerOn ? "Power On" : "Power Off"}`}
    >
      {isPowerOn ? (
        <>
          <Zap className="size-3 text-primary fill-primary shrink-0" aria-hidden="true" />
          <span>ON</span>
        </>
      ) : (
        <>
          <Power className="size-3 text-destructive shrink-0" aria-hidden="true" />
          <span>OFF</span>
        </>
      )}
    </span>
  );
}
