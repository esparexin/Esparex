import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import { CANONICAL_SLUG_MAPPING, getCanonicalCategorySlug } from '@/lib/seo/canonicalSlugs';
import { getAdsPage } from "@/lib/api/user/listings";
import { getCategories } from "@/lib/api/user/categories";
import { ClientCategoryWrapper } from './ClientCategoryWrapper';

type Props = {
    params: Promise<{ category: string }>
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { category } = await params;

    // SEO: Enforce Canonical for Metadata
    const canonical = getCanonicalCategorySlug(category || "");
    const formattedCategory = canonical.charAt(0).toUpperCase() + canonical.slice(1).replace(/-/g, ' ');

    return {
        title: `${formattedCategory} | Esparex`,
        description: `Browse ${formattedCategory} on Esparex. Find the best deals on used electronics and spare parts.`,
        alternates: {
            canonical: `https://esparex.com/category/${canonical}`,
        },
    };
}

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
    return [];
}

export default async function CategoryRoute({ params }: Props) {
    const { category } = await params;

    if (!category) {
        notFound();
    }

    const normalized = category.toLowerCase().trim();
    const canonical = getCanonicalCategorySlug(normalized);

    if (canonical !== normalized) {
        permanentRedirect(`/category/${canonical}`);
    }

    const [initialResults, initialCategories] = await Promise.all([
        getAdsPage(
            {
                status: 'live',
                page: 1,
                limit: 20,
                category: canonical,
            },
            { fetchOptions: { next: { revalidate: 60 } } }
        ),
        getCategories({ fetchOptions: { next: { revalidate: 3600 } } }),
    ]);

    return (
        <ClientCategoryWrapper
            category={canonical}
            initialResults={initialResults}
            initialCategories={initialCategories}
        />
    );
}
