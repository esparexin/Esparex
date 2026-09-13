import { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN } from '@/lib/seo/canonicalHost';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                // Account namespace & Messaging
                '/account',
                '/account/',
                '/chat',
                '/chat/',
                // Actions
                '/post-ad',
                '/post-service',
                '/post-spare-part-listing',
                '/edit-ad/',
                '/edit-service/',
                '/edit-spare-part/',
                '/business/edit',
                '/notifications',
                // Legacy private routes (all have 301 redirects)
                '/profile',
                '/profile/',
                '/my-ads',
                '/saved-ads',
                '/messages',
                '/my-services',
                '/purchases',
                '/business/my-business',
                '/business/register',
                // System & Internal
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
