import { Suspense } from 'react';
import { BrowseServices } from '@/components/user/BrowseServices';
import { Metadata } from 'next';
import { getServicesPage } from '@/api/user/services';
import { getCategories } from '@/api/user/categories';

export const revalidate = 60;

export async function generateMetadata(
    props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const hasFilters = Object.keys(searchParams).some(k =>
        ['q', 'page', 'sort', 'category', 'minPrice', 'maxPrice'].includes(k)
    );

    return {
        title: 'Browse Services | Esparex',
        description: 'Find the best mobile and laptop repair services near you on Esparex. Specialized technicians for all major brands.',
        alternates: {
            canonical: 'https://esparex.com/browse-services',
        },
        robots: hasFilters ? {
            index: false,
            follow: true
        } : {
            index: true,
            follow: true
        }
    };
}



export default async function BrowseServicesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;
    const [initialResults, initialCategories] = await Promise.all([
        getServicesPage(
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
            <BrowseServices
                initialCategory={category}
                initialSearchQuery={query}
                initialResults={initialResults}
                initialCategories={initialCategories}
            />
        </Suspense>
    );
}
