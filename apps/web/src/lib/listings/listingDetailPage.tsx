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
    priceMin?: number;
    priceMax?: number;
    currency?: string;
    status?: string;
    sellerName?: string;
    listingType?: string;
    condition?: string;
    brandName?: string;
    locationName?: string;
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

    const locationSuffix = listing.locationName ? ` in ${listing.locationName}` : "";
    const listingTitle = `${listing.title}${locationSuffix}` || missingTitle;
    
    const canonicalSlug = generateAdSlug(listing.title || "");
    const canonicalUrl = `${canonicalBasePath}/${canonicalSlug}-${listing.id}`;
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
        // The slug is invalid (e.g., a category name like "battery" instead of a
        // MongoDB ObjectId slug). Return 404 so Googlebot stops crawling these
        // invalid sitemap URLs and doesn't waste budget on empty pages.
        notFound();
    }
}
