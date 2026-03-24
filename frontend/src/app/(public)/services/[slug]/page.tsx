import { ListingPageClient } from '../../ads/[slug]/ListingPageClient';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { generateAdSlug } from "@/lib/slug";
import { getListingById } from "@/lib/api/user/ads";
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
    const service = await getListingById(id);

    if (!service) return { title: "Service Not Found | Esparex" };

    const canonicalSlug = generateAdSlug(service.title);
    const canonicalUrl = `/services/${canonicalSlug}-${service.id}`;

    const previousImages = (await parent).openGraph?.images || [];
    const mainImage = service.images?.[0];

    return {
        title: `${service.title} | Esparex`,
        description: service.description?.slice(0, 160),
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: service.title,
            description: service.description,
            url: canonicalUrl,
            images: mainImage ? [mainImage, ...previousImages] : previousImages,
        },
    };
}

export default async function ServicePage({ params }: Props) {
    const { slug: rawParam } = await params;
    if (!rawParam) notFound();
    const { id, slug: incomingSlug } = parseParams(rawParam);
    if (!id) notFound();

    const service = await getListingById(id);

    if (service) {
        const canonicalSlug = generateAdSlug(service.title);

        // 301 Redirect for slug mismatch or legacy ID
        if (incomingSlug !== canonicalSlug || String(service.id) !== String(id)) {
            permanentRedirect(`/services/${canonicalSlug}-${service.id}`);
        }

        return (
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: toSafeJsonLd({
                            "@context": "https://schema.org",
                            "@type": "Service",
                            "name": service.title,
                            "description": service.description,
                            "image": service.images || [],
                            "provider": {
                                "@type": "LocalBusiness",
                                "name": service.sellerName || "Service Provider"
                            },
                            "offers": {
                                "@type": "Offer",
                                "price": service.price,
                                "priceCurrency": "IQD",
                                "availability": service.status === 'live' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                            }
                        })
                    }}
                />
                <ListingPageClient ad={service} />
            </>
        );
    }

    // SSR fetch failed (service requires auth, or returned an error).
    // Render without initial data — client will fetch with authentication.
    return <ListingPageClient ad={undefined} />;
}
