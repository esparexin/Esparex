"use client";

import { useCallback, useMemo, useState } from "react";
import type { SavedAd } from "@/lib/api/user/users";
import type { Ad } from "@/schemas/ad.schema";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { isUnavailable } from "./SavedAdCardItems";

export type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "location";

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  "price-low": "Price: Low to High",
  "price-high": "Price: High to Low",
  location: "Location",
};

export const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

export function useSavedAdsSort(savedAds: SavedAd[]) {
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const sortAds = useCallback(
    (ads: Ad[]) =>
      [...ads].sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "price-low":
            return a.price - b.price;
          case "price-high":
            return b.price - a.price;
          case "location":
            return resolveListingLocationLabel(a.location, "full").localeCompare(
              resolveListingLocationLabel(b.location, "full")
            );
          default:
            return 0;
        }
      }),
    [sortBy]
  );

  const { available, unavailable } = useMemo(() => {
    const avail = savedAds.filter((ad) => !isUnavailable(ad));
    const unavail = savedAds.filter((ad) => isUnavailable(ad));
    return { available: sortAds(avail), unavailable: sortAds(unavail) };
  }, [savedAds, sortAds]);

  return {
    sortBy,
    setSortBy,
    available,
    unavailable,
  };
}
