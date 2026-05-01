import { Suspense } from 'react';
import { BrowseAds } from '@/components/user/BrowseAds';
import { BrowseServices } from '@/components/user/BrowseServices';
import { BrowseSpareParts } from '@/components/user/BrowseSpareParts';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdsPage, type ListingPageResult } from "@/lib/api/user/listings";
import { API_ROUTES } from "@/lib/api/routes";
import { getCategories } from "@/lib/api/user/categories";
import { resolveBrowseCategorySelection } from "@/lib/browse/browseFilterNormalization";
import { buildPublicBrowseRoute, normalizePublicBrowseType, parsePublicBrowseParams } from "@/lib/publicBrowseRoutes";
import { PUBLIC_BROWSE_SORT_MAP, type SortOption } from "@/lib/publicBrowseSort";

export const revalidate = 60;

export async function generateMetadata(
    props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const parsed = parsePublicBrowseParams(searchParams);
    const hasFilters = Object.keys(searchParams).some((k) =>
        ['q', 'page', 'sort', 'category', 'categoryId', 'modelId', 'minPrice', 'maxPrice', 'location', 'locationId', 'brands', 'radiusKm'].includes(k)
    );

    const titleMap: Record<string, string> = {
        service: 'Repair Services Near Me | Esparex',
        spare_part: 'Buy Mobile Spare Parts Online India | Esparex',
    };
    const titleDefault = 'Buy Used Electronics & Spare Parts Online India | Esparex';

    return {
        title: titleMap[parsed.type] ?? titleDefault,
        description: 'Browse thousands of mobile spare parts, used phones, laptops and repair services across India on Esparex.',
        alternates: {
            canonical: `https://esparex.in${buildPublicBrowseRoute({ type: parsed.type })}`,
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

    const endpoint = API_ROUTES.USER.LISTINGS;
    const Component = parsed.type === 'service' ? BrowseServices : parsed.type === 'spare_part' ? BrowseSpareParts : BrowseAds;
    const initialCategories = await getCategories({ fetchOptions: { next: { revalidate: 3600 } } });
    const resolvedCategory = resolveBrowseCategorySelection(
        parsed.categoryId ?? parsed.category,
        initialCategories
    );
    const initialResults = await getAdsPage(
        {
            status: 'live',
            type: parsed.type,
            page: parsed.page ?? 1,
            limit: 20,
            ...(parsed.q ? { search: parsed.q } : {}),
            ...(resolvedCategory.categoryId ? { categoryId: resolvedCategory.categoryId } : {}),
            ...(parsed.modelId ? { modelId: parsed.modelId } : {}),
            ...(parsed.sort ? { sortBy: PUBLIC_BROWSE_SORT_MAP[parsed.sort as SortOption] } : {}),
            ...(typeof parsed.minPrice === "number" ? { minPrice: parsed.minPrice } : {}),
            ...(typeof parsed.maxPrice === "number" ? { maxPrice: parsed.maxPrice } : {}),
            ...(parsed.locationId ? { locationId: parsed.locationId } : {}),
            ...(parsed.brands ? { brandId: parsed.brands } : {}),
            ...(typeof parsed.radiusKm === "number" && parsed.locationId ? { radiusKm: parsed.radiusKm } : {}),
        },
        {
            endpoint,
            fetchOptions: { next: { revalidate: 60 } }
        }
    );

    const h1Map: Record<string, string> = {
        service: 'Find Mobile Repair Services Near You',
        spare_part: 'Buy Mobile Spare Parts Online India',
    };
    const h1Default = 'Buy Used Electronics & Spare Parts Online India';

    return (
        <>
            {/* Server-rendered H1 — always visible to Googlebot before hydration */}
            <h1 className="sr-only">{h1Map[parsed.type] ?? h1Default}</h1>
            <Suspense fallback={null}>
                <Component
                    initialCategory={parsed.categoryId ?? parsed.category}
                    initialSearchQuery={parsed.q}
                    initialResults={initialResults as ListingPageResult}
                    initialCategories={initialCategories}
                />
            </Suspense>
        </>
    );
}
