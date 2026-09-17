import { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN } from '@/lib/seo/canonicalHost';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            // 1. Defend against non-revenue scrapers and aggressive bots
            {
                userAgent: [
                    'Amazonbot',
                    'Amzn-SearchBot',
                    'BomboraBot',
                    'trendictionbot',
                    'Yandex',
                    'YandexBot',
                    'DotBot',
                    'CCBot',
                    'PetalBot',
                    'Baiduspider',
                    'Sogou',
                    'BLEXBot',
                    'CriteoBot',
                    'Bytespider',
                    'IbouBot',
                ],
                disallow: '/',
            },
            // 2. Explicitly allow Google AdSense and AdWords monetization crawlers
            {
                userAgent: [
                    'Mediapartners-Google*',
                    'Adsbot-Google',
                    'Googlebot-Image',
                ],
                allow: '/',
            },
            // 3. Default search engines crawl policies
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    // Account namespace & Messaging
                    '/account',
                    '/account/',
                    '/chat',
                    '/chat/',
                    // Actions & Posting
                    '/post-ad',
                    '/post-service',
                    '/post-spare-part-listing',
                    '/edit-ad/',
                    '/edit-service/',
                    '/edit-spare-part/',
                    '/business/edit',
                    '/notifications',
                    // Legacy private routes
                    '/profile',
                    '/profile/',
                    '/my-ads',
                    '/saved-ads',
                    '/messages',
                    '/my-services',
                    '/purchases',
                    '/plans',
                    '/business/my-business',
                    '/business/register',
                    // System & Internal
                    '/api/',
                    '/admin/',
                    '/internal/',
                    '/offline',
                    '/unauthorized',
                    // Crawl parameter & facet traps (mirroring classifieds production standards)
                    '/*?*expired=*',
                    '/*?*sort=*',
                    '/*?*minPrice=*',
                    '/*?*maxPrice=*',
                    '/*?*Account=*',
                ],
            },
        ],
        sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    };
}
