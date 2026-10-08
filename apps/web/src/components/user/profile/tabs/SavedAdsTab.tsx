"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSavedAdsQuery } from "@/hooks/queries/useListingsQuery";
import { unsaveAd, type SavedAd } from "@/lib/api/user/users";
import { formatPrice, formatDate } from "@/lib/formatters";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { Button, Card, Spinner, EmptyState } from "@esparex/ui";
import { Heart, MapPin, Calendar, ArrowRight } from "@esparex/ui";
import { notify } from "@/lib/feedback";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/queryKeys";

interface SavedAdsTabProps {
  navigateTo: (page: string) => void;
}

export function SavedAdsTab({ navigateTo }: SavedAdsTabProps) {
  const queryClient = useQueryClient();
  const { data: savedAds = [], isLoading, isError } = useSavedAdsQuery();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleUnsave = async (adId: string | number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const idStr = String(adId);
    setRemovingId(idStr);

    try {
      await unsaveAd(idStr);
      queryClient.setQueryData<SavedAd[]>(queryKeys.ads.saved(), (prev = []) =>
        prev.filter((ad) => String(ad.id) !== idStr)
      );
      notify.success("Ad removed from saved");
    } catch {
      notify.error("Failed to remove ad");
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Spinner size="lg" label="Loading saved ads..." />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center shadow-xs">
        <p className="text-body font-semibold text-destructive">Failed to load saved ads</p>
        <p className="text-caption text-destructive/80 mt-1">Please try refreshing the page.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Empty State */}
      {savedAds.length === 0 ? (
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <EmptyState
            icon={Heart}
            title="No saved ads yet"
            description="Ads you bookmark while browsing will appear here."
            action={
              <Button
                type="button"
                onClick={() => navigateTo("browse")}
                className="h-10 rounded-xl px-6 font-semibold text-body shadow-xs cursor-pointer"
              >
                Explore Marketplace
              </Button>
            }
          />
        </Card>
      ) : (
        /* Saved Ads Compact List View */
        <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          {savedAds.map((ad) => {
            const detailHref = buildPublicListingDetailRoute({
              id: ad.id,
              listingType: (ad as Record<string, unknown>).listingType,
              slug: typeof ad.slug === "string" ? ad.slug : undefined,
              title: typeof ad.title === "string" ? ad.title : undefined,
            });
            const imageSrc = toSafeImageSrc(
              ad.images?.[0] || ad.primaryImage || null,
              "/placeholder.svg"
            );
            const location = resolveListingLocationLabel(ad.location, "brief");
            const isRemoving = removingId === String(ad.id);

            return (
              <div
                key={ad.id}
                className="group relative flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Left Thumbnail */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                  <Image
                    src={imageSrc}
                    alt={ad.title}
                    fill
                    sizes="80px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {ad.category && (
                    <span className="absolute bottom-1 left-1 bg-foreground/80 backdrop-blur-xs text-background text-tiny font-semibold px-1.5 py-0.5 rounded">
                      {ad.category}
                    </span>
                  )}
                </div>

                {/* Middle Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-body sm:text-body-lg font-bold text-emerald-700 dark:text-emerald-400 tracking-tight tabular-nums">
                    {formatPrice(ad.price)}
                  </p>
                  <h4 className="text-body font-medium text-foreground truncate mt-0.5 group-hover:text-primary transition-colors">
                    <Link
                      href={detailHref}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xs after:absolute after:inset-0 after:content-[''] after:z-10"
                    >
                      {ad.title}
                    </Link>
                  </h4>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-tiny text-foreground-subtle mt-1">
                    {location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0 text-foreground-subtle" />
                        <span className="truncate">{location}</span>
                      </span>
                    )}
                    {ad.createdAt && (
                      <span className="flex items-center gap-1 text-foreground-subtle shrink-0">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{formatDate(ad.createdAt)}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action: Unsave Button */}
                <div className="relative z-20 flex items-center gap-1.5 shrink-0 ml-1">
                  <button
                    type="button"
                    onClick={(e) => void handleUnsave(ad.id, e)}
                    disabled={isRemoving}
                    aria-label="Remove from saved"
                    title="Remove from saved"
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/20 transition-transform active:scale-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
                  >
                    <Heart className="h-4 w-4 fill-pink-600 dark:fill-pink-400" />
                  </button>
                  <div className="hidden sm:flex h-8 w-8 items-center justify-center text-muted-foreground/50 group-hover:text-primary transition-colors pointer-events-none">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
