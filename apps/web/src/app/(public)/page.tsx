import { Metadata } from "next";
import logger from "@/lib/logger";
import type { Category } from "@/schemas";

import { getHomeAds } from "@/lib/api/user/listings";
import { HomeFeed } from "@/components/home/HomeFeed";
import { HomeBannerAd } from "@/components/home/HomeBannerAd";
import { CategoryBrowser } from "@/components/home/CategoryBrowser";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";
import { Container } from "@esparex/ui";
import { AdPlacementSlot } from "@/components/common/AdPlacementSlot";

const shouldLogHomeServerFallback = () => process.env.NODE_ENV === "development";

/**
 * Wraps a fetch promise with an AbortController timeout.
 * Prevents slow APIs from stalling SSR / Googlebot crawls indefinitely.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await promise;
    } catch {
        return fallback;
    } finally {
        clearTimeout(timer);
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
    title: "Buy & Sell Mobile Spare Parts Online India | Esparex",
    description: "India's marketplace for mobile spare parts, used phones, laptops, tablets and repair services. Buy and sell electronics online across India — free to post.",
    alternates: {
        canonical: "https://esparex.in/",
    },
    openGraph: {
        title: "Buy & Sell Mobile Spare Parts Online India | Esparex",
        description: "India's marketplace for mobile spare parts, used phones, laptops, tablets and repair services.",
        url: "https://esparex.in/",
        siteName: "Esparex",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Esparex — Buy & Sell Spare Parts" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Buy & Sell Mobile Spare Parts Online India | Esparex",
        description: "India's marketplace for mobile spare parts, used phones, laptops, tablets and repair services.",
        images: ["/og-image.png"],
    },
};

import { HomeLocationAutoPrompt } from "@/components/home/HomeLocationAutoPrompt";

export default async function Home() {
    const [categories, initialHomeAds] = await Promise.all([
        withTimeout(getHomeCategories(), 5000, []),
        withTimeout(
            getHomeAds({ limit: 12 }, { fetchOptions: { next: { revalidate: 60, tags: ['home-ads'] } } }),
            5000,
            undefined
        ),
    ]);

    return (
        <div className="bg-white text-foreground">
            <HomeLocationAutoPrompt />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: toSafeJsonLd({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        name: "Esparex",
                        url: "https://esparex.in/",
                        potentialAction: {
                            "@type": "SearchAction",
                            target: "https://esparex.in/search?q={search_term_string}",
                            "query-input": "required name=search_term_string",
                        },
                    }),
                }}
            />

            {/* Keyword-rich H1 — always server-rendered for Googlebot */}
            <h1 className="sr-only">
                Buy &amp; Sell Mobile Spare Parts Online India — Esparex Marketplace
            </h1>

            <section data-primary className="flex flex-col isolate">
                <CategoryBrowser categories={categories} />

                <Container variant="lg">
                    <AdPlacementSlot placement="homepage_hero_top" />
                </Container>

                <HomeFeed initialData={initialHomeAds} />

                <Container variant="lg">
                    <AdPlacementSlot placement="homepage_feed_inline" />
                </Container>

                <HomeBannerAd />
            </section>
        </div>
    );
}
