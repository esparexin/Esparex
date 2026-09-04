import type { Metadata, ResolvingMetadata } from "next";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";

import { ListingPageClient } from "@/app/(public)/ads/[slug]/ListingPageClient";
import { getListingById, type Listing } from "@/lib/api/user/listings";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";
import { toCanonicalUrl } from "@/lib/seo/canonicalHost";
import { generateAdSlug, parseListingSlugParam } from "@/lib/slug";

export { parseListingSlugParam };

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
    price?: number | null;
    priceMin?: number | null;
    priceMax?: number | null;
    currency?: string;
    status?: string;
    sellerName?: string;
    listingType?: string;
    condition?: string;
    brandName?: string;
    locationName?: string;
    seoSlug?: string;
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


export async function buildListingMetadata({
    params,
    parent,
    missingTitle,
    canonicalBasePath,
}: BuildListingMetadataOptions): Promise<Metadata> {
    const { slug: rawParam } = await params;
    if (!rawParam) return { title: "Listing Not Found", robots: { index: false, follow: false } };

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
        return { title: missingTitle, robots: { index: false, follow: false } };
    }
    if (!listing) return { title: missingTitle, robots: { index: false, follow: false } };

    const locationSuffix = listing.locationName ? ` in ${listing.locationName}` : "";
    const listingTitle = `${listing.title}${locationSuffix}` || missingTitle;
    
    const canonicalSlug = listing.seoSlug || generateAdSlug(listing.title || "");
    const canonicalUrl = toCanonicalUrl(`${canonicalBasePath}/${canonicalSlug}-${listing.id}`);
    const previousImages = (await parent).openGraph?.images || [];
    const mainImage = listing.images?.[0];

    const isIndexable = !listing.status || listing.status === "live";
    
    // SEO Optimized Description
    let seoDescription = "";
    if (listing.listingType === "service" && listing.priceMin) {
        seoDescription = `Service starting from ${listing.currency || "₹"}${listing.priceMin}. `;
    } else if (listing.price) {
        seoDescription = `Price: ${listing.currency || "₹"}${listing.price}. `;
    }
    seoDescription += listing.description || "";
    
    const metaDescription = seoDescription.slice(0, 160);
    const ogDescription = seoDescription.slice(0, 300);

    return {
        title: `${listingTitle} | Esparex`,
        description: metaDescription,
        alternates: { canonical: canonicalUrl },
        robots: isIndexable ? undefined : { index: false, follow: false },
        openGraph: {
            title: listingTitle,
            description: ogDescription,
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

    let listing: Listing | null = null;
    try {
        const cookieHeader = (await cookies()).toString();
        listing = await getListingById(
            id,
            cookieHeader ? { Cookie: cookieHeader } : undefined,
            { throwOnServerError: true }
        );
    } catch {
        // Fetch failed or threw network exception — trigger 404 handler outside catch block
        listing = null;
    }

    if (!listing) {
        notFound();
    }

    const canonicalSlug = listing.seoSlug || generateAdSlug(listing.title || "");
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
