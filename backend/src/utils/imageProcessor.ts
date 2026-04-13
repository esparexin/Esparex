import { getBucketName, uploadToS3 } from './s3';
import crypto from 'crypto';
import sharp from 'sharp';
import logger from './logger';
import { env } from '../config/env';
import imageDomainRegistry from '@shared/constants/image-domain-registry.json';

let hasWarnedMissingS3InTest = false;
const MAX_IMAGE_DIMENSION = 1600;

const extensionFromMime = (mimeType: string): string => {
    if (!mimeType || typeof mimeType !== 'string') return 'jpg';
    const normalized = mimeType.toLowerCase();
    if (normalized.includes('mp4')) return 'mp4';
    if (normalized.includes('pdf')) return 'pdf';
    if (normalized.includes('png')) return 'png';
    if (normalized.includes('webp')) return 'webp';
    if (normalized.includes('gif')) return 'gif';
    if (normalized.includes('bmp')) return 'bmp';
    return 'jpg';
};

const optimizeWithSharp = async (
    fileBuffer: Buffer,
    mimeType: string
): Promise<{ buffer: Buffer; thumbnailBuffer: Buffer; mimeType: string; extension: string }> => {
    try {
        const image = sharp(fileBuffer);
        const metadata = await image.metadata();

        let pipeline = image;
        if ((metadata.width || 0) > MAX_IMAGE_DIMENSION || (metadata.height || 0) > MAX_IMAGE_DIMENSION) {
            pipeline = pipeline.resize({
                width: MAX_IMAGE_DIMENSION,
                height: MAX_IMAGE_DIMENSION,
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        const optimizedBuffer = await pipeline
            .webp({ quality: 80, effort: 4 })
            .toBuffer();

        const thumbnailBuffer = await sharp(fileBuffer)
            .resize({
                width: 300,
                height: 300,
                fit: 'cover'
            })
            .webp({ quality: 60, effort: 4 })
            .toBuffer();

        return {
            buffer: optimizedBuffer,
            thumbnailBuffer: thumbnailBuffer,
            mimeType: 'image/webp',
            extension: 'webp'
        };
    } catch (error) {
        logger.warn('Sharp optimization skipped; uploading original image buffer.', error);
        return {
            buffer: fileBuffer,
            thumbnailBuffer: fileBuffer,
            mimeType,
            extension: extensionFromMime(mimeType)
        };
    }
};

const warnMissingS3BucketOncePerTestRun = (folder: string) => {
    const message = `⚠️ S3_BUCKET_NAME missing. Using placeholder images for '${folder}' to prevent DB BSON crash.`;

    if (env.NODE_ENV === 'test') {
        if (hasWarnedMissingS3InTest) {
            return;
        }
        hasWarnedMissingS3InTest = true;
        logger.warn(message);
        return;
    }

    logger.warn(message);
};

/**
 * Robustly processes an image (URL, Base64, or Buffer).
 * - If string is URL, returns it as is.
 * - If string is Base64 or Buffer:
 *    - Optimizes with Sharp (resize + WebP).
 *    - Uploads to S3.
 */
export const processSingleImage = async (
    image: string | Buffer,
    folder: string,
    inputMimeType: string = 'image/jpeg'
): Promise<{ url: string; thumbnailUrl: string; hash: string }> => {
    // SECURITY: Prevent MongoDB BSON Size Limit (16MB) Crash
    if (!getBucketName()) {
        warnMissingS3BucketOncePerTestRun(folder);
        return {
            url: imageDomainRegistry.placeholderImageUrl,
            thumbnailUrl: imageDomainRegistry.placeholderImageUrl,
            hash: `dev-hash`
        };
    }

    try {
        if (!image) return { url: "", thumbnailUrl: "", hash: "" };

        let buffer: Buffer;
        let mimeType = inputMimeType;
        let extension = 'jpg';

        if (Buffer.isBuffer(image)) {
            buffer = image;
            extension = extensionFromMime(mimeType);
        } else if (image.startsWith('http')) {
            return { url: image, thumbnailUrl: image, hash: "existing-url" };
        } else {
            const match = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (match && match.length === 3) {
                mimeType = match[1] ?? 'image/jpeg';
                buffer = Buffer.from(match[2] ?? '', 'base64');
                extension = mimeType.split('/')[1] || 'jpg';
            } else {
                try {
                    buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
                } catch (e) {
                    logger.error("Invalid base64 string", e);
                    return { 
                        url: "https://placehold.co/600x400/png?text=Invalid+Image", 
                        thumbnailUrl: "https://placehold.co/600x400/png?text=Invalid+Image", 
                        hash: "invalid" 
                    };
                }
            }
        }

        // Generate content hash BEFORE optimization to ensure raw content uniqueness
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');

        const optimized = await optimizeWithSharp(buffer, mimeType);
        const finalBuffer = optimized.buffer;
        const finalMimeType = optimized.mimeType;
        const finalExtension = optimized.extension;

        // Ensure folder doesn't have trailing slash before appending
        const basePath = folder.endsWith('/') ? folder.slice(0, -1) : folder;
        const fileName = `${basePath}/${Date.now()}-${crypto.randomUUID()}.${finalExtension}`;
        const thumbFileName = `${basePath}/thumb-${Date.now()}-${crypto.randomUUID()}.${finalExtension}`;

        const url = await uploadToS3(finalBuffer, fileName, finalMimeType);
        const thumbnailUrl = await uploadToS3(optimized.thumbnailBuffer, thumbFileName, finalMimeType);

        return { url, thumbnailUrl, hash };
    } catch (error) {
        logger.error("Image Processing Error:", error);
        return {
            url: imageDomainRegistry.placeholderImageUrl,
            thumbnailUrl: imageDomainRegistry.placeholderImageUrl,
            hash: "error"
        };
    }
};

/**
 * Process multiple images
 */
export const processImages = async (
    images: (string | Buffer)[],
    folder: string
): Promise<{ url: string; thumbnailUrl: string; hash: string }[]> => {
    try {
        return await Promise.all(images.map(img => processSingleImage(img, folder)));
    } catch (error) {
        logger.error("Multiple Image Processing Error:", error);
        return images.map(() => ({
            url: `https://placehold.co/600x400/png?text=Upload+Failed`,
            thumbnailUrl: `https://placehold.co/600x400/png?text=Upload+Failed`,
            hash: "error"
        }));
    }
};
