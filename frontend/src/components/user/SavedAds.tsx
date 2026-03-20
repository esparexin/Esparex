"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  ChevronDown,
  Clock,
  Grid3x3,
  Heart,
  List,
  MapPin,
} from "lucide-react";

import { unsaveAd } from "@/api/user/users";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/notify";
import type { Ad } from "@/schemas/ad.schema";
import type { UserPage } from "@/lib/routeUtils";
import { queryKeys } from "@/queries/queryKeys";
import { useSavedAdsQuery } from "@/queries/useAdsQuery";
import { formatPrice, formatStableDate } from "@/utils/formatters";
import { formatLocation, normalizeLocation as normalizeAppLocation } from "@/lib/location/locationService";
import { toSafeImageSrc, DEFAULT_IMAGE_PLACEHOLDER } from "@/lib/image/imageUrl";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
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

interface SavedAdsProps {
  navigateTo: (page: UserPage, adId?: string | number, context?: unknown) => void;
}

type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "location";

export function SavedAds({ navigateTo }: SavedAdsProps) {
  const queryClient = useQueryClient();
  const { status } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const {
    data: savedAds = [],
    isLoading,
    isError,
    refetch,
  } = useSavedAdsQuery({
    enabled: status === "authenticated",
  });

  const unsaveMutation = useMutation({
    mutationFn: (adId: string | number) => unsaveAd(adId),
    onSuccess: (_result, adId) => {
      queryClient.setQueryData<Ad[]>(queryKeys.ads.saved(), (current = []) =>
        current.filter((ad) => String(ad.id) !== String(adId))
      );
      notify.success("Ad removed from saved");
    },
    onError: () => {
      notify.error("Failed to remove ad");
    },
  });

  const getCategoryLabel = (ad: Ad) => {
    if (typeof ad.category === "string" && ad.category.trim()) return ad.category;
    if (typeof ad.categoryId === "string" && ad.categoryId.trim()) return ad.categoryId;
    return "General";
  };

  const sortedAds = useMemo(() => {
    const base = [...savedAds];
    return base.sort((a, b) => {
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
          return (
            normalizeAppLocation(a.location)?.formattedAddress ||
            formatLocation(a.location)
          ).localeCompare(
            normalizeAppLocation(b.location)?.formattedAddress ||
            formatLocation(b.location)
          );
        default:
          return 0;
      }
    });
  }, [savedAds, sortBy]);

  const handleUnsave = (adId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (unsaveMutation.isPending) return;
    unsaveMutation.mutate(adId);
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "newest":
        return "Newest First";
      case "oldest":
        return "Oldest First";
      case "price-low":
        return "Price: Low to High";
      case "price-high":
        return "Price: High to Low";
      case "location":
        return "Location";
      default:
        return "Sort By";
    }
  };

  const pageState: PageState = isLoading
    ? "loading"
    : isError
      ? "error"
      : sortedAds.length === 0
        ? "empty"
        : "ready";

  return (
    <div className="bg-gray-50 py-4 md:py-8">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Saved Ads</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Your favorite listings ({savedAds.length})
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
                    <p className="text-lg font-semibold">No saved ads</p>
                    <p className="text-sm text-muted-foreground">
                      Save ads to view them later by clicking the heart icon
                    </p>
                  </StateEmptyShell>
                </CardContent>
              </Card>
            }
            error={
              <div className="text-center py-10">
                <p className="text-sm text-red-600 mb-3">Failed to load saved ads</p>
                <Button variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            }
          >
            <section data-primary>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
                <div className="text-xs md:text-sm text-muted-foreground">
                  Showing {sortedAds.length} {sortedAds.length === 1 ? "ad" : "ads"}
                </div>

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 md:gap-2 h-8 md:h-9 text-xs md:text-sm">
                        <ArrowUpDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">{getSortLabel()}</span>
                        <span className="sm:hidden">Sort</span>
                        <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setSortBy("newest")} className={sortBy === "newest" ? "bg-blue-50 text-blue-600 font-bold" : ""}>
                        Newest First
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("oldest")} className={sortBy === "oldest" ? "bg-blue-50 text-blue-600 font-bold" : ""}>
                        Oldest First
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("price-low")} className={sortBy === "price-low" ? "bg-blue-50 text-blue-600 font-bold" : ""}>
                        Price: Low to High
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("price-high")} className={sortBy === "price-high" ? "bg-blue-50 text-blue-600 font-bold" : ""}>
                        Price: High to Low
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("location")} className={sortBy === "location" ? "bg-blue-50 text-blue-600 font-bold" : ""}>
                        Location
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex items-center border rounded-lg p-0.5 md:p-1 bg-white">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      className={`h-7 px-2 md:px-3 ${viewMode === "grid" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3x3 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      className={`h-7 px-2 md:px-3 ${viewMode === "list" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {viewMode === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {sortedAds.map((ad) => (
                    <Card
                      key={ad.id}
                      className="overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer rounded-2xl border-slate-100"
                      onClick={() => {
                        navigateTo("ad-detail", ad.id, {
                          returnPage: "saved-ads",
                          returnScrollPosition: window.scrollY,
                        });
                      }}
                    >
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                        <Image
                          src={toSafeImageSrc(ad.images?.[0], DEFAULT_IMAGE_PLACEHOLDER)}
                          alt={ad.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-2 right-2 h-7 w-7 rounded-full hover:bg-white hover:scale-110 transition-all"
                          onClick={(e) => handleUnsave(ad.id, e)}
                          title="Remove from saved"
                        >
                          <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                      <CardContent className="p-3 space-y-1.5">
                        <h3 className="font-semibold line-clamp-2 text-sm leading-tight">{ad.title}</h3>
                        <div className="text-xl font-extrabold text-blue-600">{formatPrice(ad.price)}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{formatLocation(ad.location)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t">
                          <Badge variant="secondary" className="text-[10px] font-bold bg-blue-50 text-blue-600 border-0">
                            {getCategoryLabel(ad).toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatStableDate(ad.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {viewMode === "list" && (
                <div className="space-y-3">
                  {sortedAds.map((ad) => (
                    <Card
                      key={ad.id}
                      className="overflow-hidden hover:shadow-xl transition-all rounded-2xl border-slate-100 cursor-pointer"
                      onClick={() => navigateTo("ad-detail", ad.id)}
                    >
                      <CardContent className="p-0">
                        <div className="flex gap-2 md:gap-4">
                          <div className="relative w-24 sm:w-32 md:w-48 h-24 sm:h-28 md:h-36 flex-shrink-0 bg-gray-100 overflow-hidden">
                            <Image
                              src={toSafeImageSrc(ad.images?.[0], DEFAULT_IMAGE_PLACEHOLDER)}
                              alt={ad.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100px, (max-width: 768px) 150px, 200px"
                            />
                            <Button
                              size="icon"
                              variant="secondary"
                              className="absolute top-1 right-1 md:top-2 md:right-2 h-6 w-6 md:h-7 md:w-7 rounded-full hover:bg-white"
                              onClick={(e) => handleUnsave(ad.id, e)}
                              title="Remove from saved"
                            >
                              <Heart className="h-3 w-3 md:h-3.5 md:w-3.5 fill-red-500 text-red-500" />
                            </Button>
                          </div>

                          <div className="flex-1 py-2 pr-2 md:py-4 md:pr-4 min-w-0">
                            <div className="flex flex-col gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                              <div className="flex items-start justify-between gap-2">
                                <Badge variant="secondary" className="text-[10px] font-bold bg-blue-50 text-blue-600 border-0">
                                  {getCategoryLabel(ad).toUpperCase()}
                                </Badge>
                              </div>
                              <h3 className="font-semibold line-clamp-2 text-xs md:text-base leading-tight">{ad.title}</h3>
                              <div className="text-lg md:text-2xl font-extrabold text-blue-600">{formatPrice(ad.price)}</div>
                            </div>

                            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-1 md:gap-4 text-[10px] md:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                <span className="truncate">{formatLocation(ad.location)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                <span className="truncate">{formatStableDate(ad.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </PageStateGuard>

        </div>
      </div>
    </div>
  );
}
