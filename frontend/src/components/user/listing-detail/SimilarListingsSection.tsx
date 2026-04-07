"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getAds } from "@/lib/api/user/listings";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { formatPrice } from "@/lib/formatters";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import { toSafeImageSrc, DEFAULT_IMAGE_PLACEHOLDER } from "@/lib/image/imageUrl";
import { formatLocation } from "@/lib/location/locationService";
import type { Ad } from "@/schemas/ad.schema";

interface SimilarListingsSectionProps {
    ad: Ad;
}

export function SimilarListingsSection({ ad }: SimilarListingsSectionProps) {
    const carouselRef = useRef<HTMLDivElement>(null);

    const queryParams = {
        categoryId: ad.categoryId || undefined,
        status: "live",
        limit: 12,
        listingType: ad.listingType,
    };

    const { data: items = [], isLoading } = useQuery({
        queryKey: queryKeys.listings.list(queryParams),
        queryFn: () => getAds(queryParams),
        enabled: Boolean(ad.categoryId),
        staleTime: 5 * 60 * 1000,
    });

    // Filter out the current ad
    const similar = items.filter((item) => String(item.id) !== String(ad.id));

    if (!isLoading && similar.length === 0) return null;

    const scroll = (dir: "left" | "right") => {
        carouselRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
    };

    return (
        <section className="mt-8 md:mt-12 px-4 md:px-0">
            <div className="mb-4 md:mb-6 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-bold md:text-xl text-foreground">Similar Listings</h2>
                    <p className="mt-0.5 text-xs text-foreground-subtle hidden md:block">
                        More listings in the same category
                    </p>
                </div>
                {!isLoading && similar.length > 2 && (
                    <div className="hidden gap-2 md:flex">
                        <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl border-slate-200" onClick={() => scroll("left")}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl border-slate-200" onClick={() => scroll("right")}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex gap-3 overflow-x-hidden pb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-60 w-48 flex-shrink-0 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                </div>
            ) : (
                <div
                    ref={carouselRef}
                    className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: "none" }}
                >
                    {similar.map((item) => {
                        const href = buildPublicListingDetailRoute({
                            id: item.id,
                            listingType: item.listingType,
                            seoSlug: item.seoSlug,
                            title: item.title,
                        });
                        return (
                            <Link
                                key={item.id}
                                href={href}
                                className="w-48 flex-shrink-0 rounded-2xl overflow-hidden border border-slate-100 bg-white hover:shadow-md transition-shadow"
                            >
                                <div className="relative aspect-[4/3] bg-slate-100">
                                    <Image
                                        src={toSafeImageSrc(item.images?.[0], DEFAULT_IMAGE_PLACEHOLDER)}
                                        alt={item.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                        sizes="200px"
                                    />
                                </div>
                                <div className="p-3 space-y-1">
                                    <p className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{item.title}</p>
                                    <p className="text-base font-black text-foreground">{formatPrice(item.price)}</p>
                                    {item.location && (
                                        <p className="text-2xs text-foreground-subtle flex items-center gap-1 truncate">
                                            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                            {formatLocation(item.location)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
