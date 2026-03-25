"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
