"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImages = exports.processSingleImage = void 0;
const s3_1 = require("./s3");
const crypto_1 = __importDefault(require("crypto"));
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = __importDefault(require("./logger"));
const env_1 = require("@core/config/env");
const image_domain_registry_json_1 = __importDefault(require("@shared/constants/image-domain-registry.json"));
let hasWarnedMissingS3InTest = false;
const MAX_IMAGE_DIMENSION = 1600;
const extensionFromMime = (mimeType) => {
    if (!mimeType || typeof mimeType !== 'string')
        return 'jpg';
    const normalized = mimeType.toLowerCase();
    if (normalized.includes('mp4'))
        return 'mp4';
    if (normalized.includes('pdf'))
        return 'pdf';
    if (normalized.includes('png'))
        return 'png';
    if (normalized.includes('webp'))
        return 'webp';
    if (normalized.includes('gif'))
        return 'gif';
    if (normalized.includes('bmp'))
        return 'bmp';
    return 'jpg';
};
const optimizeWithSharp = async (fileBuffer, mimeType) => {
    try {
        const image = (0, sharp_1.default)(fileBuffer);
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
        const thumbnailBuffer = await (0, sharp_1.default)(fileBuffer)
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
    }
    catch (error) {
        logger_1.default.warn('Sharp optimization skipped; uploading original image buffer.', error);
        return {
            buffer: fileBuffer,
            thumbnailBuffer: fileBuffer,
            mimeType,
            extension: extensionFromMime(mimeType)
        };
    }
};
const warnMissingS3BucketOncePerTestRun = (folder) => {
    const message = `⚠️ S3_BUCKET_NAME missing. Using placeholder images for '${folder}' to prevent DB BSON crash.`;
    if (env_1.env.NODE_ENV === 'test') {
        if (hasWarnedMissingS3InTest) {
            return;
        }
        hasWarnedMissingS3InTest = true;
        logger_1.default.warn(message);
        return;
    }
    logger_1.default.warn(message);
};
/**
 * Robustly processes an image (URL, Base64, or Buffer).
 * - If string is URL, returns it as is.
 * - If string is Base64 or Buffer:
 *    - Optimizes with Sharp (resize + WebP).
 *    - Uploads to S3.
 */
const processSingleImage = async (image, folder, inputMimeType = 'image/jpeg') => {
    // SECURITY: Prevent MongoDB BSON Size Limit (16MB) Crash
    if (!(0, s3_1.getBucketName)()) {
        warnMissingS3BucketOncePerTestRun(folder);
        return {
            url: image_domain_registry_json_1.default.placeholderImageUrl,
            thumbnailUrl: image_domain_registry_json_1.default.placeholderImageUrl,
            hash: `dev-hash`
        };
    }
    try {
        if (!image)
            return { url: "", thumbnailUrl: "", hash: "" };
        let buffer;
        let mimeType = inputMimeType;
        if (Buffer.isBuffer(image)) {
            buffer = image;
        }
        else if (image.startsWith('http')) {
            return { url: image, thumbnailUrl: image, hash: "existing-url" };
        }
        else {
            const match = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (match && match.length === 3) {
                mimeType = match[1] ?? 'image/jpeg';
                buffer = Buffer.from(match[2] ?? '', 'base64');
            }
            else {
                try {
                    buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
                }
                catch (e) {
                    logger_1.default.error("Invalid base64 string", e);
                    return {
                        url: "https://placehold.co/600x400/png?text=Invalid+Image",
                        thumbnailUrl: "https://placehold.co/600x400/png?text=Invalid+Image",
                        hash: "invalid"
                    };
                }
            }
        }
        // Generate content hash BEFORE optimization to ensure raw content uniqueness
        const hash = crypto_1.default.createHash('sha256').update(buffer).digest('hex');
        const optimized = await optimizeWithSharp(buffer, mimeType);
        const finalBuffer = optimized.buffer;
        const finalMimeType = optimized.mimeType;
        const finalExtension = optimized.extension;
        // Ensure folder doesn't have trailing slash before appending
        const basePath = folder.endsWith('/') ? folder.slice(0, -1) : folder;
        const fileName = `${basePath}/${Date.now()}-${crypto_1.default.randomUUID()}.${finalExtension}`;
        const thumbFileName = `${basePath}/thumb-${Date.now()}-${crypto_1.default.randomUUID()}.${finalExtension}`;
        const url = await (0, s3_1.uploadToS3)(finalBuffer, fileName, finalMimeType);
        const thumbnailUrl = await (0, s3_1.uploadToS3)(optimized.thumbnailBuffer, thumbFileName, finalMimeType);
        return { url, thumbnailUrl, hash };
    }
    catch (error) {
        logger_1.default.error("Image Processing Error:", error);
        return {
            url: image_domain_registry_json_1.default.placeholderImageUrl,
            thumbnailUrl: image_domain_registry_json_1.default.placeholderImageUrl,
            hash: "error"
        };
    }
};
exports.processSingleImage = processSingleImage;
/**
 * Process multiple images
 */
const processImages = async (images, folder) => {
    try {
        return await Promise.all(images.map(img => (0, exports.processSingleImage)(img, folder)));
    }
    catch (error) {
        logger_1.default.error("Multiple Image Processing Error:", error);
        return images.map(() => ({
            url: `https://placehold.co/600x400/png?text=Upload+Failed`,
            thumbnailUrl: `https://placehold.co/600x400/png?text=Upload+Failed`,
            hash: "error"
        }));
    }
};
exports.processImages = processImages;
//# sourceMappingURL=imageProcessor.js.map