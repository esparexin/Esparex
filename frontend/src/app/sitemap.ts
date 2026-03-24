import { MetadataRoute } from 'next';
import logger from "@/lib/logger";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE_url = process.env.NEXT_PUBLIC_APP_URL || 'https://esparex.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

type SitemapItem = {
    id: string | number;
    slug?: string;
    updatedAt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

async function fetchDynamicIds(endpoint: string, key = 'id', slugKey?: string): Promise<SitemapItem[]> {
    try {
        // Fetch up to 1000 items for sitemap
        const res = await fetch(`${API_URL}/${endpoint}?limit=1000&page=1`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        // Handle various response formats:
        // 1. { data: [...] } (Standard Paginated)
        // 2. { output: { items: [...] } } (Legacy)
        // 3. [...] (Direct Array)
        const items = data.data || data.output?.items || data.output || [];

        // Ensure items is an array
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
    // 1. Static Routes
    const staticRoutes = [
        '',
        '/about',
        '/search',
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

    // 2. Dynamic Ads
    const ads = await fetchDynamicIds(API_ROUTES.USER.ADS, 'id', 'seoSlug');
    const adRoutes = ads.map((ad) => ({
        url: `${BASE_url}/ads/${ad.slug || ad.id}-${ad.id}`,
        lastModified: new Date(ad.updatedAt ?? new Date().toISOString()),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    // 3. Dynamic Businesses
    const businesses = await fetchDynamicIds(API_ROUTES.USER.BUSINESSES_PUBLIC, 'id', 'slug');
    const businessRoutes = businesses.map((business) => ({
        url: `${BASE_url}/business/${business.slug || business.id}-${business.id}`,
        lastModified: new Date(business.updatedAt ?? new Date().toISOString()),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    // 4. Dynamic Services
    const services = await fetchDynamicIds(API_ROUTES.USER.SERVICES, 'id', 'slug');
    const serviceRoutes = services.map((service) => ({
        url: `${BASE_url}/services/${service.slug || service.id}-${service.id}`,
        lastModified: new Date(service.updatedAt ?? new Date().toISOString()),
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }));

    // 5. Categories
    const categories = ['Mobile Phones', 'Tablets', 'Laptops', 'Spare Parts', 'Accessories', 'Wearables'];
    const categoryRoutes = categories.map((cat) => ({
        url: `${BASE_url}/category/${cat.toLowerCase().replace(/ /g, '-')}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));
 
    // 6. Spare Parts (Catalog Aggregator Pages)
    const spareParts = await fetchDynamicIds('catalog/spare-parts', 'id', 'slug');
    const sparePartRoutes = spareParts.map((part) => ({
        url: `${BASE_url}/spare-part-listings/${part.slug || part.id}`,
        lastModified: new Date(part.updatedAt ?? new Date().toISOString()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Add browse-services static route
    const browseServicesRoute = {
        url: `${BASE_url}/browse-services`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    };

    return [...staticRoutes, browseServicesRoute, ...adRoutes, ...businessRoutes, ...categoryRoutes, ...serviceRoutes, ...sparePartRoutes];
}
