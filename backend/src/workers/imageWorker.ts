import { Worker } from "bullmq";
import sharp from "sharp";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { redisConnection } from "../queues/redisConnection";
import { s3Client, getBucketName, extractS3KeyFromUrl, uploadToS3, deleteFromS3ByKey } from "../utils/s3";
import Ad from "../models/Ad";
import logger from "../utils/logger";
import { ImageOptimizationJobPayload } from "../queues/imageQueue";

// Use a strict concurrency of 2 to avoid memory overloads when processing 10MB raw JPEGs natively.
export const imageOptimizationWorker = new Worker<ImageOptimizationJobPayload>("image-optimization-events", async job => {
    const { entityId, entityType, imageUrls } = job.data;

    logger.info(`[ImageWorker] Starting optimization for ${entityType} ${entityId} (${imageUrls.length} images)`);
    const activeBucket = getBucketName();
    if (!activeBucket) {
        throw new Error("S3_BUCKET_NAME missing. Cannot optimize images.");
    }

    const replacementMap = new Map<string, string[]>();

    for (const rawUrl of imageUrls) {
        const rawKey = extractS3KeyFromUrl(rawUrl);
        if (!rawKey) continue;

        try {
            // 1. Download raw stream from S3
            const getCommand = new GetObjectCommand({
                Bucket: activeBucket,
                Key: rawKey
            });
            const response = await s3Client.send(getCommand);
            const stream = response.Body as NodeJS.ReadableStream;
            
            if (!stream) {
                logger.warn(`[ImageWorker] Read stream failed for ${rawKey}`);
                continue;
            }

            // Convert ReadStream to Buffer securely
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const rawBuffer = Buffer.concat(chunks);

            // 2. Process Standard Resolution (1080p, WebP)
            const hdBuffer = await sharp(rawBuffer, { failOn: 'none' })
                .rotate() // Auto-orient based on EXIF
                .resize({ width: 1080, withoutEnlargement: true })
                .webp({ quality: 80, effort: 4 })
                .toBuffer();

            const hdKey = rawKey.replace(/\.[^/.]+$/, "") + "-hd.webp";
            const hdUrl = await uploadToS3(hdBuffer, hdKey, "image/webp");

            // 3. Process Thumbnail Resolution (400p, WebP)
            const thumbBuffer = await sharp(rawBuffer, { failOn: 'none' })
                .rotate()
                .resize({ width: 400, withoutEnlargement: true })
                .webp({ quality: 70, effort: 4 })
                .toBuffer();

            const thumbKey = rawKey.replace(/\.[^/.]+$/, "") + "-thumb.webp";
            await uploadToS3(thumbBuffer, thumbKey, "image/webp");

            // 4. Cleanup and map replacement
            // We use the new HD URL as the primary visual display array replacement
            replacementMap.set(rawUrl, [hdUrl]);

            // Safely discard the giant original file to save costs
            await deleteFromS3ByKey(rawKey);

            logger.info(`[ImageWorker] Optimized successfully: ${rawKey} -> ${hdUrl}`);

        } catch (error) {
            logger.error(`[ImageWorker] Failed to optimize image ${rawUrl}:`, error);
        }
    }

    // 5. Atomic Document Update
    if (replacementMap.size > 0 && entityType === 'ad') {
        const ad = await Ad.findById(entityId);
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
                ad.images = newImagesArray.filter((img): img is string => typeof img === 'string');
                await ad.save();
                logger.info(`[ImageWorker] Updated MongoDB Ad ${entityId} with ${updatedCount} optimized URLs`);
            }
        }
    }

}, {
    connection: redisConnection,
    concurrency: 2 // Max 2 parallel jobs to prevent Node.js OOM
});

imageOptimizationWorker.on('failed', (job, err) => {
    if (job) {
        logger.error(`Image Optimization Job ${job.id} failed: ${err.message}`);
    } else {
        logger.error(`Image Worker failed: ${err.message}`);
    }
});
