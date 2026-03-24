"use client";

import { useEffect, useState } from "react";
import { getSimilarAds } from "@/lib/api/user/ads";
import type { Ad } from "@/lib/api/user/ads";
import { AdCardGrid } from "@/components/user/ad-card";
import { generateAdSlug } from "@/lib/slug";

interface SimilarAdsProps {
    currentAdId: string | number;
    category: string;
}

export function SimilarAds({ currentAdId, category }: SimilarAdsProps) {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSimilarAds = async () => {
            try {
                const response = await getSimilarAds(currentAdId, { limit: 8 });
                const filtered = Array.isArray(response.ads)
                    ? response.ads.filter((ad) => String(ad.id) !== String(currentAdId))
                    : [];
                setAds(filtered);
            } catch {
                setAds([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSimilarAds();
    }, [currentAdId]);

    if (!loading && ads.length === 0) return null;

    return (
        <div className="space-y-6 pt-10 border-t border-slate-100">
            <div className="flex items-center justify-between px-4 md:px-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Similar Listings</h2>
                    <p className="text-sm text-slate-400 font-medium mt-1">Found in {category}</p>
                </div>
            </div>

            <div className="relative group">
                <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide px-4 md:px-0 scroll-smooth">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-64 h-80 bg-slate-100 rounded-[2rem] animate-pulse" />
                        ))
                    ) : (
                        ads.map((ad) => {
                            return (
                                <div
                                    key={ad.id}
                                    className="flex-shrink-0 w-64 md:w-72"
                                >
                                    <AdCardGrid
                                        ad={ad}
                                        href={`/ads/${generateAdSlug(ad.title)}-${ad.id}`}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
