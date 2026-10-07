import { Metadata } from "next";
import { cookies } from "next/headers";
import logger from "@/lib/logger";
import type { Category } from "@esparex/contracts";

import { getHomeAds } from "@/lib/api/user/listings";
import {
    FEED_LOCATION_COOKIE_NAME,
    parseFeedLocationCookie,
} from "@/lib/location/feedIdentity";
import { isRegionLocationLevel } from "@/lib/location/queryMode";
import { HomeFeed } from "@/components/home/HomeFeed";
import { CategoryBrowser } from "@/components/home/CategoryBrowser";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/brandEntitySchema";
import { toCanonicalUrl } from "@/lib/seo/canonicalHost";
import { Container } from "@esparex/ui";
import { AdPlacementSlot } from "@/components/common/AdPlacementSlot";
import { BelowFoldAdSlot } from "@/components/common/BelowFoldAdSlot";

const shouldLogHomeServerFallback = () => process.env.NODE_ENV === "development";

/**
 * Races a fetch promise against a timeout.
 * Prevents slow APIs from stalling SSR / Googlebot crawls indefinitely.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(fallback), ms);
            }),
        ]);
    } catch {
        return fallback;
    } finally {
        if (timer !== undefined) clearTimeout(timer);
    }
}

import { getCategories } from "@/lib/api/user/categories";

async function getHomeCategories(): Promise<Category[]> {
    try {
        const categories = await getCategories({ fetchOptions: { next: { revalidate: 60 } } });
        return categories;
    } catch (error) {
        if (shouldLogHomeServerFallback()) {
            logger.warn("Home categories fetch failed", error);
        }
        return [];
    }
}


export const revalidate = 60;

export const metadata: Metadata = {
    title: {
        absolute: "Esparex — India's Marketplace for Mobile Spare Parts & Tech Repair",
    },
    description: "India's marketplace for mobile spare parts, used phones, laptops, tablets and repair services. Buy and sell electronics online across India — free to post.",
    alternates: {
        canonical: toCanonicalUrl('/'),
    },
    openGraph: {
        title: "Esparex — India's Marketplace for Mobile Spare Parts & Tech Repair",
        description: "India's marketplace for mobile spare parts, used phones, laptops, tablets and repair services.",
        url: toCanonicalUrl('/'),
        siteName: "Esparex",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Esparex — Buy & Sell Spare Parts" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Esparex — India's Marketplace for Mobile Spare Parts & Tech Repair",
        description: "India's marketplace for mobile spare parts, used phones, laptops, tablets and repair services.",
        images: ["/og-image.png"],
    },
};

import { HomeLocationAutoPrompt } from "@/components/home/HomeLocationAutoPrompt";

export default async function Home() {
    // Align the SSR feed with the client's persisted location (if any) so the
    // first paint already shows the localized result set instead of the
    // national default that would be swapped out after hydration.
    const ssrFeedLocation = parseFeedLocationCookie(
        (await cookies()).get(FEED_LOCATION_COOKIE_NAME)?.value
    );
    const ssrUseGeoSearch = Boolean(
        ssrFeedLocation &&
            typeof ssrFeedLocation.lat === "number" &&
            typeof ssrFeedLocation.lng === "number" &&
            !isRegionLocationLevel(ssrFeedLocation.level)
    );
    const [categories, initialHomeAds] = await Promise.all([
        withTimeout(getHomeCategories(), 5000, []),
        withTimeout(
            getHomeAds(
                {
                    limit: 12,
                    ...(ssrFeedLocation?.locationId
                        ? { locationId: ssrFeedLocation.locationId }
                        : {}),
                    ...(ssrFeedLocation?.level ? { level: ssrFeedLocation.level } : {}),
                    // Mirrors HomeFeedClient geo radius so SSR and client query the same result set.
                    ...(ssrUseGeoSearch && ssrFeedLocation?.lat !== undefined
                        ? { lat: ssrFeedLocation.lat }
                        : {}),
                    ...(ssrUseGeoSearch && ssrFeedLocation?.lng !== undefined
                        ? { lng: ssrFeedLocation.lng }
                        : {}),
                    ...(ssrUseGeoSearch ? { radiusKm: 50 } : {}),
                },
                { fetchOptions: { next: { revalidate: 60, tags: ['home-ads'] } } }
            ),
            5000,
            undefined
        ),
    ]);

    return (
        <div className="bg-background text-foreground">
            <HomeLocationAutoPrompt />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: toSafeJsonLd({
                        "@context": "https://schema.org",
                        "@graph": [
                            buildOrganizationSchema(),
                            buildWebSiteSchema(),
                        ],
                    }),
                }}
            />

            {/* Semantic brand-first H1 — always server-rendered for Googlebot and screen readers */}
            <h1 className="sr-only">
                Esparex — India&apos;s Marketplace for Mobile Spare Parts &amp; Tech Repair
            </h1>

            <section data-primary className="flex flex-col isolate">
                <CategoryBrowser categories={categories} />

                <Container variant="lg">
                    <AdPlacementSlot placement="homepage_hero_top" />
                </Container>

                <HomeFeed initialData={initialHomeAds} />

                {/* ui-guard-ignore: nested-container Sibling container wrappers for separate ad placement slots */}
                <Container variant="lg">
                    <BelowFoldAdSlot placement="homepage_feed_inline" />
                </Container>
            </section>
        </div>
    );
}
