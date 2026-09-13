import withBundleAnalyzer from '@next/bundle-analyzer';

const analyze = process.env.ANALYZE === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/moderation',
        destination: '/ads?status=pending',
        permanent: true,
      },
      {
        source: '/moderation/ads',
        destination: '/ads?status=pending',
        permanent: true,
      },
      {
        source: '/moderation/services',
        destination: '/services?status=pending',
        permanent: true,
      },
      {
        source: '/moderation/parts',
        destination: '/spare-parts?status=pending',
        permanent: true,
      },
      {
        source: '/moderation/messages',
        destination: '/chat',
        permanent: true,
      },
      {
        source: '/messages',
        destination: '/chat',
        permanent: true,
      },
      {
        source: '/business-requests',
        destination: '/businesses?status=pending',
        permanent: true,
      },
      {
        source: '/locations/geofences',
        destination: '/locations',
        permanent: true,
      },
      {
        source: '/screen-sizes',
        destination: '/categories?tab=screen-sizes',
        permanent: true,
      },
      {
        source: '/service-types',
        destination: '/categories?tab=service-types',
        permanent: true,
      },
      {
        source: '/brands',
        destination: '/categories?tab=brands',
        permanent: true,
      },
      {
        source: '/models',
        destination: '/categories?tab=models',
        permanent: true,
      },
      {
        source: '/catalog-requests',
        destination: '/categories?tab=catalog-requests',
        permanent: true,
      },
      {
        source: '/spare-parts-catalog',
        destination: '/categories?tab=spare-parts',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
        ],
      },
    ];
  },
};

export default analyze ? withBundleAnalyzer()(nextConfig) : nextConfig;
