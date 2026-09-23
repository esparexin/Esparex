// HomeFeedClient.tsx - client component handling feed logic
"use client";

import { Fragment, startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Button, Loader2, PackageOpen } from "@esparex/ui";
import { type Listing as Ad, type HomeAdsPayload } from "@/lib/api/user/listings";
import { useLocationData } from "@/context/LocationContext";
import { useHomeAdsQuery } from "@/hooks/queries/useListingsQuery";
import { AdCardGrid, AdCardSkeleton } from "@/components/user/ad-card";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { shouldUseGeoRadiusLocation, isUserSelectedLocation } from "@/lib/location/queryMode";
import { getLatitude, getLongitude, sanitizeMongoObjectId } from "@esparex/shared";
import { appendUniqueFeedPage, replaceFeedPage } from "./homeFeed.helpers";
import { HomePromoAdCard } from "./HomePromoAdCard";
import type { PublicBrowseType } from "@/lib/publicBrowseRoutes";
import { ListingTypeTabs } from "@/components/user/ListingTypeTabs";

const HOME_FEED_PAGE_SIZE = 12;

interface HomeFeedProps {
    initialData?: HomeAdsPayload;
}

function FeedSkeletonGrid() {
    return (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:gap-3.5 lg:grid-cols-4">
            {Array.from({ length: HOME_FEED_PAGE_SIZE }).map((_, index) => (
                <AdCardSkeleton key={index} />
            ))}
        </div>
    );
}

function FeedErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
            <p className="text-caption text-destructive mb-3">
                Failed to load listings. Please try again.
            </p>
            <Button variant="outline" onClick={onRetry}>
                Retry
            </Button>
        </div>
    );
}

function FeedEmptyState({ selectedType }: { selectedType?: PublicBrowseType }) {
    const typeLabel =
        selectedType === "service"
            ? "services"
            : selectedType === "spare_part"
            ? "spare parts"
            : selectedType === "ad"
            ? "devices"
            : "listings";
    return (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
            <PackageOpen className="mx-auto h-9 w-9 text-foreground-secondary" />
            <p className="mt-2 text-caption font-medium text-foreground-secondary">
                No {typeLabel} available right now.
            </p>
        </div>
    );
}

/**
 * HomeFeedClient - Handles state and rendering for the home marketplace feed across listing types.
 * This component is keyed by location in the parent (HomeFeed), so it automatically 
 * resets when the location changes.
 */
export function HomeFeedClient({ initialData }: HomeFeedProps) {
    const [cursor, setCursor] = useState<{ createdAt: string; id?: string } | undefined>(undefined);
    const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(initialData?.nextCursor ?? null);
    const [feedAds, setFeedAds] = useState<Ad[]>(initialData?.ads ?? []);
    const [hasMore, setHasMore] = useState<boolean>(initialData?.hasMore === true);
    const [selectedType, setSelectedType] = useState<PublicBrowseType>("all");
    
    const { location, isLoaded } = useLocationData();
    const latitude = getLatitude(location);
    const longitude = getLongitude(location);

    const hasUserLocation = isUserSelectedLocation(location);
    const shouldUseGeoSearch = hasUserLocation && shouldUseGeoRadiusLocation(location);

    const locationIdentity = useMemo(() => {
        if (!hasUserLocation) return "default";
        const rawLocationId = location.locationId || location.id || "";
        const validLocationId = sanitizeMongoObjectId(rawLocationId) || "";
        const latStr = typeof latitude === "number" ? latitude.toFixed(3) : "";
        const lngStr = typeof longitude === "number" ? longitude.toFixed(3) : "";
        return [validLocationId, location.city || "", location.level || "", latStr, lngStr].join(":");
    }, [hasUserLocation, latitude, location.city, location.id, location.level, location.locationId, longitude]);

    // Soft-reset pagination cursor when location changes without unmounting tree
    const prevLocationIdentityRef = useRef(locationIdentity);
    useEffect(() => {
        if (prevLocationIdentityRef.current !== locationIdentity) {
            prevLocationIdentityRef.current = locationIdentity;
            setCursor(undefined);
            setNextCursor(null);
            setFeedAds([]);
        }
    }, [locationIdentity]);

    // Soft-reset pagination cursor and feed state when active listing tab changes
    const prevSelectedTypeRef = useRef(selectedType);
    useEffect(() => {
        if (prevSelectedTypeRef.current !== selectedType) {
            prevSelectedTypeRef.current = selectedType;
            setCursor(undefined);
            setNextCursor(null);
            setFeedAds([]);
        }
    }, [selectedType]);
    
    const requestParams = useMemo(() => {
        const rawLocationId = hasUserLocation ? (location.locationId || location.id) : undefined;
        const validLocationId = sanitizeMongoObjectId(rawLocationId) || undefined;

        return {
            cursor,
            limit: HOME_FEED_PAGE_SIZE,
            locationId: validLocationId,
            level: hasUserLocation ? location.level : undefined,
            lat: shouldUseGeoSearch && typeof latitude === "number" ? latitude : undefined,
            lng: shouldUseGeoSearch && typeof longitude === "number" ? longitude : undefined,
            radiusKm: shouldUseGeoSearch ? 50 : undefined,
            listingType: selectedType !== "all" ? selectedType : undefined,
        };
    }, [cursor, hasUserLocation, latitude, location.id, location.level, location.locationId, longitude, selectedType, shouldUseGeoSearch]);

    const shouldUseInitialData = !cursor && !hasUserLocation && selectedType === "all";

    const { data, isLoading, isFetching, isError, refetch } = useHomeAdsQuery(
        requestParams,
        {
            enabled: isLoaded,
            initialData: shouldUseInitialData ? initialData : undefined,
        }
    );

    // Sync feed ads accumulation
    useEffect(() => {
        if (!data) return;
        const pageAds = Array.isArray(data.ads) ? data.ads : [];
        
        void (async () => {
            if (!cursor) {
                setFeedAds((previous) => (
                    pageAds.length > 0 || (data as { isFallback?: boolean }).isFallback || previous.length === 0
                        ? replaceFeedPage(previous, pageAds)
                        : previous
                ));
            } else if (pageAds.length > 0) {
                setFeedAds((previous) => appendUniqueFeedPage(previous, pageAds));
            }
        })();
    }, [cursor, data]);

    // Sync pagination metadata
    useEffect(() => {
        if (!data) return;
        void (async () => {
            setNextCursor(data.nextCursor ?? null);
            setHasMore(data.hasMore === true);
        })();
    }, [data]);

    const displayedAds = feedAds;
    const canLoadMore = hasMore && Boolean(nextCursor?.createdAt);

    return (
        <section
            role="region"
            aria-label="Explore Marketplace"
            aria-labelledby="home-feed-heading"
            className="pt-2 pb-8 md:pt-3 md:pb-12"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-4 space-y-3">
                    <h2
                        id="home-feed-heading"
                        className="text-body sm:text-body-lg md:text-h4 font-bold text-foreground tracking-tight"
                    >
                        Explore Marketplace
                    </h2>
                    <ListingTypeTabs
                        activeType={selectedType}
                        onTypeChange={setSelectedType}
                    />
                </div>

                {(isLoading || isFetching) && displayedAds.length === 0 && <FeedSkeletonGrid />}

                {isError && displayedAds.length === 0 && (
                    <FeedErrorState onRetry={() => refetch()} />
                )}

                {!isLoading && !isFetching && !isError && displayedAds.length === 0 && (
                    <FeedEmptyState selectedType={selectedType} />
                )}

                {displayedAds.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:gap-3.5 lg:grid-cols-4">
                            {displayedAds.map((ad, index) => (
                                <Fragment key={ad.id}>
                                    <AdCardGrid
                                        ad={ad}
                                        href={buildPublicListingDetailRoute({
                                            id: ad.id,
                                            listingType: ad.listingType,
                                            title: ad.title,
                                            seoSlug: ad.seoSlug,
                                        })}
                                        priority={index < 4}
                                    />
                                    {index === 2 && <HomePromoAdCard key="home-promo-card" />}
                                </Fragment>
                            ))}
                            {displayedAds.length < 3 && <HomePromoAdCard key="home-promo-card" />}
                        </div>

                        {canLoadMore && (
                            <div className="mt-6 md:mt-10 flex justify-center px-4 sm:px-0">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => {
                                        if (!nextCursor?.createdAt) return;
                                        startTransition(() => {
                                            setCursor(nextCursor);
                                        });
                                    }}
                                    disabled={isFetching}
                                    aria-label="Load more listings"
                                    aria-busy={isFetching}
                                    className="w-full sm:w-auto min-w-[220px] rounded-full border-2 border-border-hover hover:border-primary hover:bg-primary/5 text-foreground font-semibold shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
                                >
                                    {isFetching ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                                            <span>Loading more listings...</span>
                                        </>
                                    ) : (
                                        "Load More"
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
