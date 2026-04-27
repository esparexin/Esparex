"use strict";
/**
 * Ad Image Service
 * Handles image uploads, processing, and storage
 *
 * Extracted from adService.ts for better separation of concerns
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_IMAGE_SIZE = exports.ALLOWED_IMAGE_TYPES = exports.findImageDuplicates = exports.getImageByHash = exports.getAdImages = exports.deleteSpecificImage = exports.deleteAdImages = exports.uploadMultipleImages = exports.uploadSingleImage = exports.isValidImageSize = exports.isValidImageType = exports.computeImageHash = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = require("crypto");
const AdImage_1 = __importDefault(require("@core/models/AdImage"));
const s3_1 = require("@core/utils/s3");
const imageProcessor_1 = require("@core/utils/imageProcessor");
const logger_1 = __importDefault(require("@core/utils/logger"));
const AppError_1 = require("@core/utils/AppError");
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'image/heif'];
exports.ALLOWED_IMAGE_TYPES = ALLOWED_IMAGE_TYPES;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
exports.MAX_IMAGE_SIZE = MAX_IMAGE_SIZE;
// ─────────────────────────────────────────────────
// IMAGE HASHING & VALIDATION
// ─────────────────────────────────────────────────
const computeImageHash = (buffer) => {
    return (0, crypto_1.createHash)('sha256').update(buffer).digest('hex').substring(0, 16);
};
exports.computeImageHash = computeImageHash;
const isValidImageType = (mimeType) => {
    return mimeType ? ALLOWED_IMAGE_TYPES.includes(mimeType) : false;
};
exports.isValidImageType = isValidImageType;
const isValidImageSize = (sizeBytes) => {
    return sizeBytes > 0 && sizeBytes <= MAX_IMAGE_SIZE;
};
exports.isValidImageSize = isValidImageSize;
// ─────────────────────────────────────────────────
// SINGLE IMAGE UPLOAD & PROCESSING
// ─────────────────────────────────────────────────
const uploadSingleImage = async (adId, buffer, mimeType, session) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(adId)) {
        throw new AppError_1.AppError('Invalid ad ID', 400, 'INVALID_AD_ID');
    }
    if (!(0, exports.isValidImageType)(mimeType)) {
        throw new AppError_1.AppError('Invalid image type. Only JPEG, PNG, and WebP are allowed.', 400, 'INVALID_IMAGE_TYPE');
    }
    if (!(0, exports.isValidImageSize)(buffer.length)) {
        throw new AppError_1.AppError(`Image size exceeds maximum allowed size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`, 400, 'IMAGE_TOO_LARGE');
    }
    const id = new mongoose_1.default.Types.ObjectId(adId);
    const imageHash = (0, exports.computeImageHash)(buffer);
    // Explicit Duplicate Check (PRE-S3-UPLOAD)
    const existing = await AdImage_1.default.findOne({ adId: id, imageHash }).lean();
    if (existing) {
        return {
            url: existing.imageUrl,
            thumbnailUrl: existing.thumbnailUrl,
            hash: imageHash,
            size: buffer.length
        };
    }
    try {
        // Process image (resize, optimize, etc.) with hierarchical pathing
        const result = await (0, imageProcessor_1.processSingleImage)(buffer, `ads/${id.toString()}`, mimeType);
        if (!result) {
            throw new AppError_1.AppError('Failed to process image', 500, 'IMAGE_PROCESS_FAILED');
        }
        // Store metadata in AdImage collection for indexing
        const adImageCreate = AdImage_1.default.create([{
                adId: id,
                imageUrl: result.url,
                thumbnailUrl: result.thumbnailUrl,
                imageHash: imageHash,
                createdAt: new Date()
            }], session ? { session } : undefined);
        await adImageCreate;
        return {
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            hash: imageHash,
            size: buffer.length
        };
    }
    catch (error) {
        logger_1.default.error('Failed to upload image', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        throw error;
    }
};
exports.uploadSingleImage = uploadSingleImage;
// ─────────────────────────────────────────────────
// BATCH IMAGE UPLOAD
// ─────────────────────────────────────────────────
const uploadMultipleImages = async (adId, images, session) => {
    if (!images || images.length === 0) {
        return [];
    }
    // Limit to 10 images per ad
    if (images.length > 10) {
        throw new AppError_1.AppError('Maximum 10 images allowed per ad', 422, 'MAX_IMAGES_EXCEEDED');
    }
    const uploadPromises = images.map(img => (0, exports.uploadSingleImage)(adId, img.buffer, img.mimeType, session)
        .catch((err) => {
        logger_1.default.error('Failed to upload individual image', { error: err instanceof Error ? err.message : String(err) });
        return null;
    }));
    const results = await Promise.all(uploadPromises);
    return results.filter((result) => result !== null);
};
exports.uploadMultipleImages = uploadMultipleImages;
// ─────────────────────────────────────────────────
// IMAGE DELETION & CLEANUP
// ─────────────────────────────────────────────────
const deleteAdImages = async (adId, session) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(adId)) {
        return 0;
    }
    const id = new mongoose_1.default.Types.ObjectId(adId);
    try {
        let findQuery = AdImage_1.default.find({ adId: id });
        if (session) {
            findQuery = findQuery.session(session);
        }
        const images = await findQuery;
        // Delete from S3
        for (const img of images) {
            if (img.imageUrl) {
                try {
                    await (0, s3_1.deleteFromS3Url)(img.imageUrl);
                    if (img.thumbnailUrl) {
                        await (0, s3_1.deleteFromS3Url)(img.thumbnailUrl);
                    }
                }
                catch (err) {
                    logger_1.default.error('Failed to delete image from S3', { error: err, url: img.imageUrl });
                }
            }
        }
        // Delete from AdImage collection
        let deleteQuery = AdImage_1.default.deleteMany({ adId: id });
        if (session) {
            deleteQuery = deleteQuery.session(session);
        }
        const result = await deleteQuery;
        return result.deletedCount || 0;
    }
    catch (error) {
        logger_1.default.error('Failed to delete ad images', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return 0;
    }
};
exports.deleteAdImages = deleteAdImages;
const deleteSpecificImage = async (adId, imageHash, session) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(adId)) {
        return false;
    }
    const id = new mongoose_1.default.Types.ObjectId(adId);
    try {
        let findQuery = AdImage_1.default.findOne({ adId: id, imageHash });
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
                await (0, s3_1.deleteFromS3Url)(img.imageUrl);
                if (img.thumbnailUrl) {
                    await (0, s3_1.deleteFromS3Url)(img.thumbnailUrl);
                }
            }
            catch (err) {
                logger_1.default.error('Failed to delete image from S3', { error: err });
            }
        }
        // Delete from collection
        let deleteQuery = AdImage_1.default.deleteOne({ _id: img._id });
        if (session) {
            deleteQuery = deleteQuery.session(session);
        }
        await deleteQuery;
        return true;
    }
    catch (error) {
        logger_1.default.error('Failed to delete specific image', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return false;
    }
};
exports.deleteSpecificImage = deleteSpecificImage;
// ─────────────────────────────────────────────────
// IMAGE RETRIEVAL & LISTING
// ─────────────────────────────────────────────────
const getAdImages = async (adId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(adId)) {
        return [];
    }
    const id = new mongoose_1.default.Types.ObjectId(adId);
    try {
        const images = await AdImage_1.default.find({ adId: id })
            .select('imageUrl thumbnailUrl imageHash')
            .lean();
        return images.map(img => ({
            url: img.imageUrl,
            thumbnailUrl: img.thumbnailUrl,
            hash: img.imageHash
        }));
    }
    catch (error) {
        logger_1.default.error('Failed to get ad images', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return [];
    }
};
exports.getAdImages = getAdImages;
const getImageByHash = async (adId, hash) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(adId)) {
        return null;
    }
    const id = new mongoose_1.default.Types.ObjectId(adId);
    try {
        const img = await AdImage_1.default.findOne({ adId: id, imageHash: hash })
            .select('imageUrl thumbnailUrl imageHash')
            .lean();
        if (!img) {
            return null;
        }
        return {
            url: img.imageUrl,
            thumbnailUrl: img.thumbnailUrl,
            hash: img.imageHash
        };
    }
    catch (error) {
        logger_1.default.error('Failed to get image by hash', {
            error: error instanceof Error ? error.message : String(error),
            adId: String(id)
        });
        return null;
    }
};
exports.getImageByHash = getImageByHash;
// ─────────────────────────────────────────────────
// IMAGE DEDUPLICATION (Find duplicate images across ads)
// ─────────────────────────────────────────────────
const findImageDuplicates = async (imageHashes) => {
    if (!imageHashes || imageHashes.length === 0) {
        return new Map();
    }
    try {
        const duplicates = await AdImage_1.default.aggregate([
            { $match: { imageHash: { $in: imageHashes } } },
            { $group: { _id: '$imageHash', adIds: { $push: '$adId' } } }
        ]);
        const result = new Map();
        duplicates.forEach((item) => {
            result.set(item._id, item.adIds);
        });
        return result;
    }
    catch (error) {
        logger_1.default.error('Failed to find image duplicates', {
            error: error instanceof Error ? error.message : String(error)
        });
        return new Map();
    }
};
exports.findImageDuplicates = findImageDuplicates;
//# sourceMappingURL=AdImageService.js.map