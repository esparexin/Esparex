import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config.mjs';

describe('Image Optimization Configuration', () => {
    it('configures Next.js to serve modern AVIF and WebP image formats', () => {
        const imageFormats = nextConfig.images?.formats;
        expect(imageFormats).toBeDefined();
        expect(imageFormats).toContain('image/avif');
        expect(imageFormats).toContain('image/webp');
    });

    it('retains remote security patterns and SVG protections', () => {
        expect(nextConfig.images?.dangerouslyAllowSVG).toBe(true);
        expect(nextConfig.images?.remotePatterns).toBeDefined();
    });
});
