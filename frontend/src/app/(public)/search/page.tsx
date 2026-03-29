import { Suspense } from 'react';
import { BrowseAds } from '@/components/user/BrowseAds';
import { BrowseServices } from '@/components/user/BrowseServices';
import { BrowseSpareParts } from '@/components/user/BrowseSpareParts';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdsPage } from "@/lib/api/user/listings";
import { API_ROUTES } from "@/lib/api/routes";
import { getCategories } from "@/lib/api/user/categories";
import { buildPublicBrowseRoute, normalizePublicBrowseType, parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";

export const revalidate = 60;

export async function generateMetadata(
    props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const parsed = parsePublicBrowseParams(searchParams);
    const hasFilters = Object.keys(searchParams).some((k) =>
        ['q', 'page', 'sort', 'category', 'categoryId', 'modelId', 'minPrice', 'maxPrice', 'location', 'locationId', 'brands', 'radiusKm'].includes(k)
    );

    const titlePrefix = parsed.type === 'service' ? 'Search Services' : parsed.type === 'spare_part' ? 'Search Spare Parts' : 'Search Ads';

    return {
        title: `${titlePrefix} | Esparex`,
        description: 'Browse thousands of electronics, spare parts, and repair services on Esparex.',
        alternates: {
            canonical: `https://esparex.com${buildPublicBrowseRoute({ type: parsed.type })}`,
        },
        robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
    };
}

export default async function SearchPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const parsed = parsePublicBrowseParams(searchParams);
    const rawType = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type;
    if (normalizePublicBrowseType(rawType) !== parsed.type || typeof rawType !== "string" || rawType.trim().length === 0) {
        redirect(buildPublicBrowseRoute(parsed));
    }

    const sortMap: Record<string, string> = {
        relevance: "relevance",
        newest: "createdAt_desc",
        price_low_high: "price_asc",
        price_high_low: "price_desc",
    };

    const endpointMap = {
        ad: API_ROUTES.USER.ADS,
        service: API_ROUTES.USER.SERVICES,
        spare_part: API_ROUTES.USER.SPARE_PART_LISTINGS,
    };
    const endpoint = endpointMap[parsed.type];
    const Component = parsed.type === 'service' ? BrowseServices : parsed.type === 'spare_part' ? BrowseSpareParts : BrowseAds;

    const [initialResults, initialCategories] = await Promise.all([
        getAdsPage(
            {
                status: 'live',
                page: parsed.page ?? 1,
                limit: 20,
                ...(parsed.q ? { search: parsed.q } : {}),
                ...(parsed.categoryId ? { categoryId: parsed.categoryId } : parsed.category ? { category: parsed.category } : {}),
                ...(parsed.modelId ? { modelId: parsed.modelId } : {}),
                ...(parsed.sort ? { sortBy: sortMap[parsed.sort] } : {}),
                ...(typeof parsed.minPrice === "number" ? { minPrice: parsed.minPrice } : {}),
                ...(typeof parsed.maxPrice === "number" ? { maxPrice: parsed.maxPrice } : {}),
                ...(parsed.location ? { location: parsed.location } : {}),
                ...(parsed.locationId ? { locationId: parsed.locationId } : {}),
                ...(parsed.brands ? { brandId: parsed.brands } : {}),
                ...(typeof parsed.radiusKm === "number" ? { radiusKm: parsed.radiusKm } : {}),
            },
            { 
                endpoint,
                fetchOptions: { next: { revalidate: 60 } } 
            }
        ),
        getCategories({ fetchOptions: { next: { revalidate: 3600 } } }),
    ]);

    return (
        <Suspense fallback={null}>
            <Component
                initialCategory={parsed.categoryId ?? parsed.category}
                initialSearchQuery={parsed.q}
                initialResults={initialResults as any}
                initialCategories={initialCategories}
            />
        </Suspense>
    );
}
