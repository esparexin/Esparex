import { MetadataRoute } from 'next';
import logger from "@/lib/logger";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";
import { CANONICAL_ORIGIN, toCanonicalUrl } from "@/lib/seo/canonicalHost";
import { getCanonicalCategorySlug } from "@/lib/seo/canonicalSlugs";

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour to reduce latency

/** Canonical base URL: strictly https://esparex.in across all environments */
export const BASE_URL = CANONICAL_ORIGIN;

// Use internal backend URL for faster server-side fetches if available
const API_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

export type SitemapItem = {
    id: string | number;
    slug?: string;
    status?: string;
    isActive?: boolean;
    isDeleted?: boolean;
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
 * Formats date to W3C format without milliseconds.
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

/**
 * Patterns that must NEVER appear in /sitemap.xml
 */
export const FORBIDDEN_SITEMAP_PATTERNS: RegExp[] = [
    // Admin routes & subdomains
    /^\/admin(\/|$)/i,
    // Auth & Account namespaces
    /^\/account(\/|$)/i,
    /^\/profile(\/|$)/i,
    /^\/login(\/|$)/i,
    /^\/register(\/|$)/i,
    /^\/auth(\/|$)/i,
    // Messaging & Chat
    /^\/chat(\/|$)/i,
    /^\/messages(\/|$)/i,
    // Post / Create / Edit flows
    /^\/post-(ad|service|spare-part-listing)(\/|$)/i,
    /^\/edit-(ad|service|spare-part)(\/|$)/i,
    /^\/business\/edit(\/|$)/i,
    /^\/business\/register(\/|$)/i,
    /^\/business\/my-business(\/|$)/i,
    // User private dashboards
    /^\/my-ads(\/|$)/i,
    /^\/saved-ads(\/|$)/i,
    /^\/purchases(\/|$)/i,
    /^\/notifications(\/|$)/i,
    // System, API & Internal routes
    /^\/api(\/|$)/i,
    /^\/internal(\/|$)/i,
    /^\/_next(\/|$)/i,
    /^\/offline(\/|$)/i,
    /^\/unauthorized(\/|$)/i,
    // Search & Redirect routes (must not be in sitemap)
    /^\/search(\/|$)/i,
    /^\/browse-(services|spare-parts)(\/|$)/i,
    /^\/spare-parts(\/|$)/i, // Canonical path is /spare-part-listings/...
    /^\/business$/i, // Bare /business is a 301 redirect to /
    /^\/category\/mobile-phones(\/|$)/i, // Canonical is /category/mobiles
];

/** Allowed static canonical public routes */
export const STATIC_CANONICAL_PATHS = [
    '/',
    '/about',
    '/contact',
    '/faq',
    '/how-it-works',
    '/privacy',
    '/safety-tips',
    '/site-map',
    '/terms',
] as const;

/**
 * Validates that a candidate sitemap URL is strictly canonical, HTTPS, on esparex.in,
 * contains no query strings/sensitive tokens, and corresponds to an allowed public route.
 */
export function isValidSitemapUrl(urlStr: string): boolean {
    if (!urlStr || typeof urlStr !== 'string') return false;

    let parsed: URL;
    try {
        parsed = new URL(urlStr);
    } catch {
        return false;
    }

    // 1. Strict Protocol: https only
    if (parsed.protocol !== 'https:') return false;

    // 2. Strict Hostname: exactly 'esparex.in', reject all subdomains (*.esparex.in, admin.esparex.in, etc.)
    if (parsed.hostname !== 'esparex.in') return false;

    // 3. No ports, credentials, hash, or query parameters
    if (parsed.port || parsed.username || parsed.password || parsed.hash || parsed.search) return false;

    const pathname = parsed.pathname;

    // 4. Must not match any forbidden path patterns
    for (const pattern of FORBIDDEN_SITEMAP_PATTERNS) {
        if (pattern.test(pathname)) return false;
    }

    // 5. Must strictly match canonical public route patterns
    const isRoot = pathname === '/' || pathname === '';
    const isAllowedStatic = (STATIC_CANONICAL_PATHS as readonly string[]).includes(pathname);
    const isAllowedCategory = /^\/category\/[a-z0-9-]+$/.test(pathname);
    const isAllowedAd = /^\/ads\/[a-z0-9-]+-[a-zA-Z0-9_-]+$/.test(pathname);
    const isAllowedBusiness = /^\/business\/[a-z0-9-]+-[a-zA-Z0-9_-]+$/.test(pathname);
    const isAllowedService = /^\/services\/[a-z0-9-]+-[a-zA-Z0-9_-]+$/.test(pathname);
    const isAllowedSparePart = /^\/spare-part-listings\/[a-z0-9-]+-[a-zA-Z0-9_-]+$/.test(pathname);

    return (
        isRoot ||
        isAllowedStatic ||
        isAllowedCategory ||
        isAllowedAd ||
        isAllowedBusiness ||
        isAllowedService ||
        isAllowedSparePart
    );
}

export async function fetchDynamicIds(
    endpoint: string,
    params: Record<string, string> = {},
    key = 'id',
    slugKey?: string
): Promise<SitemapItem[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
        const fullUrl = buildSitemapApiUrl(API_URL, endpoint, params);
        const res = await fetch(fullUrl, {
            signal: controller.signal,
            next: { revalidate: 3600 },
            headers: {
                Accept: 'application/json',
                'X-App-Source': 'sitemap-generator',
            },
        });

        if (!res.ok) {
            logger.error(`[Sitemap] Fetch failed for ${endpoint}: HTTP ${res.status} ${res.statusText}`);
            return [];
        }

        const data = await res.json();
        if (isRecord(data) && (data.success === false || data.error)) {
            logger.error(`[Sitemap] API error for ${endpoint}: ${String(data.error || data.message || 'unknown error')}`);
            return [];
        }

        // Handle various response formats:
        // 1. { data: [...] } (Standard Paginated)
        // 2. { data: { items: [...] } } (Standard Paginated V2)
        // 3. { output: { items: [...] } } (Legacy)
        const items = data.data?.items || data.data || data.output?.items || data.output || [];

        if (!Array.isArray(items)) {
            logger.warn(`[Sitemap] Non-array items received for ${endpoint}`);
            return [];
        }

        return items
            .map((item: unknown): SitemapItem | null => {
                if (!isRecord(item)) return null;

                // Exclude draft / deleted / inactive / unpublished / non-indexable content
                if (item.isDeleted === true || item.deleted === true || Boolean(item.deletedAt)) {
                    return null;
                }
                if (item.isActive === false || item.disabled === true) {
                    return null;
                }
                if (item.noindex === true || item.indexable === false) {
                    return null;
                }
                if (typeof item.status === 'string') {
                    const statusLower = item.status.toLowerCase();
                    const allowedStatuses = ['live', 'active', 'published'];
                    if (!allowedStatuses.includes(statusLower)) {
                        return null;
                    }
                }

                // Validate ID
                const rawId = item[key] ?? item.id ?? item._id;
                if (rawId === undefined || rawId === null) return null;
                const idStr = String(rawId).trim();
                if (!idStr || !/^[a-zA-Z0-9_-]+$/.test(idStr)) {
                    return null;
                }

                // Validate and sanitize slug
                const rawSlug = slugKey && typeof item[slugKey] === 'string' ? item[slugKey] : undefined;
                const cleanSlug = sanitiseSlug(rawSlug || idStr);
                if (!cleanSlug || !/^[a-z0-9-]+$/.test(cleanSlug)) {
                    return null;
                }

                return {
                    id: idStr,
                    slug: cleanSlug,
                };
            })
            .filter((item): item is SitemapItem => item !== null);
    } catch (e: unknown) {
        const errMessage = e instanceof Error ? e.message : String(e);
        logger.error(`[Sitemap] Fetch error for ${endpoint}: ${errMessage}`);
        return [];
    } finally {
        clearTimeout(timeoutId);
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

    // 2. Static Public Canonical Routes (minimal: only valid loc entries)
    const staticRoutes: MetadataRoute.Sitemap = STATIC_CANONICAL_PATHS.map((path) => ({
        url: toCanonicalUrl(path),
    }));

    // 3. Dynamic Live Ads
    const adRoutes: MetadataRoute.Sitemap = ads.map((ad) => ({
        url: toCanonicalUrl(`/ads/${ad.slug}-${ad.id}`),
    }));

    // 4. Dynamic Live Businesses
    const businessRoutes: MetadataRoute.Sitemap = businesses.map((business) => ({
        url: toCanonicalUrl(`/business/${business.slug}-${business.id}`),
    }));

    // 5. Dynamic Live Services
    const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
        url: toCanonicalUrl(`/services/${service.slug}-${service.id}`),
    }));

    // 6. Canonical Categories (Always map to canonical slug to prevent 301 redirects)
    const rawCategories = ['mobiles', 'tablets', 'laptops', 'spare-parts', 'accessories', 'wearables', 'led-tvs'];
    const canonicalCategories = Array.from(new Set(rawCategories.map((cat) => getCanonicalCategorySlug(cat))));
    const categoryRoutes: MetadataRoute.Sitemap = canonicalCategories.map((cat) => ({
        url: toCanonicalUrl(`/category/${cat}`),
    }));

    // 7. Individual Spare Part Listing Pages (canonical slug-id format)
    const sparePartRoutes: MetadataRoute.Sitemap = spareParts.map((part) => ({
        url: toCanonicalUrl(`/spare-part-listings/${part.slug}-${part.id}`),
    }));

    // 8. Deduplicate and strictly validate all candidate routes
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
        if (!isValidSitemapUrl(route.url)) {
            logger.warn(`[Sitemap] Dropped invalid URL: ${route.url}`);
            continue;
        }
        if (!seenUrls.has(route.url)) {
            seenUrls.add(route.url);
            allRoutes.push({ url: route.url });
        }
    }

    return allRoutes;
}
