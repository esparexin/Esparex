import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                // Account namespace & Messaging
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
            ],
        },
        sitemap: 'https://esparex.in/sitemap.xml',
    };
}
