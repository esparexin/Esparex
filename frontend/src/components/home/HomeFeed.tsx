"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, PackageOpen } from "lucide-react";

import { type Listing as Ad, type HomeAdsPayload } from "@/lib/api/user/listings";
import { useLocationState } from "@/context/LocationContext";
import { useHomeAdsQuery } from "@/hooks/queries/useListingsQuery";
import { AdCardGrid, AdCardSkeleton } from "@/components/user/ad-card";
import { Button } from "@/components/ui/button";
import { getListingHref } from "@/lib/listingUtils";
import { getSearchLocationLabel } from "@/lib/location/locationLabels";
import { shouldUseGeoRadiusLocation } from "@/lib/location/queryMode";
import { getLatitude, getLongitude } from "@/lib/location/utils";
import { appendUniqueFeedPage, replaceFeedPage } from "./homeFeed.helpers";

const HOME_FEED_PAGE_SIZE = 12;





interface HomeFeedProps {
    initialData?: HomeAdsPayload;
}

export function HomeFeed({ initialData }: HomeFeedProps) {
    const [cursor, setCursor] = useState<{ createdAt: string; id?: string } | undefined>(undefined);
    const [nextCursor, setNextCursor] = useState<{ createdAt: string; id: string } | null>(initialData?.nextCursor ?? null);
    const [feedAds, setFeedAds] = useState<Ad[]>(initialData?.ads ?? []);
    const [hasMore, setHasMore] = useState<boolean>(initialData?.hasMore === true);
    const { location, isLoaded } = useLocationState();
    const latitude = getLatitude(location);
    const longitude = getLongitude(location);
    const locationSearchLabel = useMemo(() => getSearchLocationLabel(location), [location]);
    const locationContextKey = useMemo(
        () =>
            [
                location.locationId ?? "",
                locationSearchLabel ?? "",
                location.level ?? "",
                location.source ?? "",
                typeof latitude === "number" ? latitude.toFixed(3) : "",
                typeof longitude === "number" ? longitude.toFixed(3) : "",
            ].join("|"),
        [latitude, location.level, location.locationId, locationSearchLabel, location.source, longitude]
    );
    const previousContextKeyRef = useRef(locationContextKey);

    const isDefaultLocation = location.source === "default";
    const shouldUseGeoSearch = !isDefaultLocation && shouldUseGeoRadiusLocation(location);
    const locationLabel = isDefaultLocation ? undefined : locationSearchLabel;

    const requestParams = useMemo(() => ({
        cursor,
        limit: HOME_FEED_PAGE_SIZE,
        location: locationLabel,
        locationId: isDefaultLocation ? undefined : location.locationId,
        level: isDefaultLocation ? undefined : location.level,
        lat: shouldUseGeoSearch && typeof latitude === "number" ? latitude : undefined,
        lng: shouldUseGeoSearch && typeof longitude === "number" ? longitude : undefined,
        radiusKm: shouldUseGeoSearch ? 50 : undefined,
    }), [cursor, isDefaultLocation, latitude, location.level, location.locationId, locationLabel, longitude, shouldUseGeoSearch]);

    const shouldUseInitialData =
        !cursor &&
        (isDefaultLocation ||
            (!location.locationId &&
                !locationSearchLabel &&
                !location.coordinates));

    const { data, isLoading, isFetching, isError, refetch } = useHomeAdsQuery(
        requestParams,
        {
            enabled: isLoaded,
            initialData: shouldUseInitialData ? initialData : undefined,
        }
    );

    useEffect(() => {
        if (previousContextKeyRef.current === locationContextKey) return;
        previousContextKeyRef.current = locationContextKey;
        
        // Reset pagination state but DON'T clear feedAds here.
        // This prevents the "blank flash" during hydration or location switching.
        // The data-sync useEffect below will replace the ads once the new query completes.
        setCursor(undefined);
        setNextCursor(null);
        setHasMore(false);
    }, [locationContextKey]);

    useEffect(() => {
        if (!data) return;
        const pageAds = Array.isArray(data.ads) ? data.ads : [];
        
        if (!cursor) {
            setFeedAds((previous) => (
                pageAds.length > 0 || (data as any).isFallback || previous.length === 0
                    ? replaceFeedPage(previous, pageAds)
                    : previous
            ));
        } else if (pageAds.length > 0) {
            setFeedAds((previous) => appendUniqueFeedPage(previous, pageAds));
        }
        
        setNextCursor(data.nextCursor ?? null);
        setHasMore(data.hasMore === true);
    }, [cursor, data]);

    const recommendedAds = feedAds;
    const canLoadMore = hasMore && Boolean(nextCursor?.createdAt);

    return (
        <section
            role="region"
            aria-label="Recommended Ads"
            aria-labelledby="home-feed-heading"
            className="bg-slate-50 py-8 md:py-16 border-t border-slate-100"
        >
            <div className="mx-auto max-w-7xl px-3 md:px-6 lg:px-8">
                <div className="mb-4 md:mb-8">
                    <h2
                        id="home-feed-heading"
                        className="text-base font-bold md:text-2xl text-foreground tracking-tight"
                    >
                        Recommended for You
                    </h2>
                    <p className="mt-1 text-xs md:text-base text-foreground-subtle max-w-2xl hidden md:block">
                        Spotlight, boosted, and latest listings curated for your location.
                    </p>
                </div>

                {isLoading && recommendedAds.length === 0 && (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
                        {Array.from({ length: HOME_FEED_PAGE_SIZE }).map((_, index) => (
                            <AdCardSkeleton key={index} />
                        ))}
                    </div>
                )}

                {isError && recommendedAds.length === 0 && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
                        <p className="text-sm text-red-700 mb-3">
                            Failed to load recommended ads. Please try again.
                        </p>
                        <Button variant="outline" onClick={() => refetch()}>
                            Retry
                        </Button>
                    </div>
                )}

                {!isLoading && !isError && recommendedAds.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
                        <PackageOpen className="mx-auto h-10 w-10 text-foreground-subtle" />
                        <p className="mt-3 text-sm text-muted-foreground">
                            No ads available right now.
                        </p>
                    </div>
                )}

                {recommendedAds.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
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
                                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 h-11 font-semibold shadow-md shadow-blue-100 transition-all active:scale-95"
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
