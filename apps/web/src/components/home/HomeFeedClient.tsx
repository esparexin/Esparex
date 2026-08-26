// HomeFeedClient.tsx - client component handling feed logic
"use client";

import { Fragment, startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, PackageOpen } from "@/icons/IconRegistry";
import { type Listing as Ad, type HomeAdsPayload } from "@/lib/api/user/listings";
import { useLocationData } from "@/context/LocationContext";
import { useHomeAdsQuery } from "@/hooks/queries/useListingsQuery";
import { AdCardGrid, AdCardSkeleton } from "@/components/user/ad-card";
import { Button } from "@esparex/ui";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { shouldUseGeoRadiusLocation, isUserSelectedLocation } from "@/lib/location/queryMode";
import { getLatitude, getLongitude, sanitizeMongoObjectId } from "@esparex/shared";
import { appendUniqueFeedPage, replaceFeedPage } from "./homeFeed.helpers";
import { HomePromoAdCard } from "./HomePromoAdCard";

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
            aria-label="Explore Ads"
            aria-labelledby="home-feed-heading"
            className="pt-2 pb-8 md:pt-3 md:pb-12"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-2.5 md:mb-3.5">
                    <h2
                        id="home-feed-heading"
                        className="text-body sm:text-body-lg md:text-h4 font-bold text-foreground tracking-tight"
                    >
                        Explore Ads
                    </h2>
                </div>

                {isLoading && recommendedAds.length === 0 && (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:gap-3.5 lg:grid-cols-4">
                        {Array.from({ length: HOME_FEED_PAGE_SIZE }).map((_, index) => (
                            <AdCardSkeleton key={index} />
                        ))}
                    </div>
                )}

                {isError && recommendedAds.length === 0 && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
                        <p className="text-caption text-destructive mb-3">
                            Failed to load recommended ads. Please try again.
                        </p>
                        <Button variant="outline" onClick={() => refetch()}>
                            Retry
                        </Button>
                    </div>
                )}

                {!isLoading && !isError && recommendedAds.length === 0 && (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                        <PackageOpen className="mx-auto h-9 w-9 text-foreground-subtle" />
                        <p className="mt-2 text-caption text-foreground-subtle">
                            No ads available right now.
                        </p>
                    </div>
                )}

                {recommendedAds.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:gap-3.5 lg:grid-cols-4">
                            {recommendedAds.map((ad, index) => (
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
                            {recommendedAds.length < 3 && <HomePromoAdCard key="home-promo-card" />}
                        </div>

                        {canLoadMore && (
                            <div className="mt-5 md:mt-8 flex justify-center">
                                <Button
                                    onClick={() => {
                                        if (!nextCursor?.createdAt) return;
                                        startTransition(() => {
                                            setCursor(nextCursor);
                                        });
                                    }}
                                    disabled={isFetching}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 h-10 text-caption font-semibold shadow-2xs transition-all active:scale-95"
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
        </section>
    );
}
