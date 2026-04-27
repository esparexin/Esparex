"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageOptimizationWorker = void 0;
const bullmq_1 = require("bullmq");
const sharp_1 = __importDefault(require("sharp"));
const client_s3_1 = require("@aws-sdk/client-s3");
const redisConnection_1 = require("../queues/redisConnection");
const s3_1 = require("@core/utils/s3");
const Ad_1 = __importDefault(require("@core/models/Ad"));
const logger_1 = __importDefault(require("@core/utils/logger"));
// Use a strict concurrency of 2 to avoid memory overloads when processing 10MB raw JPEGs natively.
exports.imageOptimizationWorker = new bullmq_1.Worker("image-optimization-events", async (job) => {
    const { entityId, entityType, imageUrls } = job.data;
    logger_1.default.info(`[ImageWorker] Starting optimization for ${entityType} ${entityId} (${imageUrls.length} images)`);
    const activeBucket = (0, s3_1.getBucketName)();
    if (!activeBucket) {
        throw new Error("S3_BUCKET_NAME missing. Cannot optimize images.");
    }
    const replacementMap = new Map();
    for (const rawUrl of imageUrls) {
        const rawKey = (0, s3_1.extractS3KeyFromUrl)(rawUrl);
        if (!rawKey)
            continue;
        try {
            // 1. Download raw stream from S3
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: activeBucket,
                Key: rawKey
            });
            const response = await s3_1.s3Client.send(getCommand);
            const stream = response.Body;
            if (!stream) {
                logger_1.default.warn(`[ImageWorker] Read stream failed for ${rawKey}`);
                continue;
            }
            // Convert ReadStream to Buffer securely
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const rawBuffer = Buffer.concat(chunks);
            // 2. Process Standard Resolution (1080p, WebP)
            const hdBuffer = await (0, sharp_1.default)(rawBuffer, { failOn: 'none' })
                .rotate() // Auto-orient based on EXIF
                .resize({ width: 1080, withoutEnlargement: true })
                .webp({ quality: 80, effort: 4 })
                .toBuffer();
            const hdKey = rawKey.replace(/\.[^/.]+$/, "") + "-hd.webp";
            const hdUrl = await (0, s3_1.uploadToS3)(hdBuffer, hdKey, "image/webp");
            // 3. Process Thumbnail Resolution (400p, WebP)
            const thumbBuffer = await (0, sharp_1.default)(rawBuffer, { failOn: 'none' })
                .rotate()
                .resize({ width: 400, withoutEnlargement: true })
                .webp({ quality: 70, effort: 4 })
                .toBuffer();
            const thumbKey = rawKey.replace(/\.[^/.]+$/, "") + "-thumb.webp";
            await (0, s3_1.uploadToS3)(thumbBuffer, thumbKey, "image/webp");
            // 4. Cleanup and map replacement
            // We use the new HD URL as the primary visual display array replacement
            replacementMap.set(rawUrl, [hdUrl]);
            // Safely discard the giant original file to save costs
            await (0, s3_1.deleteFromS3ByKey)(rawKey);
            logger_1.default.info(`[ImageWorker] Optimized successfully: ${rawKey} -> ${hdUrl}`);
        }
        catch (error) {
            logger_1.default.error(`[ImageWorker] Failed to optimize image ${rawUrl}:`, error);
        }
    }
    // 5. Atomic Document Update
    if (replacementMap.size > 0 && entityType === 'ad') {
        const ad = await Ad_1.default.findById(entityId);
        if (ad && Array.isArray(ad.images)) {
            let updatedCount = 0;
            const newImagesArray = ad.images.map(image => {
                const replacements = replacementMap.get(image);
                if (replacements && replacements.length > 0) {
                    updatedCount++;
                    return replacements[0]; // Replace with new HD variant
                }
                return image;
            });
            if (updatedCount > 0) {
                ad.images = newImagesArray.filter((img) => typeof img === 'string');
                await ad.save();
                logger_1.default.info(`[ImageWorker] Updated MongoDB Ad ${entityId} with ${updatedCount} optimized URLs`);
            }
        }
    }
}, {
    connection: redisConnection_1.redisConnection,
    concurrency: 2 // Max 2 parallel jobs to prevent Node.js OOM
});
exports.imageOptimizationWorker.on('failed', (job, err) => {
    if (job) {
        logger_1.default.error(`Image Optimization Job ${job.id} failed: ${err.message}`);
    }
    else {
        logger_1.default.error(`Image Worker failed: ${err.message}`);
    }
});
//# sourceMappingURL=imageWorker.js.map