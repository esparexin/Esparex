import { Suspense } from 'react';
import { BrowseSpareParts } from '@/components/user/BrowseSpareParts';
import { Metadata } from 'next';
import { getSparePartListingsPage } from '@/api/user/sparePartListings';
import { getCategories } from '@/api/user/categories';

export const revalidate = 60;

export async function generateMetadata(
    props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const hasFilters = Object.keys(searchParams).some(k =>
        ['q', 'page', 'sort', 'category'].includes(k)
    );

    return {
        title: 'Browse Spare Parts | Esparex',
        description: 'Find spare parts for mobiles and laptops on Esparex. Quality parts from verified sellers.',
        alternates: {
            canonical: 'https://esparex.com/browse-spare-parts',
        },
        robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
    };
}

export default async function BrowseSparePartsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;

    const [initialResults, initialCategories] = await Promise.all([
        getSparePartListingsPage(
            {
                page: 1,
                limit: 20,
                ...(query ? { search: query } : {}),
                ...(category ? { categoryId: category } : {}),
            },
            { fetchOptions: { next: { revalidate: 60 } } }
        ),
        getCategories({ fetchOptions: { next: { revalidate: 3600 } } }),
    ]);

    return (
        <Suspense fallback={null}>
            <BrowseSpareParts
                initialCategory={category}
                initialSearchQuery={query}
                initialResults={initialResults}
                initialCategories={initialCategories}
            />
        </Suspense>
    );
}
