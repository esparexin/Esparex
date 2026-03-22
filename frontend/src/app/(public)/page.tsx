import { Metadata } from "next";
import nextDynamic from "next/dynamic";
import logger from "@/lib/logger";
import { API_ROUTES } from "@/api/routes";
import type { Category } from "@/schemas";
import { getHomeAds } from "@/api/user/ads";
import { HomeFeed } from "@/components/home/HomeFeed";
import { HomeBannerAd } from "@/components/home/HomeBannerAd";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";
import { BusinessQuickActionsShell } from "@/components/home/BusinessQuickActionsShell";

const CategoryBrowser = nextDynamic(
    () => import("@/components/home/CategoryBrowser").then((mod) => mod.CategoryBrowser),
    { ssr: true, loading: () => <div className="min-h-[200px] animate-pulse bg-slate-50" /> }
);

async function getHomeCategories(): Promise<Category[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
        logger.error("NEXT_PUBLIC_API_URL is missing for homepage categories");
        return [];
    }

    try {
        // SSR exception documented in docs/api-ssr-fetch-exceptions.md
        const response = await fetch(
            `${baseUrl}/${API_ROUTES.USER.CATEGORIES}?isActive=true&limit=20`,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) {
            return [];
        }

        const json = await response.json();
        if (!json?.success || !json?.data) {
            return [];
        }

        if (Array.isArray(json.data?.items)) {
            return json.data.items as Category[];
        }

        if (Array.isArray(json.data)) {
            return json.data as Category[];
        }

        if (Array.isArray(json.data?.data)) {
            return json.data.data as Category[];
        }

        return [];
    } catch (error) {
        logger.error("Home categories fetch failed", error);
        return [];
    }
}

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Esparex - Buy & Sell Mobile Spares & Devices",
    description: "The best marketplace for mobile spare parts, used devices, and repair services.",
};

export default async function Home() {
    const [categories, initialHomeAds] = await Promise.all([
        getHomeCategories(),
        getHomeAds(
            { limit: 12 },
            { fetchOptions: { next: { revalidate: 60 } } }
        ),
    ]);

    return (
        <main className="min-h-screen bg-white font-sans text-slate-900">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: toSafeJsonLd({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        name: "Esparex",
                        url: "https://esparex.com/",
                        potentialAction: {
                            "@type": "SearchAction",
                            target: "https://esparex.com/search?q={search_term_string}",
                            "query-input": "required name=search_term_string",
                        },
                    }),
                }}
            />

            <section data-primary className="flex flex-col">
                <CategoryBrowser categories={categories} />
                <BusinessQuickActionsShell />

                <HomeFeed initialData={initialHomeAds} />
                <HomeBannerAd />
            </section>
        </main>
    );
}
