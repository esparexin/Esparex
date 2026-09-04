import type { MetadataRoute } from 'next';

/**
 * Admin portal robots configuration.
 * Completely disallows indexing and crawling of all admin surfaces.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
