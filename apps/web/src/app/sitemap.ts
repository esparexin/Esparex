import { MetadataRoute } from 'next';
import logger from "@/lib/logger";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";
import { CANONICAL_ORIGIN } from "@/lib/seo/canonicalHost";
import { getCanonicalCategorySlug } from "@/lib/seo/canonicalSlugs";

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour to reduce latency

const API_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

type SitemapItem = {
    id: string | number;
    slug?: string;
    updatedAt?: string;
};

/**
 * Sanitises a slug for use in sitemap URLs according to RFC 3986.
 */
export function sanitiseSlug(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/[()]/g, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const formatSitemapDate = (date: string | Date | undefined): string => {
    const d = date ? new Date(date) : new Date();
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

async function fetchDynamicIds(endpoint: string, key = 'id', slugKey?: string): Promise<SitemapItem[]> {
    const allItems: SitemapItem[] = [];
    let page = 1;
    const limit = 1000;
    const maxPages = 5;

    try {
        const baseEndpoint = `${API_URL}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");

        while (page <= maxPages) {
            const separator = baseEndpoint.includes('?') ? '&' : '?';
            const fetchUrl = `${baseEndpoint}${separator}limit=${limit}&page=${page}`;
            const res = await fetch(fetchUrl, {
                next: { revalidate: 3600 },
                headers: {
                    'Accept': 'application/json',
                    'X-App-Source': 'sitemap-generator',
                },
            });

            if (!res.ok) {
                if (page === 1) {
                    logger.warn(`Sitemap fetch failed for ${endpoint}: ${res.status}`);
                }
                break;
            }

            const data = await res.json();
            const items = data.data?.items || data.data || data.output?.items || data.output || [];
            if (!Array.isArray(items) || items.length === 0) {
                break;
            }

            const mapped: SitemapItem[] = items.map((item: unknown) => {
                if (!isRecord(item)) {
                    return { id: '', updatedAt: new Date().toISOString() };
                }
                const idValue = item[key] ?? item.id ?? '';
                const rawSlug = slugKey ? (item[slugKey] ?? item.slug ?? item.seoSlug) : (item.slug ?? item.seoSlug);
                const slugValue = typeof rawSlug === 'string' && rawSlug.trim() ? rawSlug.trim() : undefined;
                const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString();
                return {
                    id: idValue as string | number,
                    slug: slugValue,
                    updatedAt,
                };
            }).filter((item) => item.id !== '');

            allItems.push(...mapped);
            if (items.length < limit) {
                break;
            }
            page++;
        }
        return allItems;
    } catch (e) {
        logger.error(`Sitemap fetch error for ${endpoint}:`, e);
        return allItems;
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [ads, businesses, services, spareParts] = await Promise.all([
        fetchDynamicIds(`${API_ROUTES.USER.LISTINGS}?listingType=ad&status=live`, 'id', 'seoSlug'),
        fetchDynamicIds(API_ROUTES.USER.BUSINESSES_PUBLIC, 'id', 'slug'),
        fetchDynamicIds(`${API_ROUTES.USER.LISTINGS}?listingType=service&status=live`, 'id', 'slug'),
        fetchDynamicIds(`${API_ROUTES.USER.LISTINGS}?listingType=spare_part&status=live`, 'id', 'seoSlug'),
    ]);

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
        url: route === '' ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    const adRoutes: MetadataRoute.Sitemap = ads.map((ad) => ({
        url: `${CANONICAL_ORIGIN}/ads/${sanitiseSlug(String(ad.slug || ad.id))}-${ad.id}`,
        lastModified: formatSitemapDate(ad.updatedAt),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    const businessRoutes: MetadataRoute.Sitemap = businesses.map((business) => ({
        url: `${CANONICAL_ORIGIN}/business/${sanitiseSlug(String(business.slug || business.id))}-${business.id}`,
        lastModified: formatSitemapDate(business.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
        url: `${CANONICAL_ORIGIN}/services/${sanitiseSlug(String(service.slug || service.id))}-${service.id}`,
        lastModified: formatSitemapDate(service.updatedAt),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    const categorySlugs = Array.from(new Set(
        ['mobiles', 'tablets', 'laptops', 'spare-parts', 'accessories', 'wearables', 'led-tvs']
            .map((cat) => getCanonicalCategorySlug(cat))
    ));
    const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
        url: `${CANONICAL_ORIGIN}/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const sparePartRoutes: MetadataRoute.Sitemap = spareParts.map((part) => ({
        url: `${CANONICAL_ORIGIN}/spare-part-listings/${sanitiseSlug(String(part.slug || part.id))}-${part.id}`,
        lastModified: formatSitemapDate(part.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    const allRoutes: MetadataRoute.Sitemap = [
        ...staticRoutes,
        ...adRoutes,
        ...businessRoutes,
        ...categoryRoutes,
        ...serviceRoutes,
        ...sparePartRoutes,
    ];

    const seen = new Set<string>();
    return allRoutes.filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    });
}
