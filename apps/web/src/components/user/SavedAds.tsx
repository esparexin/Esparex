"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  Clock,
  Grid3x3,
  List,
  MapPin,
} from "lucide-react";

import { unsaveAd } from "@/lib/api/user/users";
import type { SavedAd } from "@/lib/api/user/users";
import type { UserPage } from "@/lib/routeUtils";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/feedback";
import type { Ad } from "@/schemas/ad.schema";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useSavedAdsQuery } from "@/hooks/queries/useListingsQuery";
import { formatPrice, formatStableDate } from "@/lib/formatters";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import {
  resolveListingCategoryLabel,
  resolveListingLocationLabel,
} from "@/lib/listings/listingPresentation";

import { Button } from "@esparex/ui";
import { Card, CardContent } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { EmptyStateShell as StateEmptyShell } from "../ui/EmptyStateShell";
import { PageStateGuard, PageState } from "../ui/PageStateGuard";
import { Skeleton } from "../ui/skeleton";

import {
  SavedAdImageFrame,
  SavedAdTypeBadge,
} from "./saved-ads/SavedAdCardItems";
import {
  useSavedAdsSort,
  SORT_LABELS,
  SORT_OPTIONS,
} from "./saved-ads/useSavedAdsSort";

interface SavedAdsProps {
  navigateTo?: (page: UserPage, adId?: string | number, context?: unknown) => void;
}

type ViewMode = "grid" | "list";

/** Returns the correct detail URL for any listing type */
const getDetailUrl = (ad: Ad): string => {
  return buildPublicListingDetailRoute({
    id: ad.id,
    listingType: ad.listingType,
    seoSlug: ad.seoSlug,
    title: ad.title,
  });
};

const getListingTypeLabel = (ad: Ad): string => {
  switch (ad.listingType) {
    case "service":    return "Service";
    case "spare_part": return "Spare Part";
    default:           return getCategoryLabelRaw(ad);
  }
};

const getCategoryLabelRaw = (ad: Ad): string => {
  return resolveListingCategoryLabel(ad, "General");
};

export function SavedAds({ navigateTo: _navigateTo }: SavedAdsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { status } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const {
    data: savedAds = [] as SavedAd[],
    isLoading,
    isError,
    refetch,
  } = useSavedAdsQuery({
    enabled: status === "authenticated",
  });

  const { sortBy, setSortBy, available, unavailable } = useSavedAdsSort(savedAds);

  const unsaveMutation = useMutation({
    mutationFn: (adId: string | number) => unsaveAd(adId),
    onSuccess: (_result, adId) => {
      queryClient.setQueryData<SavedAd[]>(queryKeys.ads.saved(), (current = []) =>
        current.filter((ad) => String(ad.id) !== String(adId))
      );
      notify.success("Ad removed from saved");
    },
    onError: () => {
      notify.error("Failed to remove ad");
    },
  });

  const getCategoryLabel = useCallback((ad: Ad) => getListingTypeLabel(ad), []);

  const handleUnsave = useCallback((adId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (unsaveMutation.isPending) return;
    unsaveMutation.mutate(adId);
  }, [unsaveMutation]);

  const handleRefetch = useCallback(() => { void refetch(); }, [refetch]);
  const handleSetViewGrid = useCallback(() => setViewMode("grid"), []);
  const handleSetViewList = useCallback(() => setViewMode("list"), []);

  const pageState: PageState = isLoading
    ? "loading"
    : isError
      ? "error"
      : savedAds.length === 0
        ? "empty"
        : "ready";

  // ── Ad card renderers ────────────────────────────────────────────────────────

  const renderGridCard = useCallback((ad: SavedAd, unavailable = false) => (
    <Card
      key={ad.id}
      className={`overflow-hidden rounded-xl border border-black transition-all duration-300 ${
        unavailable
          ? "opacity-60 cursor-default"
          : "hover:shadow-2xl hover:-translate-y-1 cursor-pointer group"
      }`}
      onClick={unavailable ? undefined : () => router.push(getDetailUrl(ad))}
    >
      <SavedAdImageFrame
        ad={ad}
        unavailable={unavailable}
        containerClassName="relative aspect-square bg-gray-100 overflow-hidden"
        imageClassName={`object-cover ${unavailable ? "" : "group-hover:scale-105 transition-transform duration-300"}`}
        imageSizes="(max-width: 768px) 50vw, 33vw"
        removeButtonClassName={`absolute top-2 right-2 h-11 w-11 rounded-full hover:bg-white hover:scale-110 transition-all ${
          unavailable ? "bg-red-50 border border-red-200" : ""
        }`}
        removeIconClassName="h-3.5 w-3.5"
        onRemove={(e) => handleUnsave(ad.id, e)}
      />

      <CardContent className="p-3 space-y-1.5">
        <h3 className={`font-semibold line-clamp-2 text-base leading-tight ${unavailable ? "text-foreground-subtle" : ""}`}>
          {ad.title}
        </h3>
        <div className={`text-xl font-extrabold ${unavailable ? "text-foreground-subtle" : "text-link"}`}>
          {formatPrice(ad.price)}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{resolveListingLocationLabel(ad.location, "brief")}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t">
          <SavedAdTypeBadge label={getCategoryLabel(ad)} unavailable={unavailable} />
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {ad._savedAt
              ? `Saved ${formatStableDate(ad._savedAt)}`
              : formatStableDate(ad.createdAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  ), [router, handleUnsave, getCategoryLabel]);

  const renderListCard = useCallback((ad: SavedAd, unavailable = false) => (
    <Card
      key={ad.id}
      className={`overflow-hidden rounded-xl border border-black transition-all ${
        unavailable ? "opacity-60 cursor-default" : "hover:shadow-xl cursor-pointer"
      }`}
      onClick={unavailable ? undefined : () => router.push(getDetailUrl(ad))}
    >
      <CardContent className="p-0">
        <div className="flex gap-2 md:gap-4">
          <SavedAdImageFrame
            ad={ad}
            unavailable={unavailable}
            containerClassName="relative w-24 sm:w-32 md:w-48 h-24 sm:h-28 md:h-36 flex-shrink-0 bg-gray-100 overflow-hidden"
            imageClassName="object-cover"
            imageSizes="(max-width: 640px) 100px, (max-width: 768px) 150px, 200px"
            removeButtonClassName={`absolute top-1 right-1 md:top-2 md:right-2 h-11 w-11 rounded-full hover:bg-white ${
              unavailable ? "bg-red-50 border border-red-200" : ""
            }`}
            removeIconClassName="h-3 w-3 md:h-3.5 md:w-3.5"
            onRemove={(e) => handleUnsave(ad.id, e)}
          />

          <div className="flex-1 py-2 pr-2 md:py-4 md:pr-4 min-w-0">
            <div className="flex flex-col gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <SavedAdTypeBadge label={getCategoryLabel(ad)} unavailable={unavailable} className="w-fit" />
              <div className={`text-lg md:text-2xl font-extrabold ${unavailable ? "text-foreground-subtle" : "text-link"}`}>
                {formatPrice(ad.price)}
              </div>
              <h3 className={`font-semibold line-clamp-2 text-xs md:text-base leading-tight ${unavailable ? "text-foreground-subtle" : ""}`}>
                {ad.title}
              </h3>
            </div>
            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-1 md:gap-4 text-2xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="truncate">{resolveListingLocationLabel(ad.location, "brief")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="truncate">
                  {ad._savedAt
                    ? `Saved ${formatStableDate(ad._savedAt)}`
                    : formatStableDate(ad.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [router, handleUnsave, getCategoryLabel]);

  const renderListingCollection = useCallback((adsToRender: Ad[], unavailable: boolean) => {
    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {adsToRender.map((ad) => renderGridCard(ad, unavailable))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {adsToRender.map((ad) => renderListCard(ad, unavailable))}
      </div>
    );
  }, [viewMode, renderGridCard, renderListCard]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-50 py-4 md:py-8">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl font-bold">Saved Listings</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Your saved ads, services & spare parts ({available.length} available
              {unavailable.length > 0 ? `, ${unavailable.length} unavailable` : ""})
            </p>
          </div>

          <PageStateGuard
            state={pageState}
            loading={
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {[...Array(10)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-3 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
            empty={
              <Card>
                <CardContent className="p-0">
                  <StateEmptyShell>
                    <p className="text-lg font-semibold">No saved listings</p>
                    <p className="text-sm text-muted-foreground">
                      Save ads, services, or spare parts to view them later by clicking the heart icon
                    </p>
                  </StateEmptyShell>
                </CardContent>
              </Card>
            }
            error={
              <div className="text-center py-10">
                <p className="text-sm text-red-600 mb-3">Failed to load saved ads</p>
                <Button variant="outline" onClick={handleRefetch}>Retry</Button>
              </div>
            }
          >
            <section data-primary>
              {/* Sort + View controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
                <div className="text-xs md:text-sm text-muted-foreground">
                  Showing {available.length} {available.length === 1 ? "listing" : "listings"}
                  {unavailable.length > 0 && ` · ${unavailable.length} unavailable`}
                </div>

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 md:gap-2 h-11 text-xs md:text-sm">
                        <ArrowUpDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">{SORT_LABELS[sortBy]}</span>
                        <span className="sm:hidden">Sort</span>
                        <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {SORT_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt}
                          onClick={() => setSortBy(opt)}
                          className={sortBy === opt ? "bg-blue-50 text-link font-bold" : ""}
                        >
                          {SORT_LABELS[opt]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center border rounded-lg p-0.5 md:p-1 bg-white">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 px-2 md:px-3 ${viewMode === "grid" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                      onClick={handleSetViewGrid}
                    >
                      <Grid3x3 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 px-2 md:px-3 ${viewMode === "list" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                      onClick={handleSetViewList}
                    >
                      <List className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Available ads */}
              {available.length > 0 && (
                renderListingCollection(available, false)
              )}

              {/* Unavailable ads section */}
              {unavailable.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-foreground-subtle" />
                    <h2 className="text-sm font-semibold text-foreground-subtle uppercase tracking-wide">
                      No longer available ({unavailable.length})
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    These ads were deactivated, expired, or removed. Click the trash icon to remove them from your saved list.
                  </p>
                  {renderListingCollection(unavailable, true)}
                </div>
              )}

              {/* Available section is empty but unavailable exist */}
              {available.length === 0 && unavailable.length > 0 && (
                <div className="text-center py-6 mb-4">
                  <p className="text-sm text-muted-foreground">All your saved ads are no longer available.</p>
                </div>
              )}
            </section>
          </PageStateGuard>
        </div>
      </div>
    </div>
  );
}

