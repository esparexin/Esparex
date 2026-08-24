"use client";

import React from "react";
import { Clock } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import { RelativeTimeText } from "@/components/common/RelativeTimeText";

export interface MetaBadge {
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

export interface Tag {
  label: string;
  className?: string;
}

interface ListingItemMetaProps {
  status: string;
  rejectionReason?: string;
  totalViews: number;
  showExpiry: boolean;
  expiresAt?: string | Date;
  showCreated: boolean;
  createdAt?: string | Date;
  metaBadges?: MetaBadge[];
  tags?: Tag[];
}

export function ListingItemMeta({
  status,
  rejectionReason,
  totalViews,
  showExpiry,
  expiresAt,
  showCreated,
  createdAt,
  metaBadges = [],
  tags = [],
}: ListingItemMetaProps) {
  return (
    <>
      {status === "rejected" && rejectionReason ? (
        <p className="text-tiny text-destructive line-clamp-1 leading-normal">
          {rejectionReason}
        </p>
      ) : (
        <div className="flex items-center flex-nowrap gap-1 text-tiny text-foreground-subtle leading-normal min-w-0 overflow-hidden">
          <span className="shrink-0">👁 {totalViews}</span>

          {showExpiry && (() => {
            const past = status === "expired";
            return (
              <>
                <span className="opacity-30 shrink-0">•</span>
                <span
                  className={cn(
                    "font-medium shrink-0 flex items-center gap-0.5",
                    past ? "text-destructive" : "text-amber-700"
                  )}
                >
                  <Clock className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">
                    {past ? (
                      <>
                        Expired <RelativeTimeText value={expiresAt!} addSuffix={false} /> ago
                      </>
                    ) : (
                      <>
                        <RelativeTimeText value={expiresAt!} addSuffix={false} /> left
                      </>
                    )}
                  </span>
                </span>
              </>
            );
          })()}

          {showCreated && (
            <>
              <span className="opacity-30 shrink-0">•</span>
              <span className="truncate">
                <RelativeTimeText value={createdAt!} />
              </span>
            </>
          )}

          {metaBadges.map((badge, i) =>
            badge ? (
              <span key={i} className="shrink-0 flex items-center gap-0.5">
                <span className="opacity-30">•</span>
                <span className={cn("flex items-center gap-0.5", badge.className)}>
                  {badge.icon}
                  {badge.label}
                </span>
              </span>
            ) : null
          )}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {tags.map((tag, i) =>
            tag ? (
              <span
                key={i}
                className={cn(
                  "px-1.5 py-px rounded text-tiny font-medium border",
                  tag.className || "bg-muted text-foreground-subtle border-border"
                )}
              >
                {tag.label}
              </span>
            ) : null
          )}
        </div>
      )}
    </>
  );
}
