import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                // Account namespace
                '/account/',
                // Legacy private routes (all have 301 redirects)
                '/profile/',
                '/my-ads',
                '/saved-ads',
                '/messages',
                '/my-services',
                '/purchases',
                '/business/my-business',
                '/business/register',
                '/business/edit',
                // Actions
                '/post-ad',
                '/post-service',
                '/edit-ad/',
                '/ad-submission-success',
                '/notifications',
                // System
                '/api/',
                '/admin/',
            ],
        },
        sitemap: 'https://esparex.com/sitemap.xml',
    };
}
