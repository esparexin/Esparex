import type { Metadata, ResolvingMetadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ListingPageClient } from "@/app/(public)/ads/[slug]/ListingPageClient";
import { getListingById } from "@/lib/api/user/ads";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";
import { generateAdSlug } from "@/lib/slug";

export type ListingSlugPageProps = {
    params: Promise<{ slug: string }>;
};

export interface ListingStructuredData {
    "@context": "https://schema.org";
    "@type": string;
    [key: string]: unknown;
}

export interface ListingLike {
    id?: string | number;
    title?: string;
    description?: string;
    images?: string[];
    price?: number;
    status?: string;
    sellerName?: string;
}

interface BuildListingMetadataOptions {
    params: ListingSlugPageProps["params"];
    parent: ResolvingMetadata;
    missingTitle: string;
    canonicalBasePath: "/ads" | "/services";
}

interface RenderListingPageOptions {
    params: ListingSlugPageProps["params"];
    canonicalBasePath: "/ads" | "/services";
    buildStructuredData: (listing: ListingLike) => ListingStructuredData;
}

export function parseListingSlugParam(param: string) {
    const match = param.match(/^(.*)-([0-9a-fA-F]{24})$/);
    if (!match || !match[2]) {
        return { id: param, slug: "" };
    }
    return {
        id: match[2],
        slug: match[1] || "",
    };
}

export async function buildListingMetadata({
    params,
    parent,
    missingTitle,
    canonicalBasePath,
}: BuildListingMetadataOptions): Promise<Metadata> {
    const { slug: rawParam } = await params;
    if (!rawParam) return { title: "Listing Not Found" };

    const { id } = parseListingSlugParam(rawParam);
    const listing = await getListingById(id);
    if (!listing) return { title: missingTitle };

    const canonicalSlug = generateAdSlug(listing.title);
    const canonicalUrl = `${canonicalBasePath}/${canonicalSlug}-${listing.id}`;
    const previousImages = (await parent).openGraph?.images || [];
    const mainImage = listing.images?.[0];

    return {
        title: `${listing.title} | Esparex`,
        description: listing.description?.slice(0, 160),
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: listing.title,
            description: listing.description,
            url: canonicalUrl,
            images: mainImage ? [mainImage, ...previousImages] : previousImages,
        },
    };
}

export async function renderListingDetailPage({
    params,
    canonicalBasePath,
    buildStructuredData,
}: RenderListingPageOptions) {
    const { slug: rawParam } = await params;
    if (!rawParam) notFound();

    const { id, slug: incomingSlug } = parseListingSlugParam(rawParam);
    if (!id) notFound();

    const listing = await getListingById(id);
    if (listing) {
        const canonicalSlug = generateAdSlug(listing.title);
        if (incomingSlug !== canonicalSlug || String(listing.id) !== String(id)) {
            permanentRedirect(`${canonicalBasePath}/${canonicalSlug}-${listing.id}`);
        }

        return (
            <>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: toSafeJsonLd(buildStructuredData(listing)),
                    }}
                />
                <ListingPageClient ad={listing} />
            </>
        );
    }

    // SSR fetch failed (requires auth, or returned an error).
    // Render without initial data — client will fetch with authentication.
    return <ListingPageClient ad={undefined} />;
}
