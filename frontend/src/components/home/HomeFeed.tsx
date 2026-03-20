"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, PackageOpen } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

import { type Ad, type HomeAdsPayload } from "@/api/user/ads";
import { useLocationState } from "@/context/LocationContext";
import { useHomeAdsQuery } from "@/queries/useAdsQuery";
import { AdCardGrid, AdCardSkeleton } from "@/components/user/ad-card";
import { Button } from "@/components/ui/button";
import { generateAdSlug } from "@/utils/slug";
import { getLatitude, getLongitude } from "@/lib/location/utils";

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
    const locationContextKey = useMemo(
        () =>
            [
                location.locationId ?? "",
                location.city ?? "",
                location.level ?? "",
                typeof latitude === "number" ? latitude.toFixed(3) : "",
                typeof longitude === "number" ? longitude.toFixed(3) : "",
            ].join("|"),
        [latitude, location.city, location.level, location.locationId, longitude]
    );
    const previousContextKeyRef = useRef(locationContextKey);

    const isDefaultLocation = location.source === "default";

    const requestParams = useMemo(() => ({
        cursor,
        limit: HOME_FEED_PAGE_SIZE,
        location: isDefaultLocation ? undefined : (location.city || undefined),
        locationId: isDefaultLocation ? undefined : location.locationId,
        level: isDefaultLocation ? undefined : location.level,
        lat: !isDefaultLocation && typeof latitude === "number" ? latitude : undefined,
        lng: !isDefaultLocation && typeof longitude === "number" ? longitude : undefined,
        radiusKm: isDefaultLocation ? undefined : 50,
    }), [cursor, isDefaultLocation, latitude, location.city, location.level, location.locationId, longitude]);

    const shouldUseInitialData =
        !cursor &&
        (isDefaultLocation ||
            (!location.locationId &&
                !location.city &&
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
            if (pageAds.length > 0 || (data as any).isFallback || feedAds.length === 0) {
                setFeedAds(pageAds);
            }
        } else if (pageAds.length > 0) {
            setFeedAds((previous) => [...previous, ...pageAds]);
        }
        
        setNextCursor(data.nextCursor ?? null);
        setHasMore(data.hasMore === true);
    }, [cursor, data, feedAds.length]);

    const recommendedAds = feedAds;
    const canLoadMore = hasMore && Boolean(nextCursor?.createdAt);

    // Virtualization logic — useWindowVirtualizer scrolls with the page (no scroll Element needed)
    const parentRef = useRef<HTMLDivElement>(null);

    // SSR-safe colCount: always start at 2 (matches server render),
    // then correct to actual breakpoint after hydration via useEffect.
    // This prevents the SSR/CSR height mismatch on the virtualizer container.
    const [colCount, setColCount] = useState(2);
    useEffect(() => {
        const updateCols = () => {
            if (window.innerWidth >= 1024) setColCount(4);
            else if (window.innerWidth >= 768) setColCount(3);
            else setColCount(2);
        };
        updateCols();
        window.addEventListener('resize', updateCols);
        return () => window.removeEventListener('resize', updateCols);
    }, []);

    const rowCount = Math.ceil(recommendedAds.length / colCount);

    const rowVirtualizer = useWindowVirtualizer({
        count: rowCount,
        estimateSize: () => 400,
        overscan: 2,
        scrollMargin: parentRef.current?.offsetTop ?? 0,
    });

    const columns = Array.from({ length: colCount }, (_, i) => i);

    return (
        <section
            role="region"
            aria-label="Recommended Ads"
            aria-labelledby="home-feed-heading"
            className="bg-white py-10 md:py-14"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <div className="mb-6">
                    <h2
                        id="home-feed-heading"
                        className="text-2xl font-bold md:text-3xl text-slate-900 tracking-tight"
                    >
                        Recommended Ads
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Spotlight, boosted, and latest listings in one ranked feed.
                    </p>
                </div>

                {isLoading && recommendedAds.length === 0 && (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
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
                        <PackageOpen className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-3 text-sm text-slate-500">
                            No ads available right now.
                        </p>
                    </div>
                )}

                {recommendedAds.length > 0 && (
                    <>
                        <div 
                            ref={parentRef}
                            className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6 relative"
                            style={{ 
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%'
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                                const rowAds = columns.map(col => recommendedAds[virtualItem.index * colCount + col]).filter(Boolean);
                                return (
                                    <div
                                        key={virtualItem.key}
                                        data-index={virtualItem.index}
                                        ref={rowVirtualizer.measureElement}
                                        className="absolute top-0 left-0 w-full grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6"
                                        style={{
                                            transform: `translateY(${virtualItem.start - rowVirtualizer.options.scrollMargin}px)`,
                                        }}
                                    >
                                        {rowAds.filter((ad): ad is Ad => !!ad).map((ad) => (
                                            <AdCardGrid
                                                key={ad.id}
                                                ad={ad}
                                                href={`/ads/${generateAdSlug(ad.title)}-${ad.id}`}
                                                priority={recommendedAds.indexOf(ad) < 4}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {canLoadMore && (
                            <div className="mt-8 flex justify-center">
                                <Button
                                    onClick={() => {
                                        if (!nextCursor?.createdAt) return;
                                        startTransition(() => {
                                            setCursor(nextCursor);
                                        });
                                    }}
                                    disabled={isFetching}
                                    className="bg-green-600 hover:bg-green-700"
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
