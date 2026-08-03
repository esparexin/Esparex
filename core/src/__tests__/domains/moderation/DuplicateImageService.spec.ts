import { DuplicateImageService, ImageFingerprint } from '../../../domains/moderation/classifiers/DuplicateImageService';
import sharp from 'sharp';

describe('DuplicateImageService (PR 3 — Perceptual Hashing)', () => {
    let service: DuplicateImageService;

    beforeEach(() => {
        service = new DuplicateImageService();
    });

    it('computes a 16-character hexadecimal 64-bit dhash for a valid image buffer', async () => {
        const imageBuffer = await sharp({
            create: {
                width: 100,
                height: 100,
                channels: 3,
                background: { r: 255, g: 0, b: 0 },
            },
        })
            .png()
            .toBuffer();

        const fp = await service.computeFingerprint(imageBuffer);

        expect(fp).toBeDefined();
        expect(fp.hash).toHaveLength(16);
        expect(fp.createdAt).toBeGreaterThan(0);
    });

    it('calculates 0 Hamming distance for identical hash strings', () => {
        const hash = 'a1b2c3d4e5f60718';
        expect(service.hammingDistance(hash, hash)).toBe(0);
    });

    it('calculates accurate Hamming distance for differing bit patterns', () => {
        // '0' = 0000, '1' = 0001 (1 bit diff)
        expect(service.hammingDistance('0000000000000000', '0000000000000001')).toBe(1);
        // 'f' = 1111, '0' = 0000 (4 bits diff)
        expect(service.hammingDistance('ffffffffffffffff', '0000000000000000')).toBe(64);
    });

    it('detects duplicate images when Hamming distance is within threshold', () => {
        const fp1: ImageFingerprint = { hash: '1234567890abcdef', createdAt: Date.now() };
        const fp2: ImageFingerprint = { hash: '1234567890abcdee', createdAt: Date.now() }; // 1 bit diff

        expect(service.isDuplicate(fp1, fp2, 5)).toBe(true);
    });

    it('rejects non-duplicate images when Hamming distance exceeds threshold', () => {
        const fp1: ImageFingerprint = { hash: '0000000000000000', createdAt: Date.now() };
        const fp2: ImageFingerprint = { hash: 'ffffffffffffffff', createdAt: Date.now() };

        expect(service.isDuplicate(fp1, fp2, 5)).toBe(false);
    });

    it('handles corrupted or invalid image buffers gracefully with fallback hash', async () => {
        const invalidBuffer = Buffer.from('invalid-non-image-data');
        const fp = await service.computeFingerprint(invalidBuffer);

        expect(fp.hash).toBe('0000000000000000');
    });
});
