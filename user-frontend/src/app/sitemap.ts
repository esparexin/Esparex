import { MetadataRoute } from 'next';
import logger from "@/lib/logger";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour to reduce latency

const BASE_url = process.env.NEXT_PUBLIC_APP_URL || 'https://esparex.in';
// Use internal backend URL for faster server-side fetches if available
const API_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

type SitemapItem = {
    id: string | number;
    slug?: string;
    updatedAt?: string;
};

/**
 * Sanitises a spare-part/category slug for use in a sitemap URL.
 * Strips parentheses and other characters invalid in RFC 3986 paths.
 */
function sanitiseSlug(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[()]/g, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/**
 * Formats date to W3C format without milliseconds for strict XML parsers (Google standard)
 */
const formatSitemapDate = (date: string | Date | undefined): string => {
    const d = date ? new Date(date) : new Date();
    // Return ISO string without milliseconds: YYYY-MM-DDThh:mm:ssZ
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

async function fetchDynamicIds(endpoint: string, key = 'id', slugKey?: string): Promise<SitemapItem[]> {
    try {
        const url = `${API_URL}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");
        // Fetch up to 1000 items for sitemap with 10s timeout
        const res = await fetch(`${url}?limit=1000&page=1`, { 
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
            const idValue = item[key] ?? item.id ?? '';
            const slugValue = slugKey ? item[slugKey] : undefined;
            const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString();
            return {
                id: idValue as string | number,
                slug: typeof slugValue === 'string' ? slugValue : undefined,
                updatedAt
            };
        }).filter((item) => item.id !== '');
    } catch (e) {
        logger.error(`Sitemap fetch error for ${endpoint}:`, e);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Parallel Fetch all dynamic data
    const [ads, businesses, services, spareParts] = await Promise.all([
        fetchDynamicIds(`${API_ROUTES.USER.LISTINGS}?listingType=ad`, 'id', 'seoSlug'),
        fetchDynamicIds(API_ROUTES.USER.BUSINESSES_PUBLIC, 'id', 'slug'),
        fetchDynamicIds(`${API_ROUTES.USER.LISTINGS}?listingType=service`, 'id', 'slug'),
        fetchDynamicIds('catalog/spare-parts', 'id', 'slug')
    ]);

    // 2. Static Routes
    const staticRoutes: MetadataRoute.Sitemap = [
        '',
        '/about',
        // NOTE: /search?type=* removed — query-param URLs waste crawl budget.
    // /browse-spare-parts and /browse-services redirect to /search; omit them.
        '/contact',
        '/faq',
        '/how-it-works',
        '/privacy',
        '/safety-tips',
        '/site-map',
        '/terms',
    ].map((route) => ({
        url: `${BASE_url}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    // 3. Dynamic Ads
    const adRoutes: MetadataRoute.Sitemap = ads.map((ad) => ({
        url: `${BASE_url}/ads/${ad.slug || ad.id}-${ad.id}`,
        lastModified: formatSitemapDate(ad.updatedAt),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    // 4. Dynamic Businesses
    const businessRoutes: MetadataRoute.Sitemap = businesses.map((business) => ({
        url: `${BASE_url}/business/${business.slug || business.id}-${business.id}`,
        lastModified: formatSitemapDate(business.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    // 5. Dynamic Services
    const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
        url: `${BASE_url}/services/${service.slug || service.id}-${service.id}`,
        lastModified: formatSitemapDate(service.updatedAt),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    // 6. Categories (Semi-static)
    const categories = ['Mobile Phones', 'Tablets', 'Laptops', 'Spare Parts', 'Accessories', 'Wearables'];
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
        url: `${BASE_url}/category/${cat.toLowerCase().replace(/ /g, '-')}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));
 
    // 7. Individual Spare Part Listing Pages (with proper slug-id format)
    // NOTE: Catalog aggregator pages (e.g. /spare-part-listings/battery) are omitted
    // because they 404 on the current route — a dedicated aggregator page is required.
    const sparePartRoutes: MetadataRoute.Sitemap = spareParts
        .filter((part) => part.slug && !part.slug.match(/^[a-z0-9-]+$/) === false)
        .map((part) => ({
            url: `${BASE_url}/spare-part-listings/${sanitiseSlug(String(part.slug || part.id))}`,
            lastModified: formatSitemapDate(part.updatedAt),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

    return [
        ...staticRoutes,
        ...adRoutes,
        ...businessRoutes,
        ...categoryRoutes,
        ...serviceRoutes,
        ...sparePartRoutes
    ];
}

