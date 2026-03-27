import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { ListingPageClient } from '@/app/(public)/ads/[slug]/ListingPageClient';
import { getListingById } from "@/lib/api/user/listings";
import { toSafeJsonLd } from '@/lib/seo/jsonLd';
import { generateAdSlug } from "@/lib/slug";
import { parseListingSlugParam } from "@/lib/listings/listingDetailPage";

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug: rawParam } = await params;
    const { id } = parseListingSlugParam(rawParam || "");
    const listing = await getListingById(id);
    if (!listing) return { title: 'Listing Not Found | Esparex' };

    return {
        title: `${listing.title} | Esparex Spare Parts`,
        description: listing.description?.slice(0, 160),
    };
}

export default async function SparePartRoute({ params }: Props) {
    const { slug: rawParam } = await params;
    if (!rawParam) notFound();

    const { id, slug: incomingSlug } = parseListingSlugParam(rawParam);
    if (!id) notFound();

    const listing = await getListingById(id);

    if (listing) {
        const canonicalSlug = generateAdSlug(listing.title);
        // Canonical redirect to /spare-part-listings/slug-id
        if (incomingSlug !== canonicalSlug || String(listing.id) !== String(id)) {
            permanentRedirect(`/spare-part-listings/${canonicalSlug}-${listing.id}`);
        }

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

    // SSR fallback to client fetch
    return <ListingPageClient ad={undefined} />;
}
