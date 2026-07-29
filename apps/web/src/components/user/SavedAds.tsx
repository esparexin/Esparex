"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  Grid3x3,
  List,
} from "@/icons/IconRegistry";

import { unsaveAd } from "@/lib/api/user/users";
import type { SavedAd } from "@/lib/api/user/users";
import type { UserPage } from "@/lib/routeUtils";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/feedback";
import type { Ad } from "@/schemas/ad.schema";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useSavedAdsQuery } from "@/hooks/queries/useListingsQuery";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";

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

import { AdCardGrid, AdCardList } from "@/components/user/ad-card";
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

  const renderGridCard = useCallback(
    (ad: SavedAd, unavailable = false) => (
      <AdCardGrid
        key={ad.id}
        ad={ad}
        isSaved={true}
        onToggleSave={(adId, e) => handleUnsave(adId, e)}
        href={unavailable ? undefined : getDetailUrl(ad)}
        className={unavailable ? "opacity-60 cursor-default" : undefined}
      />
    ),
    [handleUnsave]
  );

  const renderListCard = useCallback(
    (ad: SavedAd, unavailable = false) => (
      <AdCardList
        key={ad.id}
        ad={ad}
        isSaved={true}
        onToggleSave={(adId, e) => handleUnsave(adId, e)}
        href={unavailable ? undefined : getDetailUrl(ad)}
        className={unavailable ? "opacity-60 cursor-default" : undefined}
      />
    ),
    [handleUnsave]
  );

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
    <div className="space-y-4">
      <div className="mb-4 md:mb-6">
        <h1 className="account-page-title">Saved Listings</h1>
        <p className="account-body-text mt-1">
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
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Save ads, services, or spare parts to view them later by clicking the heart icon on any listing card.
                    </p>
                    <div className="pt-3">
                      <Button
                        type="button"
                        onClick={() => router.push("/search")}
                        className="w-full md:w-auto md:min-w-[200px] md:max-w-[320px] bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        Browse Marketplace
                      </Button>
                    </div>
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
    );
}

