import { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN } from '@/lib/seo/canonicalHost';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                // Account and user namespace
                '/account/',
                '/chat',
                '/chat/',
                '/notifications',
                // Private create & edit actions
                '/post-ad',
                '/post-service',
                '/post-spare-part-listing',
                '/edit-ad/',
                '/edit-service/',
                '/edit-spare-part/',
                '/business/edit',
                '/business/my-business',
                '/business/register',
                // Legacy private routes (all have 301 redirects)
                '/profile/',
                '/my-ads',
                '/saved-ads',
                '/messages',
                '/my-services',
                '/purchases',
                // System and internal endpoints
                '/api/',
                '/admin/',
                '/internal/',
                '/offline',
                '/unauthorized',
            ],
        },
        sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    };
}
