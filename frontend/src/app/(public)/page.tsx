import { Metadata } from "next";
import logger from "@/lib/logger";
import { API_ROUTES } from "@/lib/api/routes";
import type { Category } from "@/schemas";
import { getHomeAds } from "@/lib/api/user/listings";
import { HomeFeed } from "@/components/home/HomeFeed";
import { HomeBannerAd } from "@/components/home/HomeBannerAd";
import { CategoryBrowser } from "@/components/home/CategoryBrowser";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";
import { BusinessQuickActionsShell } from "@/components/home/BusinessQuickActionsShell";

const shouldLogHomeServerFallback = () => process.env.NODE_ENV === "development";

async function getHomeCategories(): Promise<Category[]> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
        if (shouldLogHomeServerFallback()) {
            logger.warn("NEXT_PUBLIC_API_URL is missing for homepage categories");
        }
        return [];
    }

    try {
        // SSR exception documented in docs/api-ssr-fetch-exceptions.md
        const response = await fetch(
            `${baseUrl}/${API_ROUTES.USER.CATEGORIES}?isActive=true&limit=20`,
            { next: { revalidate: 60 } }
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
        if (shouldLogHomeServerFallback()) {
            logger.warn("Home categories fetch failed", error);
        }
        return [];
    }
}

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Esparex - Buy & Sell Mobile Spares & Devices",
    description: "The best marketplace for mobile spare parts, used devices, and repair services.",
    alternates: {
        canonical: "https://esparex.in/",
    },
    openGraph: {
        title: "Esparex - Buy & Sell Mobile Spares & Devices",
        description: "The best marketplace for mobile spare parts, used devices, and repair services.",
        url: "https://esparex.in/",
        siteName: "Esparex",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Esparex — Buy & Sell Spare Parts" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Esparex - Buy & Sell Mobile Spares & Devices",
        description: "The best marketplace for mobile spare parts, used devices, and repair services.",
        images: ["/og-image.png"],
    },
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
                        url: "https://esparex.in/",
                        potentialAction: {
                            "@type": "SearchAction",
                            target: "https://esparex.in/search?q={search_term_string}",
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
