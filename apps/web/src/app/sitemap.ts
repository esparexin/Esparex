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

const API_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

export type SitemapItem = {
    id: string | number;
    slug?: string;
    updatedAt?: string;
};

/**
    return raw
        .toLowerCase()
        .replace(/[()]/g, '')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

    const d = date ? new Date(date) : new Date();
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
};
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
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));
        ...staticRoutes,
        ...adRoutes,
        ...businessRoutes,
        ...categoryRoutes,
        ...serviceRoutes,
        ...sparePartRoutes,
}
