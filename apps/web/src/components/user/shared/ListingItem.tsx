"use client";

import React from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/components/ui/utils";
import { DEFAULT_IMAGE_PLACEHOLDER, toSafeImageSrc } from "@/lib/image/imageUrl";
import {
  ListingItemActions,
} from "./listing-item/ListingItemActions";
import {
  ListingItemMeta,
  type MetaBadge,
  type Tag,
} from "./listing-item/ListingItemMeta";

export type { MetaBadge, Tag };

interface ListingItemProps {
  title: string;
  status: string;
  listingType?: string;
  thumbnail?: string;
  priceLabel: string;
  priceClassName?: string;
  badgeColor?: "blue" | "violet" | "teal";
  rejectionReason?: string;
  createdAt?: string | Date;
  expiresAt?: string | Date;
  views?: number | { total: number; unique?: number; favorites?: number; lastViewedAt?: string };
  likes?: number;
  getStatusBadge: (status: string) => React.ReactNode;
  editHref: string;
  detailHref?: string;
  onDelete: () => void;
  onRenew?: () => void;
  onDeactivate?: () => void;
  onActivate?: () => void;
  onMarkSold?: () => void;
  onBoost?: () => void;
  isSpotlight?: boolean;
  isBoosted?: boolean;
  metaBadges?: MetaBadge[];
  tags?: Tag[];
  priority?: boolean;
  /** When false the status badge is hidden (use on tabs where every item shares the same status). */
  showStatusBadge?: boolean;
  className?: string;
}

type ListingViews = {
  total?: number;
  favorites?: number;
  unique?: number;
  lastViewedAt?: string;
};

export function ListingItem({
  title,
  status,
  listingType = "ad",
  thumbnail,
  priceLabel,
  priceClassName,
  rejectionReason,
  createdAt,
  expiresAt,
  views,
  likes: _likes,
  getStatusBadge,
  editHref,
  detailHref,
  onDelete,
  onRenew,
  onDeactivate,
  onActivate,
  onMarkSold,
  onBoost,
  isSpotlight = false,
  isBoosted: _isBoosted = false,
  metaBadges = [],
  tags = [],
  priority = false,
  showStatusBadge = true,
  className,
}: ListingItemProps) {
  const isAd = listingType.toLowerCase() === "ad";

  // Status flags
  const isActive = status === "live" || status === "active";
  const isDeactivated = status === "deactivated";
  const isPending = status === "pending" || status === "held_for_review";
  const isExpired = status === "expired" || status === "rejected";
  const isSold = status === "sold";

  // Action visibility
  const showEdit = isActive || isDeactivated || isPending;
  const showDeactivate = isActive && Boolean(onDeactivate);
  const showActivate = isDeactivated && Boolean(onActivate);
  const showMarkSold = isAd && (isActive || isExpired) && Boolean(onMarkSold);
  const showRenew = !isAd && (isExpired || isSold) && Boolean(onRenew);
  const showBoost = !isSpotlight && isActive && Boolean(onBoost);
  const showDelete = !isActive;

  const hasOverflowItems =
    showMarkSold || showDeactivate || showActivate || showRenew || showBoost || showDelete;

  // View count
  const viewMetrics: ListingViews | null =
    views && typeof views === "object" ? (views as ListingViews) : null;
  const totalViews = typeof views === "number" ? views : (viewMetrics?.total ?? 0);

  const showExpiry = isActive && Boolean(expiresAt);
  const showCreated = !isActive && Boolean(createdAt);

  return (
    <div
      className={cn(
        "flex gap-3 py-3.5",
        "md:gap-4 md:py-4",
        "border-b border-border last:border-b-0 bg-transparent",
        className
      )}
    >
      {/* ── ZONE 1: Thumbnail (62px / 68px) ── */}
      {detailHref ? (
        <Link href={detailHref} className="shrink-0 self-center group cursor-pointer">
          <div
            className={cn(
              "relative w-[62px] h-[62px]",
              "md:w-[68px] md:h-[68px]",
              "rounded-lg overflow-hidden bg-muted border border-border group-hover:opacity-90 transition-opacity"
            )}
          >
            <SafeImage
              src={toSafeImageSrc(thumbnail, DEFAULT_IMAGE_PLACEHOLDER)}
              alt={title}
              fill
              priority={priority}
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 62px, 68px"
            />
          </div>
        </Link>
      ) : (
        <div
          className={cn(
            "shrink-0 self-center",
            "relative w-[62px] h-[62px]",
            "md:w-[68px] md:h-[68px]",
            "rounded-lg overflow-hidden bg-muted border border-border"
          )}
        >
          <SafeImage
            src={toSafeImageSrc(thumbnail, DEFAULT_IMAGE_PLACEHOLDER)}
            alt={title}
            fill
            priority={priority}
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 62px, 68px"
          />
        </div>
      )}

      {/* ── ZONE 2: Content (Title, Price, Meta) ── */}
      <div className="flex-1 min-w-0 self-center flex flex-col gap-1.5">
        {detailHref ? (
          <Link href={detailHref} className="min-w-0 hover:text-primary transition-colors cursor-pointer">
            <h3 className="text-caption md:text-body font-semibold text-foreground leading-normal line-clamp-1">
              {title}
            </h3>
          </Link>
        ) : (
          <h3 className="text-caption md:text-body font-semibold text-foreground leading-normal line-clamp-1">
            {title}
          </h3>
        )}

        <p
          className={cn(
            "text-body font-semibold md:text-h4 md:font-bold leading-normal",
            priceClassName || "text-emerald-700 font-bold"
          )}
        >
          {priceLabel}
        </p>

        <ListingItemMeta
          status={status}
          rejectionReason={rejectionReason}
          totalViews={totalViews}
          showExpiry={showExpiry}
          expiresAt={expiresAt}
          showCreated={showCreated}
          createdAt={createdAt}
          metaBadges={metaBadges}
          tags={tags}
        />
      </div>

      {/* ── ZONE 3: Actions ── */}
      <ListingItemActions
        status={status}
        title={title}
        detailHref={detailHref}
        editHref={editHref}
        getStatusBadge={getStatusBadge}
        showStatusBadge={showStatusBadge}
        showEdit={showEdit}
        showDeactivate={showDeactivate}
        showActivate={showActivate}
        showMarkSold={showMarkSold}
        showRenew={showRenew}
        showBoost={showBoost}
        showDelete={showDelete}
        hasOverflowItems={hasOverflowItems}
        isSpotlight={isSpotlight}
        isActive={isActive}
        onDelete={onDelete}
        onRenew={onRenew}
        onDeactivate={onDeactivate}
        onActivate={onActivate}
        onMarkSold={onMarkSold}
        onBoost={onBoost}
      />
    </div>
  );
}
