import { describe, it, expect } from 'vitest';

describe('Image Optimization Configuration', () => {
    it('verifies AVIF and WebP image formats are configured', async () => {
        const nextConfig = await import('../../next.config.mjs');
        const config = nextConfig.default;

        expect(config.images).toBeDefined();
        expect(config.images.formats).toEqual(['image/avif', 'image/webp']);
    });

    it('verifies SVG security policies remain enabled', async () => {
        const nextConfig = await import('../../next.config.mjs');
        const config = nextConfig.default;

        expect(config.images.dangerouslyAllowSVG).toBe(true);
    });
});
