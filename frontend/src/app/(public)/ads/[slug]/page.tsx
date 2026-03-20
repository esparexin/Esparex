import { ListingPageClient } from './ListingPageClient';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { generateAdSlug } from '@/utils/slug';
import { getListingById } from "@/api/user/ads";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";

type Props = {
    params: Promise<{ slug: string }>
}

function parseParams(param: string) {
    const match = param.match(/^(.*)-([0-9a-fA-F]{24})$/);
    if (!match || !match[2]) {
        return { id: param, slug: "" };
    }

    return {
        id: match[2],
        slug: match[1] || "",
    };
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { slug: rawParam } = await params;
    if (!rawParam) return { title: 'Listing Not Found' };

    const { id } = parseParams(rawParam);
    const ad = await getListingById(id);

    if (!ad) return { title: "Listing Not Found | Esparex" };

    const canonicalSlug = generateAdSlug(ad.title);
    const canonicalUrl = `/ads/${canonicalSlug}-${ad.id}`;

    const previousImages = (await parent).openGraph?.images || [];
    const mainImage = ad.images?.[0];

    return {
        title: `${ad.title} | Esparex`,
        description: ad.description?.slice(0, 160),
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: ad.title,
            description: ad.description,
            url: canonicalUrl,
            images: mainImage ? [mainImage, ...previousImages] : previousImages,
        },
    };
}

export default async function AdPage({ params }: Props) {
    const { slug: rawParam } = await params;
    if (!rawParam) notFound();
    const { id, slug: incomingSlug } = parseParams(rawParam);
    if (!id) notFound();

    const ad = await getListingById(id);

    if (ad) {
        const canonicalSlug = generateAdSlug(ad.title);

        // 301 Redirect for slug mismatch or legacy ID
        if (incomingSlug !== canonicalSlug || String(ad.id) !== String(id)) {
            permanentRedirect(`/ads/${canonicalSlug}-${ad.id}`);
        }

        return (
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: toSafeJsonLd({
                            "@context": "https://schema.org",
                            "@type": "Product",
                            "name": ad.title,
                            "description": ad.description,
                            "image": ad.images || [],
                            "offers": {
                                "@type": "Offer",
                                "price": ad.price,
                                "priceCurrency": "IQD",
                                "availability": ad.status === 'live' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                            }
                        })
                    }}
                />
                <ListingPageClient ad={ad} />
            </>
        );
    }

    // SSR fetch failed (ad requires auth, or returned an error).
    // Render without initial data — client will fetch with authentication.
    return <ListingPageClient ad={undefined} />;
}
