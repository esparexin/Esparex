"use client";

import { memo } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { getPlanBadge, type AdCardData } from "../shared";

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
  const status =
    typeof adRecord?.status === "string" ? adRecord.status.toLowerCase() : "";
  const isSold =
    status === "sold" ||
    (typeof customStatus === "string" &&
      customStatus.toLowerCase().includes("sold"));

  // Resolve promotion badge once — hide on sold items per business rules
  const planBadge = isSold ? null : getPlanBadge(ad);

  // Business verification badge
  const showVerifiedBadge =
    Boolean(adRecord?.isBusiness) &&
    Boolean(adRecord?.verified) &&
    showBusinessBadge;

  return (
    <div className={cn("relative overflow-hidden bg-muted/20", className)}>
      {/* Image */}
      {imageUrl ? (
        <SafeImage
          src={imageUrl}
          alt={ad.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            "object-cover transition-transform duration-300 group-hover:scale-105",
            isSold ? "opacity-60" : ""
          )}
        />
      ) : (
        /* Empty / error state */
        <div
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-1.5 text-foreground-subtle/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        </div>
      )}

      {/* Top-Left Overlay Badges (Spotlight / Top Ad / Verified / Custom Status) */}
      {(planBadge || showVerifiedBadge || customStatus) && (
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 flex flex-wrap items-center gap-1 pointer-events-none">
          {planBadge}
          {showVerifiedBadge && (
            <Badge
              className="border border-emerald-200 bg-emerald-50 text-emerald-700 text-tiny font-bold px-1.5 h-4.5 rounded-md uppercase tracking-wide flex items-center gap-1 shadow-2xs"
              aria-label="Verified Business"
            >
              <ShieldCheck className="h-2.5 w-2.5" aria-hidden="true" />
              Verified
            </Badge>
          )}
          {customStatus}
        </div>
      )}

      {children}
    </div>
  );
});

AdCardCover.displayName = "AdCardCover";
