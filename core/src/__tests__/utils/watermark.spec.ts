import sharp from 'sharp';
import { applyListingWatermark, buildWatermarkSvg } from '../../utils/watermark';

describe('applyListingWatermark SSOT', () => {
    // Generate a simple test image buffer using Sharp
    const createTestImage = async (width: number, height: number, color = { r: 50, g: 100, b: 150 }): Promise<Buffer> => {
        return await sharp({
            create: {
                width,
                height,
                channels: 3,
                background: color,
            },
        })
            .webp()
            .toBuffer();
    };

    it('builds a valid SVG watermark badge with calculated dimensions', () => {
        const svgBuffer = buildWatermarkSvg(180, 50, 0.4);
        const svgText = svgBuffer.toString('utf-8');

        expect(svgText).toContain('<svg');
        expect(svgText).toContain('width="180"');
        expect(svgText).toContain('height="50"');
        expect(svgText).toContain('ESPAREX');
        expect(svgText).toContain('opacity="0.40"');
    });

    it('applies watermark to a landscape image without modifying dimensions', async () => {
        const input = await createTestImage(1200, 800);
        const output = await applyListingWatermark(input);

        expect(output).toBeDefined();
        expect(output.length).toBeGreaterThan(0);

        const metadata = await sharp(output).metadata();
        expect(metadata.width).toBe(1200);
        expect(metadata.height).toBe(800);
        expect(metadata.format).toBe('webp');
    });

    it('applies watermark to a portrait image without modifying dimensions', async () => {
        const input = await createTestImage(800, 1200);
        const output = await applyListingWatermark(input);

        const metadata = await sharp(output).metadata();
        expect(metadata.width).toBe(800);
        expect(metadata.height).toBe(1200);
    });

    it('applies watermark to a square image without modifying dimensions', async () => {
        const input = await createTestImage(1000, 1000);
        const output = await applyListingWatermark(input);

        const metadata = await sharp(output).metadata();
        expect(metadata.width).toBe(1000);
        expect(metadata.height).toBe(1000);
    });

    it('bypasses watermarking and returns original buffer for tiny images (<100px)', async () => {
        const input = await createTestImage(64, 64);
        const output = await applyListingWatermark(input);

        expect(output).toEqual(input);
    });

    it('gracefully returns input buffer for empty or invalid buffer without throwing', async () => {
        const empty = Buffer.from([]);
        const emptyOutput = await applyListingWatermark(empty);
        expect(emptyOutput).toBe(empty);

        const invalid = Buffer.from('not-an-image-data-string');
        const invalidOutput = await applyListingWatermark(invalid);
        expect(invalidOutput).toEqual(invalid);
    });

    it('allows customizing width ratio, opacity, and quality options', async () => {
        const input = await createTestImage(1080, 1080);
        const output = await applyListingWatermark(input, {
            widthRatio: 0.25,
            opacity: 0.5,
            quality: 85,
        });

        const metadata = await sharp(output).metadata();
        expect(metadata.width).toBe(1080);
        expect(metadata.height).toBe(1080);
        expect(metadata.format).toBe('webp');
    });
});
