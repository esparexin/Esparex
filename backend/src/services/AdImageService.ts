/**
 * Ad Image Service
 * Handles image uploads, processing, and storage
 *
 * Extracted from adService.ts for better separation of concerns
 */

import mongoose, { ClientSession } from 'mongoose';
import { createHash } from 'crypto';
import AdImage from '../models/AdImage';
import { deleteFromS3Url } from '../utils/s3';
import { processSingleImage } from '../utils/imageProcessor';
import logger from '../utils/logger';

// ─────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────

export interface ImageUploadResult {
    url: string;
    hash: string;
    key: string;
    size: number;
}

export interface ProcessedImage {
    url: string;
    hash: string;
    size?: number;
    dimensions?: {
        width: number;
        height: number;
    };
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'image/heif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// ─────────────────────────────────────────────────
// IMAGE HASHING & VALIDATION
// ─────────────────────────────────────────────────

export const computeImageHash = (buffer: Buffer): string => {
    return createHash('sha256').update(buffer).digest('hex').substring(0, 16);
};

export const isValidImageType = (mimeType?: string): boolean => {
    return mimeType ? ALLOWED_IMAGE_TYPES.includes(mimeType) : false;
};

export const isValidImageSize = (sizeBytes: number): boolean => {
    return sizeBytes > 0 && sizeBytes <= MAX_IMAGE_SIZE;
};

// ─────────────────────────────────────────────────
// SINGLE IMAGE UPLOAD & PROCESSING
// ─────────────────────────────────────────────────

export const uploadSingleImage = async (
    adId: string | mongoose.Types.ObjectId,
    buffer: Buffer,
    mimeType?: string,
    session?: ClientSession
): Promise<ProcessedImage> => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        throw new Error('Invalid ad ID');
    }

    if (!isValidImageType(mimeType)) {
        const err = new Error('Invalid image type. Only JPEG, PNG, and WebP are allowed.');
        (err as any).statusCode = 400;
        throw err;
    }

    if (!isValidImageSize(buffer.length)) {
        const err = new Error(`Image size exceeds maximum allowed size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
        (err as any).statusCode = 400;
        throw err;
    }

    const id = new mongoose.Types.ObjectId(adId);
    const imageHash = computeImageHash(buffer);

    // Explicit Duplicate Check (PRE-S3-UPLOAD)
    const existing = await AdImage.findOne({ adId: id, imageHash }).lean();
    if (existing) {
        return {
            url: existing.imageUrl,
            hash: imageHash,
            size: buffer.length
        };
    }

    try {
        // Process image (resize, optimize, etc.) with hierarchical pathing
        const result = await processSingleImage(buffer, `ads/${id.toString()}`, mimeType);

        if (!result) {
            throw new Error('Failed to process image');
        }

        // Store metadata in AdImage collection for indexing
        const adImageCreate = AdImage.create(
            [{
                adId: id,
                imageUrl: result.url,
                imageHash: imageHash,
                createdAt: new Date()
            }],
            session ? { session } : undefined
        );

        await adImageCreate;

        return {
            url: result.url,
            hash: imageHash,
            size: buffer.length
        };
    } catch (error) {
        logger.error('Failed to upload image', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        throw error;
    }
};

// ─────────────────────────────────────────────────
// BATCH IMAGE UPLOAD
// ─────────────────────────────────────────────────

export const uploadMultipleImages = async (
    adId: string | mongoose.Types.ObjectId,
    images: {
        buffer: Buffer;
        mimeType?: string;
    }[],
    session?: ClientSession
): Promise<ProcessedImage[]> => {
    if (!images || images.length === 0) {
        return [];
    }

    // Limit to 10 images per ad
    if (images.length > 10) {
        throw new Error('Maximum 10 images allowed per ad');
    }

    const uploadPromises = images.map(img =>
        uploadSingleImage(adId, img.buffer, img.mimeType, session)
            .catch(err => {
                logger.error('Failed to upload individual image', { error: err });
                return null;
            })
    );

    const results = await Promise.all(uploadPromises);
    return results.filter((result): result is ProcessedImage => result !== null);
};

// ─────────────────────────────────────────────────
// IMAGE DELETION & CLEANUP
// ─────────────────────────────────────────────────

export const deleteAdImages = async (
    adId: string | mongoose.Types.ObjectId,
    session?: ClientSession
): Promise<number> => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        return 0;
    }

    const id = new mongoose.Types.ObjectId(adId);

    try {
        let findQuery = AdImage.find({ adId: id });
        if (session) {
            findQuery = findQuery.session(session);
        }

        const images = await findQuery;

        // Delete from S3
        for (const img of images) {
            if (img.imageUrl) {
                try {
                    await deleteFromS3Url(img.imageUrl);
                } catch (err) {
                    logger.error('Failed to delete image from S3', { error: err, url: img.imageUrl });
                }
            }
        }

        // Delete from AdImage collection
        let deleteQuery = AdImage.deleteMany({ adId: id });
        if (session) {
            deleteQuery = deleteQuery.session(session);
        }

        const result = await deleteQuery;
        return result.deletedCount || 0;
    } catch (error) {
        logger.error('Failed to delete ad images', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return 0;
    }
};

export const deleteSpecificImage = async (
    adId: string | mongoose.Types.ObjectId,
    imageHash: string,
    session?: ClientSession
): Promise<boolean> => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        return false;
    }

    const id = new mongoose.Types.ObjectId(adId);

    try {
        let findQuery = AdImage.findOne({ adId: id, imageHash });
        if (session) {
            findQuery = findQuery.session(session);
        }

        const img = await findQuery;

        if (!img) {
            return false;
        }

        // Delete from S3
        if (img.imageUrl) {
            try {
                await deleteFromS3Url(img.imageUrl);
            } catch (err) {
                logger.error('Failed to delete image from S3', { error: err });
            }
        }

        // Delete from collection
        let deleteQuery = AdImage.deleteOne({ _id: img._id });
        if (session) {
            deleteQuery = deleteQuery.session(session);
        }

        await deleteQuery;
        return true;
    } catch (error) {
        logger.error('Failed to delete specific image', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return false;
    }
};

// ─────────────────────────────────────────────────
// IMAGE RETRIEVAL & LISTING
// ─────────────────────────────────────────────────

export const getAdImages = async (
    adId: string | mongoose.Types.ObjectId
): Promise<ProcessedImage[]> => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        return [];
    }

    const id = new mongoose.Types.ObjectId(adId);

    try {
        const images = await AdImage.find({ adId: id })
            .select('imageUrl imageHash')
            .lean();

        return images.map(img => ({
            url: img.imageUrl,
            hash: img.imageHash
        }));
    } catch (error) {
        logger.error('Failed to get ad images', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return [];
    }
};

export const getImageByHash = async (
    adId: string | mongoose.Types.ObjectId,
    hash: string
): Promise<ProcessedImage | null> => {
    if (!mongoose.Types.ObjectId.isValid(adId)) {
        return null;
    }

    const id = new mongoose.Types.ObjectId(adId);

    try {
        const img = await AdImage.findOne({ adId: id, imageHash: hash })
            .select('imageUrl imageHash')
            .lean();

        if (!img) {
            return null;
        }

        return {
            url: img.imageUrl,
            hash: img.imageHash
        };
    } catch (error) {
        logger.error('Failed to get image by hash', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return null;
    }
};

// ─────────────────────────────────────────────────
// IMAGE DEDUPLICATION (Find duplicate images across ads)
// ─────────────────────────────────────────────────

export const findImageDuplicates = async (
    imageHashes: string[]
): Promise<Map<string, mongoose.Types.ObjectId[]>> => {
    if (!imageHashes || imageHashes.length === 0) {
        return new Map();
    }

    try {
        const duplicates = await AdImage.aggregate([
            { $match: { imageHash: { $in: imageHashes } } },
            { $group: { _id: '$imageHash', adIds: { $push: '$adId' } } }
        ]);

        const result = new Map<string, mongoose.Types.ObjectId[]>();
        duplicates.forEach((item: Record<string, unknown>) => {
            result.set(item._id as string, item.adIds as mongoose.Types.ObjectId[]);
        });

        return result;
    } catch (error) {
        logger.error('Failed to find image duplicates', {
            error: error instanceof Error ? error.message : String(error)
        });
        return new Map();
    }
};

// ─────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────

export {
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE
};
