import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageDomainRegistryPath = path.resolve(__dirname, '../shared/constants/image-domain-registry.json');
const imageDomainRegistry = JSON.parse(fs.readFileSync(imageDomainRegistryPath, 'utf8'));
const staticRemotePatterns = Array.isArray(imageDomainRegistry.nextRemotePatterns)
    ? imageDomainRegistry.nextRemotePatterns
    : [];
const s3Region =
    process.env.AWS_REGION ||
    'ap-south-1';
const s3BucketName = process.env.S3_BUCKET_NAME;
const dynamicS3BucketPattern = s3BucketName
    ? [
        {
            protocol: 'https',
            hostname: `${s3BucketName}.s3.${s3Region}.amazonaws.com`,
            port: '',
            pathname: '/**',
        },
    ]
    : [];
const dynamicApiRemotePattern = (() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    try {
        const parsed = new URL(apiUrl);
        return [
            {
                protocol: parsed.protocol.replace(':', ''),
                hostname: parsed.hostname,
                port: parsed.port || '',
                pathname: '/**',
            },
        ];
    } catch {
        return [];
    }
})();

const dynamicApiConnectSources = (() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    try {
        const parsed = new URL(apiUrl);
        const httpOrigin = `${parsed.protocol}//${parsed.host}`;
        const wsProtocol = parsed.protocol === 'https:' ? 'wss' : parsed.protocol === 'http:' ? 'ws' : null;
        const socketOrigin = wsProtocol ? `${wsProtocol}://${parsed.host}` : null;
        return [httpOrigin, socketOrigin].filter(Boolean);
    } catch {
        return [];
    }
})();

const connectSrc = [
    "'self'",
    'http://localhost:*',
    'http://127.0.0.1:*',
    'ws://localhost:*',
    'ws://127.0.0.1:*',
    'https://maps.googleapis.com',
    'https://maps.gstatic.com',
    'https://nominatim.openstreetmap.org',
    'https://control.msg91.com',
    'https://images.unsplash.com',
    'https://ipapi.co',
    'https://ipinfo.io',
    'https://*.s3.ap-south-1.amazonaws.com',
    'https://s3.ap-south-1.amazonaws.com',
    'https://esparexdev.s3.ap-south-1.amazonaws.com', // Explicitly add known bucket
    ...dynamicApiConnectSources,
].join(' '); // Forced update for CSP

const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : []),
    'https://maps.googleapis.com',
    'https://maps.gstatic.com',
].join(' ');

/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compress: true,
    poweredByHeader: false,
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            'framer-motion',
        ],
    },
    images: {
        remotePatterns: [
            ...dynamicS3BucketPattern,
            ...dynamicApiRemotePattern,
            ...staticRemotePatterns,
        ],
        dangerouslyAllowSVG: true,
        contentDispositionType: 'attachment',
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },

    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },

                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            `script-src ${scriptSrc}`,
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "img-src 'self' data: blob: https: http://localhost:* https://maps.googleapis.com https://maps.gstatic.com https://images.unsplash.com",
                            "font-src 'self' data: https://fonts.gstatic.com",
                            "worker-src 'self' blob:",

                            `connect-src ${connectSrc}`,

                            "frame-ancestors 'self'",
                            "base-uri 'self'",
                            "form-action 'self'"
                        ].join('; ')
                    }
                ]
            }
        ];
    },

    async redirects() {
        return [
            // ── Legacy /account route migrations ─────────────────────────────
            // Tab-specific redirects must come BEFORE the plain catch-all
            {
                source: '/profile',
                destination: '/account/profile',
                permanent: true,
            },
            {
                source: '/profile/settings',
                has: [{ type: 'query', key: 'tab', value: 'plans' }],
                destination: '/account/plans',
                permanent: true,
            },
            {
                source: '/profile/settings',
                has: [{ type: 'query', key: 'tab', value: 'smartalerts' }],
                destination: '/account/alerts',
                permanent: true,
            },
            {
                source: '/profile/settings',
                has: [{ type: 'query', key: 'tab', value: 'business' }],
                destination: '/account/business',
                permanent: true,
            },
            {
                source: '/profile/settings',
                has: [{ type: 'query', key: 'tab', value: 'purchases' }],
                destination: '/account/plans',
                permanent: true,
            },
            {
                source: '/profile/settings',
                has: [{ type: 'query', key: 'tab', value: 'settings' }],
                destination: '/account/settings',
                permanent: true,
            },
            {
                source: '/profile/settings',
                destination: '/account/settings',
                permanent: true,
            },
            {
                source: '/purchases',
                destination: '/account/plans',
                permanent: true,
            },
            {
                source: '/business/my-business',
                destination: '/account/business',
                permanent: true,
            },
            {
                source: '/business/register',
                destination: '/account/business/apply',
                permanent: true,
            },
            {
                source: '/my-ads',
                destination: '/account/ads',
                permanent: true,
            },
            {
                source: '/saved-ads',
                destination: '/account/saved',
                permanent: true,
            },
            {
                source: '/messages',
                destination: '/chat',
                permanent: true,
            },
            {
                source: '/my-services',
                destination: '/account/business',
                permanent: true,
            },
            // Exact /business match only — /business/[slug] continues to work
            {
                source: '/business',
                destination: '/account/business',
                permanent: true,
            },
            // ── Pre-existing redirects ────────────────────────────────────────
            {
                source: '/ad/:id',
                destination: '/ads/:id',
                permanent: true,
            },
            {
                source: '/browse',
                destination: '/search',
                permanent: true,
            },
            {
                source: '/map-search',
                destination: '/search',
                permanent: true,
            },
            {
                source: '/contact-us',
                destination: '/contact',
                permanent: true,
            },
            {
                source: '/help-center',
                destination: '/faq',
                permanent: true,
            },
            {
                source: '/sitemap',
                destination: '/site-map',
                permanent: true,
            },
        ];
    }
};

export default nextConfig;
