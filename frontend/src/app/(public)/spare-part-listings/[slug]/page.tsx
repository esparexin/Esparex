import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListingPageClient } from '@/app/(public)/ads/[slug]/ListingPageClient';
import { getListingById } from '@/api/user/ads';
import { toSafeJsonLd } from '@/lib/seo/jsonLd';

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const listing = await getListingById(slug);
    if (!listing) return { title: 'Listing Not Found' };

    return {
        title: `${listing.title} | Esparex Spare Parts`,
        description: listing.description?.slice(0, 160),
    };
}

export default async function SparePartRoute({ params }: Props) {
    const { slug } = await params;
    const listing = await getListingById(slug);

    if (!listing) notFound();

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: toSafeJsonLd(listing) }}
            />
            <ListingPageClient ad={listing} />
        </>
    );
}
