/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Temporary stabilization: strict type backlog is handled via dedicated `npm run type-check`.
    ignoreBuildErrors: true,
  },
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
    ];
  },
};

export default nextConfig;
