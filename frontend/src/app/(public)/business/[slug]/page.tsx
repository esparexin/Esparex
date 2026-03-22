import { BusinessPageClient } from './BusinessPageClient';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { generateAdSlug } from '@/utils/slug';
import logger from "@/lib/logger";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/api/routes";
import { toSafeJsonLd } from "@/lib/seo/jsonLd";

type Props = {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function parseSlugWithOptionalId(param: string): { identifier: string; incomingSlug?: string; incomingId?: string } {
    const match = param.match(/^(.*)-([0-9a-fA-F]{24})$/);
    if (!match || !match[2]) {
        return { identifier: param };
    }

    return {
        identifier: match[2],
        incomingSlug: match[1],
        incomingId: match[2],
    };
}

async function getBusiness(identifier: string) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;
        // SSR exception documented in docs/api-ssr-fetch-exceptions.md
        const res = await fetch(`${API_URL}/${API_ROUTES.USER.BUSINESS_DETAIL(identifier)}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.data || data?.output?.data || data?.output || null;
    } catch (e) {
        logger.error("Error fetching business for metadata:", e);
        return null;
    }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { slug: rawParam } = await params;
    const { identifier } = parseSlugWithOptionalId(rawParam);
    const business = await getBusiness(identifier);

    if (!business) {
        return {
            title: 'Business Not Found | Esparex',
            description: 'The requested business profile could not be found.'
        };
    }

    const previousImages = (await parent).openGraph?.images || [];
    // Assuming business has 'logo' or 'images' array
    const mainImage = business.logo || (business.images && business.images.length > 0 ? business.images[0] : null);

    return {
        title: `${business.name || 'Business Profile'} | Esparex`,
        description: `${business.description?.substring(0, 150) || `Check out ${business.name} on Esparex`}`,
        alternates: {
            canonical: `https://esparex.com/business/${business.slug || generateAdSlug(business.name || '')}-${business.id || business._id || identifier}`,
        },
        openGraph: {
            title: `${business.name} | Esparex`,
            description: business.description?.substring(0, 200),
            images: mainImage ? [mainImage, ...previousImages] : previousImages,
        },
    };
}



export default async function BusinessProfilePage({ params }: Props) {
    const { slug: rawParam } = await params;
    const { identifier, incomingSlug, incomingId } = parseSlugWithOptionalId(rawParam);
    const business = await getBusiness(identifier);

    if (!business) {
        notFound();
    }

    const businessId = String(business.id || business._id || '');
    const canonicalSlug = business.slug || generateAdSlug(business.name || '');
    const canonicalParam = `${canonicalSlug}-${businessId}`;

    if (!canonicalSlug || !businessId) {
        notFound();
    }

    const isCanonical = incomingSlug === canonicalSlug && incomingId === businessId;
    if (!isCanonical) {
        permanentRedirect(`/business/${canonicalParam}`);
    }

    const jsonLd = business ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": business.name,
        "description": business.description,
        "image": business.logo || (business.images?.[0]),
        "telephone": business.mobile || business.phone,
        "url": `https://esparex.com/business/${canonicalParam}`
    } : null;

    return (
        <>
            <>
                {jsonLd && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: toSafeJsonLd(jsonLd) }}
                    />
                )}
                <BusinessPageClient />
            </>
        </>
    );
}
