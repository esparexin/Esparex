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
import { Button, Card, Spinner } from "@esparex/ui";
import { Heart, MapPin, Calendar, ArrowRight } from "@/icons/IconRegistry";
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
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Spinner size="lg" label="Loading saved ads..." />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="rounded-2xl border border-red-200/80 bg-red-50/30 p-6 text-center shadow-xs">
        <p className="text-sm font-semibold text-red-700">Failed to load saved ads</p>
        <p className="text-xs text-red-500 mt-1">Please try refreshing the page.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Empty State */}
      {savedAds.length === 0 ? (
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-8 sm:p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 border border-pink-100 mx-auto mb-3.5">
            <Heart className="h-7 w-7 fill-pink-500/20" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No saved ads yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
            Tap the heart icon on any spare part or vehicle listing in the marketplace to save it here for quick access.
          </p>
          <Button
            size="sm"
            onClick={() => navigateTo("browse")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-5 rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            Explore Marketplace
          </Button>
        </Card>
      ) : (
        /* Saved Ads Compact List View */
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {savedAds.map((ad) => {
            const detailHref = buildPublicListingDetailRoute({
              id: ad.id,
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
              <Link
                key={ad.id}
                href={detailHref}
                className="group flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50/80 transition-colors"
              >
                {/* Left Thumbnail */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100/80">
                  <Image
                    src={imageSrc}
                    alt={ad.title}
                    fill
                    sizes="80px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {ad.category && (
                    <span className="absolute bottom-1 left-1 bg-slate-900/80 backdrop-blur-xs text-white text-tiny font-semibold px-1.5 py-0.2 rounded">
                      {ad.category}
                    </span>
                  )}
                </div>

                {/* Middle Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {formatPrice(ad.price)}
                  </p>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800 truncate mt-0.5 group-hover:text-blue-600 transition-colors">
                    {ad.title}
                  </h4>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-tiny text-slate-500 mt-1">
                    {location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">{location}</span>
                      </span>
                    )}
                    {ad.createdAt && (
                      <span className="flex items-center gap-1 text-slate-400 shrink-0">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{formatDate(ad.createdAt)}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action: Unsave Button */}
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <button
                    type="button"
                    onClick={(e) => void handleUnsave(ad.id, e)}
                    disabled={isRemoving}
                    aria-label="Remove from saved"
                    title="Remove from saved"
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 border border-pink-100 transition-transform active:scale-90"
                  >
                    <Heart className="h-4 w-4 fill-pink-600" />
                  </button>
                  <div className="hidden sm:flex h-8 w-8 items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
