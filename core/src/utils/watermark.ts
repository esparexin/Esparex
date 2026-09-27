import sharp from 'sharp';
import logger from './logger';

export interface WatermarkOptions {
    /** Target width percentage relative to base image (0.10 - 0.30). Defaults to 0.18 */
    widthRatio?: number;
    /** Opacity of the watermark overlay (0.1 - 1.0). Defaults to 0.38 */
    opacity?: number;
    /** Output image quality for webp encoding (1-100). Defaults to 80 */
    quality?: number;
}

/**
 * Builds a vector SVG badge for the official Esparex watermark.
 * Includes subtle drop-shadow and rounded pill background for contrast on both light and dark imagery.
 */
export function buildWatermarkSvg(
    watermarkWidth: number,
    watermarkHeight: number,
    opacity = 0.38
): Buffer {
    const fontSize = Math.max(9, Math.round(watermarkHeight * 0.44));
    const iconRadius = Math.max(4, Math.round(watermarkHeight * 0.22));
    const centerY = Math.round(watermarkHeight / 2);
    const iconCx = Math.round(watermarkHeight * 0.48);
    const textX = Math.round(iconCx + iconRadius + watermarkHeight * 0.22);
    const textY = Math.round(centerY + fontSize * 0.35);

    const svg = `<svg width="${watermarkWidth}" height="${watermarkHeight}" viewBox="0 0 ${watermarkWidth} ${watermarkHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="esparex-wm-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>
  <g opacity="${opacity.toFixed(2)}" filter="url(#esparex-wm-shadow)">
    <rect x="1" y="1" width="${watermarkWidth - 2}" height="${watermarkHeight - 2}" rx="${Math.round(watermarkHeight / 2)}" fill="#0A0A0A" fill-opacity="0.45" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="1"/>
    <circle cx="${iconCx}" cy="${centerY}" r="${iconRadius}" fill="#F97316"/>
    <text x="${textX}" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="${fontSize}" fill="#FFFFFF" letter-spacing="1.2">ESPAREX</text>
  </g>
</svg>`;

    return Buffer.from(svg);
}

/**
 * Applies the canonical Esparex watermark to a listing image buffer.
 *
 * Rules:
 * - Only applies to valid image buffers.
 * - Proportional scaling (15-20% of base width).
 * - Anchored to the bottom-right corner with responsive margins.
 * - Graceful degradation: If any processing error occurs, returns the original buffer untouched.
 */
export async function applyListingWatermark(
    imageBuffer: Buffer,
    options: WatermarkOptions = {}
): Promise<Buffer> {
    if (!imageBuffer || imageBuffer.length === 0) {
        return imageBuffer;
    }

    try {
        const image = sharp(imageBuffer, { failOn: 'none' });
        const metadata = await image.metadata();

        const width = metadata.width;
        const height = metadata.height;

        if (!width || !height || width < 100 || height < 100) {
            // Image too small for watermarking; return original
            return imageBuffer;
        }

        const widthRatio = options.widthRatio ?? 0.18;
        const opacity = options.opacity ?? 0.38;
        const quality = options.quality ?? 80;

        // Calculate responsive dimensions
        const rawWatermarkWidth = Math.round(width * widthRatio);
        const watermarkWidth = Math.max(90, Math.min(320, rawWatermarkWidth));
        const aspectRatio = 3.6;
        const watermarkHeight = Math.max(24, Math.round(watermarkWidth / aspectRatio));

        const marginX = Math.max(8, Math.round(width * 0.02));
        const marginY = Math.max(8, Math.round(height * 0.02));

        const left = Math.max(0, width - watermarkWidth - marginX);
        const top = Math.max(0, height - watermarkHeight - marginY);

        const watermarkSvgBuffer = buildWatermarkSvg(watermarkWidth, watermarkHeight, opacity);

        const watermarkedBuffer = await image
            .composite([
                {
                    input: watermarkSvgBuffer,
                    top,
                    left,
                },
            ])
            .webp({ quality, effort: 4 })
            .toBuffer();

        return watermarkedBuffer;
    } catch (error) {
        logger.warn('[Watermark] Failed to apply listing watermark; returning original buffer.', {
            error: error instanceof Error ? error.message : String(error),
        });
        return imageBuffer;
    }
}
