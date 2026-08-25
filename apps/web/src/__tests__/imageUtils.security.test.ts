import { describe, it, expect } from 'vitest';
import { isRenderableImageUrl, toSafeImageSrc } from '../lib/image/imageUrl';
import { isRenderableImageUrl as isSharedRenderableImageUrl } from '@esparex/shared';

describe('S3 Image URL Host Validation Security (CODE-02)', () => {
    describe('Web imageUrl.ts', () => {
        it('accepts valid S3 amazonaws URLs', () => {
            const validS3 = 'https://esparex-bucket.s3.ap-south-1.amazonaws.com/uploads/image.jpg';
            expect(isRenderableImageUrl(validS3)).toBe(true);
        });

        it('rejects spoofed amazonaws domains (substring match vulnerability bypass)', () => {
            const spoofedDomains = [
                'https://attacker-amazonaws.com/image.jpg',
                'https://fakeamazonaws.com/evil.png',
                'https://amazonaws.com.attacker.com/malicious.webp',
                'https://evil-site.com/sub/amazonaws.com/payload.jpg',
            ];

            spoofedDomains.forEach((url) => {
                expect(isRenderableImageUrl(url)).toBe(false);
            });
        });

        it('falls back to default placeholder on spoofed domain URLs', () => {
            const result = toSafeImageSrc('https://attacker-amazonaws.com/exploit.jpg');
            expect(result).not.toContain('attacker-amazonaws.com');
        });
    });

    describe('Shared imageUtils.ts', () => {
        it('accepts valid S3 amazonaws URLs in shared util', () => {
            const validS3 = 'https://esparex-bucket.s3.ap-south-1.amazonaws.com/uploads/image.jpg';
            expect(isSharedRenderableImageUrl(validS3)).toBe(true);
        });

        it('rejects spoofed domains in shared util', () => {
            expect(isSharedRenderableImageUrl('https://attacker-amazonaws.com/image.jpg')).toBe(false);
            expect(isSharedRenderableImageUrl('https://fake-s3.amazonaws.com.attacker.com/image.jpg')).toBe(false);
        });
    });
});
