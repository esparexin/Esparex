import { Suspense } from 'react';
import { BrowseAds } from '@/components/user/BrowseAds';
import { Metadata } from 'next';
import { getAdsPage } from '@/api/user/ads';
import { getCategories } from '@/api/user/categories';

export const revalidate = 60;

export async function generateMetadata(
    props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const hasFilters = Object.keys(searchParams).some((k) =>
        ['q', 'page', 'sort', 'category', 'minPrice', 'maxPrice', 'location', 'locationId', 'brands', 'radiusKm'].includes(k)
    );

    return {
        title: 'Search Ads | Esparex',
        description: 'Browse thousands of used electronics, spare parts, and repair services on Esparex. Filter by category, price, brand, and location.',
        alternates: {
            canonical: 'https://esparex.com/search',
        },
        robots: hasFilters
            ? {
                index: false,
                follow: true,
            }
            : {
                index: true,
                follow: true,
            },
    };
}

export default async function SearchPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;
    const [initialResults, initialCategories] = await Promise.all([
        getAdsPage(
            {
                status: 'live',
                page: 1,
                limit: 20,
                ...(query ? { search: query } : {}),
                ...(category ? { category } : {}),
            },
            { fetchOptions: { next: { revalidate: 60 } } }
        ),
        getCategories({ fetchOptions: { next: { revalidate: 3600 } } }),
    ]);

    return (
        <Suspense fallback={null}>
            <BrowseAds
                initialCategory={category}
                initialSearchQuery={query}
                initialResults={initialResults}
                initialCategories={initialCategories}
            />
        </Suspense>
    );
}
