/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/moderation/ads',
        destination: '/ads',
        permanent: true,
      },
      {
        source: '/moderation/services',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/moderation/parts',
        destination: '/spare-parts',
        permanent: true,
      },
      {
        source: '/moderation/messages',
        destination: '/messages',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
