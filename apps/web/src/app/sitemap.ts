import { MetadataRoute } from 'next';
import logger from "@/lib/logger";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";
import { getCanonicalCategorySlug } from "@/lib/seo/canonicalSlugs";

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour to reduce latency

export const BASE_URL = (() => {
    const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (raw) {
        try {
            const parsed = new URL(raw);
            const hostname = parsed.hostname.toLowerCase();
            if (
                hostname !== 'admin.esparex.in' &&
                !hostname.includes('preview') &&
                !hostname.includes('staging') &&
                (process.env.NODE_ENV !== 'production' || hostname === 'esparex.in')
            ) {
                return parsed.origin;
            }
        } catch {
            // fall through
        }
    }
    return 'https://esparex.in';
})();

// Use internal backend URL for faster server-side fetches if available
const API_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

export type SitemapItem = {
    id: string | number;
    slug?: string;
    updatedAt?: string;
};

/**
 * Sanitises a slug for use in a sitemap URL.
 * Strips parentheses and characters invalid in RFC 3986 paths.
 */
export function sanitiseSlug(raw: string): string {
    if (!raw) return '';
    return raw
        .toLowerCase()
        .replace(/[()]/g, '')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/**
 * Formats date to W3C format without milliseconds for strict XML parsers (Google standard)
 */
export const formatSitemapDate = (date: string | Date | undefined): string => {
    const d = date ? new Date(date) : new Date();
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

/**
 * Safely constructs URL with query parameters avoiding double-? or malformed query strings
 */
export function buildSitemapApiUrl(
    baseUrl: string,
    endpoint: string,
    params: Record<string, string> = {}
): string {
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const urlObj = new URL(cleanEndpoint, base);

    // Set default pagination parameters
    urlObj.searchParams.set('limit', '1000');
    urlObj.searchParams.set('page', '1');

    for (const [key, value] of Object.entries(params)) {
        urlObj.searchParams.set(key, value);
    }
    return urlObj.toString();
}

export async function fetchDynamicIds(
    endpoint: string,
    params: Record<string, string> = {},
    key = 'id',
    slugKey?: string
): Promise<SitemapItem[]> {
    try {
        const fullUrl = buildSitemapApiUrl(API_URL, endpoint, params);
        const res = await fetch(fullUrl, {
            next: { revalidate: 3600 },
            headers: {
                'Accept': 'application/json',
                'X-App-Source': 'sitemap-generator'
            }
        });

        if (!res.ok) {
            logger.warn(`Sitemap fetch failed for ${endpoint}: ${res.status}`);
            return [];
        }

        const data = await res.json();
        // Handle various response formats:
        // 1. { data: [...] } (Standard Paginated)
        // 2. { data: { items: [...] } } (Standard Paginated V2)
        // 3. { output: { items: [...] } } (Legacy)
        const items = data.data?.items || data.data || data.output?.items || data.output || [];

        if (!Array.isArray(items)) return [];

        return items.map((item: unknown) => {
            if (!isRecord(item)) {
                return { id: '', updatedAt: new Date().toISOString() };
            }
            const idValue = item[key] ?? item.id ?? item._id ?? '';
            const slugValue = slugKey ? item[slugKey] : undefined;
            const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString();
            return {
                id: idValue as string | number,
                slug: typeof slugValue === 'string' ? slugValue : undefined,
                updatedAt
            };
        }).filter((item) => String(item.id).trim() !== '');
    } catch (e) {
        logger.error(`Sitemap fetch error for ${endpoint}:`, e);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Parallel Fetch all dynamic live listings
    const [ads, businesses, services, spareParts] = await Promise.all([
        fetchDynamicIds(API_ROUTES.USER.LISTINGS, { listingType: 'ad', status: 'live' }, 'id', 'seoSlug'),
        fetchDynamicIds(API_ROUTES.USER.BUSINESSES_PUBLIC, {}, 'id', 'slug'),
        fetchDynamicIds(API_ROUTES.USER.LISTINGS, { listingType: 'service', status: 'live' }, 'id', 'slug'),
        fetchDynamicIds(API_ROUTES.USER.LISTINGS, { listingType: 'spare_part', status: 'live' }, 'id', 'slug'),
    ]);

    // 2. Static Public Canonical Routes
    const staticRoutes: MetadataRoute.Sitemap = [
        '',
        '/about',
        '/contact',
        '/faq',
        '/how-it-works',
        '/privacy',
        '/safety-tips',
        '/site-map',
        '/terms',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    // 3. Dynamic Live Ads
    const adRoutes: MetadataRoute.Sitemap = ads
        .filter((ad) => Boolean(ad.id))
        .map((ad) => {
            const slug = sanitiseSlug(String(ad.slug || ad.id));
            return {
                url: `${BASE_URL}/ads/${slug}-${ad.id}`,
                lastModified: formatSitemapDate(ad.updatedAt),
                changeFrequency: 'daily' as const,
                priority: 0.9,
            };
        });

    // 4. Dynamic Live Businesses
    const businessRoutes: MetadataRoute.Sitemap = businesses
        .filter((business) => Boolean(business.id))
        .map((business) => {
            const slug = sanitiseSlug(String(business.slug || business.id));
            return {
                url: `${BASE_URL}/business/${slug}-${business.id}`,
                lastModified: formatSitemapDate(business.updatedAt),
                changeFrequency: 'weekly' as const,
                priority: 0.9,
            };
        });

    // 5. Dynamic Live Services
    const serviceRoutes: MetadataRoute.Sitemap = services
        .filter((service) => Boolean(service.id))
        .map((service) => {
            const slug = sanitiseSlug(String(service.slug || service.id));
            return {
                url: `${BASE_URL}/services/${slug}-${service.id}`,
                lastModified: formatSitemapDate(service.updatedAt),
                changeFrequency: 'daily' as const,
                priority: 0.9,
            };
        });

    // 6. Canonical Categories (Always map to canonical slug to prevent 301 redirects)
    const rawCategories = ['mobiles', 'tablets', 'laptops', 'spare-parts', 'accessories', 'wearables', 'led-tvs'];
    const canonicalCategories = Array.from(new Set(rawCategories.map((cat) => getCanonicalCategorySlug(cat))));
    const categoryRoutes: MetadataRoute.Sitemap = canonicalCategories.map((cat) => ({
        url: `${BASE_URL}/category/${cat}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // 7. Individual Spare Part Listing Pages (canonical slug-id format)
    const sparePartRoutes: MetadataRoute.Sitemap = spareParts
        .filter((part) => Boolean(part.id && (!part.slug || /^[a-z0-9-]+$/.test(part.slug))))
        .map((part) => {
            const slug = sanitiseSlug(String(part.slug || part.id));
            return {
                url: `${BASE_URL}/spare-part-listings/${slug}-${part.id}`,
                lastModified: formatSitemapDate(part.updatedAt),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            };
        });

    // 8. Deduplicate and collect all valid routes
    const seenUrls = new Set<string>();
    const allRoutes: MetadataRoute.Sitemap = [];
    for (const route of [
        ...staticRoutes,
        ...adRoutes,
        ...businessRoutes,
        ...categoryRoutes,
        ...serviceRoutes,
        ...sparePartRoutes,
    ]) {
        if (!seenUrls.has(route.url)) {
            seenUrls.add(route.url);
            allRoutes.push(route);
        }
    }

    return allRoutes;
}
