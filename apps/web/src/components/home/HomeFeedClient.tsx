// HomeFeedClient.tsx - client component handling feed logic
"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, PackageOpen } from "@/icons/IconRegistry";
import { type Listing as Ad, type HomeAdsPayload } from "@/lib/api/user/listings";
import { useLocationData } from "@/context/LocationContext";
import { useHomeAdsQuery } from "@/hooks/queries/useListingsQuery";
import { AdCardGrid, AdCardSkeleton } from "@/components/user/ad-card";
import { GoogleAdRail } from "@/components/ads/GoogleAdRail";
import { Button } from "@esparex/ui";
import { getListingHref } from "@/lib/listingUtils";
import { shouldUseGeoRadiusLocation, isUserSelectedLocation } from "@/lib/location/queryMode";
import { getLatitude, getLongitude, sanitizeMongoObjectId } from "@esparex/shared";
import { appendUniqueFeedPage, replaceFeedPage } from "./homeFeed.helpers";

const HOME_FEED_PAGE_SIZE = 12;

interface HomeFeedProps {
    initialData?: HomeAdsPayload;
}

/**
 * HomeFeedClient - Handles the state and rendering for the recommended ads feed.
 * This component is keyed by location in the parent (HomeFeed), so it automatically 
 * resets when the location changes.
 */
export function HomeFeedClient({ initialData }: HomeFeedProps) {
    const [cursor, setCursor] = useState<{ createdAt: string; id?: string } | undefined>(undefined);
    const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(initialData?.nextCursor ?? null);
    const [feedAds, setFeedAds] = useState<Ad[]>(initialData?.ads ?? []);
    const [hasMore, setHasMore] = useState<boolean>(initialData?.hasMore === true);
    
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
        }
    }, [locationIdentity]);
    
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
        };
    }, [cursor, hasUserLocation, latitude, location.id, location.level, location.locationId, longitude, shouldUseGeoSearch]);

    const shouldUseInitialData = !cursor && !hasUserLocation;

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

    const recommendedAds = feedAds;
    const canLoadMore = hasMore && Boolean(nextCursor?.createdAt);

    return (
        <section
            role="region"
            aria-label="Recommended Ads"
            aria-labelledby="home-feed-heading"
            className="bg-slate-50 py-4 md:py-8 border-t border-slate-100"
        >
            <div className="mx-auto max-w-7xl px-3 md:px-6 lg:px-8">
                <div className="mb-4 md:mb-8">
                    <h2
                        id="home-feed-heading"
                        className="text-base font-bold md:text-2xl text-foreground tracking-tight"
                    >
                        Recommended for You
                    </h2>
                    <p className="mt-1 text-xs md:text-sm text-foreground-subtle max-w-2xl hidden md:block">
                        Spotlight, boosted, and latest listings curated for your location.
                    </p>
                </div>

                <div className="flex justify-center items-start gap-4 xl:gap-6">
                    {/* Left Google Ads Rail (Desktop xl: 1280px+ only) */}
                    <GoogleAdRail slotId="feed-left-rail" format="skyscraper" className="hidden xl:block" />

                    {/* Center Feed Container */}
                    <div className="min-w-0 flex-1 max-w-[960px]">
                        {isLoading && recommendedAds.length === 0 && (
                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:gap-3.5 xl:grid-cols-4">
                                {Array.from({ length: HOME_FEED_PAGE_SIZE }).map((_, index) => (
                                    <AdCardSkeleton key={index} />
                                ))}
                            </div>
                        )}

                        {isError && recommendedAds.length === 0 && (
                            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
                                <p className="text-body text-destructive mb-3">
                                    Failed to load recommended ads. Please try again.
                                </p>
                                <Button variant="outline" onClick={() => refetch()}>
                                    Retry
                                </Button>
                            </div>
                        )}

                        {!isLoading && !isError && recommendedAds.length === 0 && (
                            <div className="rounded-xl border border-border bg-muted/30 p-10 text-center">
                                <PackageOpen className="mx-auto h-10 w-10 text-foreground-subtle" />
                                <p className="mt-3 text-caption text-muted-foreground">
                                    No ads available right now.
                                </p>
                            </div>
                        )}

                        {recommendedAds.length > 0 && (
                            <>
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:gap-3.5 xl:grid-cols-4">
                                    {recommendedAds.map((ad, index) => (
                                        <AdCardGrid
                                            key={ad.id}
                                            ad={ad}
                                            href={getListingHref(ad)}
                                            priority={index < 4}
                                        />
                                    ))}
                                </div>

                                {canLoadMore && (
                                    <div className="mt-6 md:mt-10 flex justify-center">
                                        <Button
                                            onClick={() => {
                                                if (!nextCursor?.createdAt) return;
                                                startTransition(() => {
                                                    setCursor(nextCursor);
                                                });
                                            }}
                                            disabled={isFetching}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-11 font-semibold shadow-sm transition-all active:scale-95"
                                        >
                                            {isFetching ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Loading...
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

                    {/* Right Google Ads Rail (Desktop lg: 1024px+ only) */}
                    <GoogleAdRail slotId="feed-right-rail" format="skyscraper" className="hidden lg:block" />
                </div>
            </div>
        </section>
    );
}
