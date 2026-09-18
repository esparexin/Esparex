import { Suspense } from 'react';
import { Metadata } from 'next';
import { BrowseAds } from '@/components/user/BrowseAds';
import { AdCardSkeleton } from '@/components/user/ad-card/AdCardSkeleton';
import { getAdsPage, type ListingPageResult } from '@/lib/api/user/listings';
import { API_ROUTES } from '@/lib/api/routes';
import { getCategories, type Category } from '@/lib/api/user/categories';
import { resolveBrowseCategorySelection } from '@/lib/browse/browseFilterNormalization';
import { toCanonicalUrl } from '@/lib/seo/canonicalHost';
import { parsePublicBrowseParams } from '@/lib/publicBrowseRoutes';
import { PUBLIC_BROWSE_SORT_MAP, type SortOption } from '@/lib/publicBrowseSort';

export const revalidate = 60;

export const metadata: Metadata = {
    title: 'Mobile & Electronics Repair Services Near You | Esparex',
    description: 'Find trusted local repair services for smartphones, laptops, tablets, and electronics across India on Esparex. Verified technicians and transparent pricing.',
    alternates: {
        canonical: toCanonicalUrl('/services'),
    },
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: 'Mobile & Electronics Repair Services Near You | Esparex',
        description: 'Find trusted local repair services for smartphones, laptops, tablets, and electronics across India on Esparex.',
        url: toCanonicalUrl('/services'),
        siteName: 'Esparex',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Esparex Repair Services' }],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Mobile & Electronics Repair Services Near You | Esparex',
        description: 'Find trusted local repair services for smartphones, laptops, tablets, and electronics across India on Esparex.',
        images: ['/og-image.png'],
    },
};

function ServicesPageFallback() {
    return (
        <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 8 }).map((_, i) => (
                    <AdCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

const buildBrowseFilters = (
    parsed: ReturnType<typeof parsePublicBrowseParams>,
    resolvedCategoryId?: string
) => {
    return {
        status: 'live' as const,
        type: 'service' as const,
        page: parsed.page ?? 1,
        limit: 20,
        ...(parsed.q ? { search: parsed.q } : {}),
        ...(resolvedCategoryId ? { categoryId: resolvedCategoryId } : {}),
        ...(parsed.modelId ? { modelId: parsed.modelId } : {}),
        ...(parsed.sort ? { sortBy: PUBLIC_BROWSE_SORT_MAP[parsed.sort as SortOption] } : {}),
        ...(typeof parsed.minPrice === 'number' ? { minPrice: parsed.minPrice } : {}),
        ...(typeof parsed.maxPrice === 'number' ? { maxPrice: parsed.maxPrice } : {}),
        ...(parsed.locationId ? { locationId: parsed.locationId } : {}),
        ...(parsed.brands ? { brandId: parsed.brands } : {}),
        ...(typeof parsed.radiusKm === 'number' && parsed.locationId ? { radiusKm: parsed.radiusKm } : {}),
    };
};

export default async function ServicesPage(props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const rawSearchParams = props.searchParams ? await props.searchParams : {};
    const parsed = parsePublicBrowseParams(rawSearchParams);

    const endpoint = API_ROUTES.USER.LISTINGS;

    const rawCategoryInput = parsed.categoryId ?? parsed.category;
    const isCategorySlug = Boolean(rawCategoryInput && !/^[0-9a-fA-F]{24}$/.test(rawCategoryInput));

    let initialCategories: Category[] = [];
    let initialResults: Awaited<ReturnType<typeof getAdsPage>>;

    if (isCategorySlug) {
        initialCategories = await getCategories({ fetchOptions: { next: { revalidate: 3600 } } });
        const resolvedCategory = resolveBrowseCategorySelection(rawCategoryInput, initialCategories);
        initialResults = await getAdsPage(
            buildBrowseFilters(parsed, resolvedCategory.categoryId),
            {
                endpoint,
                fetchOptions: { next: { revalidate: 60 } },
            }
        );
    } else {
        const directCategoryId = rawCategoryInput && /^[0-9a-fA-F]{24}$/.test(rawCategoryInput) ? rawCategoryInput : undefined;
        [initialCategories, initialResults] = await Promise.all([
            getCategories({ fetchOptions: { next: { revalidate: 3600 } } }),
            getAdsPage(
                buildBrowseFilters(parsed, directCategoryId),
                {
                    endpoint,
                    fetchOptions: { next: { revalidate: 60 } },
                }
            ),
        ]);
    }

    return (
        <>
            {/* Server-rendered H1 — always visible to Googlebot before hydration */}
            <h1 className="sr-only">Mobile &amp; Electronics Repair Services Near You — Esparex</h1>
            <Suspense fallback={<ServicesPageFallback />}>
                <BrowseAds
                    browseType="service"
                    initialCategory={parsed.categoryId ?? parsed.category}
                    initialSearchQuery={parsed.q}
                    initialResults={initialResults as ListingPageResult}
                    initialCategories={initialCategories}
                />
            </Suspense>
        </>
    );
}
