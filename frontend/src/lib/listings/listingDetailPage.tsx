import type { Metadata, ResolvingMetadata } from "next";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";

import { ListingPageClient } from "@/app/(public)/ads/[slug]/ListingPageClient";
import { getListingById } from "@/lib/api/user/listings";
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
    canonicalBasePath: "/ads" | "/services" | "/spare-part-listings";
}

interface RenderListingPageOptions {
    params: ListingSlugPageProps["params"];
    canonicalBasePath: "/ads" | "/services" | "/spare-part-listings";
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
    let listing: ListingLike | null = null;
    try {
        const cookieHeader = (await cookies()).toString();
        listing = await getListingById(
            id,
            cookieHeader ? { Cookie: cookieHeader } : undefined,
            { throwOnServerError: true }
        );
    } catch {
        return { title: missingTitle };
    }
    if (!listing) return { title: missingTitle };

    const listingTitle = listing.title || missingTitle;
    const canonicalSlug = generateAdSlug(listingTitle);
    const canonicalUrl = `${canonicalBasePath}/${canonicalSlug}-${listing.id}`;
    const previousImages = (await parent).openGraph?.images || [];
    const mainImage = listing.images?.[0];

    return {
        title: `${listingTitle} | Esparex`,
        description: listing.description?.slice(0, 160),
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: listingTitle,
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

    try {
        const cookieHeader = (await cookies()).toString();
        const listing = await getListingById(
            id,
            cookieHeader ? { Cookie: cookieHeader } : undefined,
            { throwOnServerError: true }
        );
        if (!listing) {
            notFound();
        }

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
    } catch {
        // Transient API/server failure. Preserve the client-side recovery path
        // rather than turning a backend error into a false 404.
        return <ListingPageClient ad={undefined} />;
    }
}
