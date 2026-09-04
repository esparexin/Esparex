import { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN } from '@/lib/seo/canonicalHost';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/post-ad',
                '/post-service',
                '/post-spare-part-listing',
                '/edit-ad/',
                '/edit-service/',
                '/edit-spare-part/',
                '/business/edit',
                // Legacy private routes (all have 301 redirects)
                '/profile/',
                '/my-ads',
                '/saved-ads',
                '/messages',
                '/my-services',
                '/purchases',
            ],
        },
        sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    };
}
