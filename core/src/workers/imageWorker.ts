import crypto from "crypto";
import { Worker } from "bullmq";
import sharp from "sharp";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { redisConnection, shouldDisableQueueConnection } from "../queues/redisConnection";
import { s3Client, getBucketName, extractS3KeyFromUrl, uploadToS3, deleteFromS3ByKey } from "../utils/s3";
import Ad from "../models/Ad";
import logger from "../utils/logger";
import { ImageOptimizationJobPayload } from "../queues/imageQueue";
import { enqueueDeadLetter } from "../queues/deadLetterQueue";
import { queueWorkerBackoffStrategy } from "../queues/queueDefaults";
import { TraceContext } from '@esparex/shared';
import { clearReliabilityContext, setReliabilityContext } from '../utils/reliabilityContext';

// Use a strict concurrency of 2 to avoid memory overloads when processing 10MB raw JPEGs natively.
const createNoopWorker = <T>() => ({
    on: () => undefined,
    close: async () => undefined,
} as unknown as Worker<T>);

export const imageOptimizationWorker = shouldDisableQueueConnection
    ? createNoopWorker()
    : new Worker<ImageOptimizationJobPayload>(
        "image-optimization-events",
        async (job) => {
            const traceId = (job.data as { _trace?: { requestId?: string } } | undefined)?._trace?.requestId || `job-${String(job.id || 'unknown')}`;
            const traceUserId = (job.data as { _trace?: { userId?: string } } | undefined)?._trace?.userId;
            TraceContext.setCorrelationId(traceId);
            setReliabilityContext({
                traceId,
                userId: traceUserId,
                queueName: 'image-optimization-events',
                jobId: job.id ? String(job.id) : undefined,
                jobName: job.name,
                requestPath: `queue://image-optimization-events/${job.name}`,
                method: 'QUEUE',
            });
            try {
                const { entityId, entityType, imageUrls } = job.data;

                logger.info(`[ImageWorker] Starting optimization for ${entityType} ${entityId} (${imageUrls.length} images)`);
                const activeBucket = getBucketName();
                if (!activeBucket) {
                    throw new Error("S3_BUCKET_NAME missing. Cannot optimize images.");
                }

                // 1. Fetch listing and check lifecycle state
                const ad = entityType === 'ad' ? await Ad.findById(entityId) : null;
                if (entityType === 'ad' && (!ad || ad.isDeleted)) {
                    logger.info(`[ImageWorker] Skipping job: Ad ${entityId} not found or soft-deleted`);
                    logger.info("[ImageWorker] Structured Telemetry", {
                        listingId: entityId,
                        jobId: job.id || '',
                        listingType: ad?.listingType || 'ad',
                        imagesProcessed: 0,
                        imagesSkipped: imageUrls.length,
                        thumbnailsGenerated: 0,
                        durationMs: 0,
                        retryCount: job.attemptsMade || 0,
                        result: 'lifecycle_skipped'
                    });
                    return;
                }

                // 2. DB-First Idempotency Gate
                const hasStagingImages = imageUrls.some(url => {
                    const key = extractS3KeyFromUrl(url);
                    return key && key.includes('business-staging');
                });
                const databaseAlreadyOptimized = ad && Array.isArray(ad.images) && ad.images.some(url => url.endsWith('-hd.webp'));

                if (databaseAlreadyOptimized && !hasStagingImages) {
                    logger.info(`[ImageWorker] DB already optimized for Ad ${entityId}, skipping.`);
                    logger.info("[ImageWorker] Structured Telemetry", {
                        listingId: entityId,
                        jobId: job.id || '',
                        listingType: ad?.listingType || 'ad',
                        imagesProcessed: 0,
                        imagesSkipped: imageUrls.length,
                        thumbnailsGenerated: 0,
                        durationMs: 0,
                        retryCount: job.attemptsMade || 0,
                        result: 'skipped'
                    });
                    return;
                }

                // 3. Determine target S3 folder prefix
                let folder = 'ads';
                if (ad) {
                    if (ad.listingType === 'service') folder = 'services';
                    else if (ad.listingType === 'spare_part') folder = 'spare-part-listings';
                } else if (entityType === 'business') {
                    folder = 'businesses';
                }

                const replacementMap = new Map<string, { hdUrl: string; thumbUrl: string }>();
                let imagesProcessedCount = 0;
                let imagesSkippedCount = 0;
                let thumbsGeneratedCount = 0;
                const startProcessingTime = Date.now();

                for (const rawUrl of imageUrls) {
                    const rawKey = extractS3KeyFromUrl(rawUrl);
                    if (!rawKey) {
                        imagesSkippedCount++;
                        continue;
                    }

                    // S3-First Recovery Check
                    const fileBaseName = rawKey.split('/').pop()?.replace(/\.[^/.]+$/, "") || crypto.randomUUID();
                    const basePath = `${folder}/${entityId}`;
                    const hdKey = `${basePath}/${fileBaseName}-hd.webp`;
                    const thumbKey = `${basePath}/${fileBaseName}-thumb.webp`;

                    let hdUrl: string | undefined;
                    let thumbUrl: string | undefined;

                    try {
                        const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
                        await s3Client.send(new HeadObjectCommand({ Bucket: activeBucket, Key: hdKey }));
                        
                        const cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL;
                        const baseUrl = cloudfrontUrl 
                            ? cloudfrontUrl.trim().replace(/\/$/, '')
                            : `https://${activeBucket}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com`;
                        hdUrl = `${baseUrl}/${hdKey}`;
                        thumbUrl = `${baseUrl}/${thumbKey}`;
                        logger.info(`[ImageWorker] Target S3 key already exists (idempotency hit): ${hdKey}`);
                    } catch {
                        // File not found on S3, needs optimization
                    }

                    if (hdUrl && thumbUrl) {
                        replacementMap.set(rawUrl, { hdUrl, thumbUrl });
                        imagesSkippedCount++;
                        continue;
                    }

                    try {
                        const getCommand = new GetObjectCommand({
                            Bucket: activeBucket,
                            Key: rawKey
                        });
                        const response = await s3Client.send(getCommand);
                        const stream = response.Body as NodeJS.ReadableStream;

                        if (!stream) {
                            logger.warn(`[ImageWorker] Read stream failed for ${rawKey}`);
                            imagesSkippedCount++;
                            continue;
                        }

                        const chunks: Buffer[] = [];
                        for await (const chunk of stream) {
                            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
                        }
                        const rawBuffer = Buffer.concat(chunks);

                        const hdBuffer = await sharp(rawBuffer, { failOn: 'none' })
                            .rotate()
                            .resize({ width: 1080, withoutEnlargement: true })
                            .webp({ quality: 80, effort: 4 })
                            .toBuffer();

                        const uploadedHdUrl = await uploadToS3(hdBuffer, hdKey, "image/webp");

                        const thumbBuffer = await sharp(rawBuffer, { failOn: 'none' })
                            .rotate()
                            .resize({ width: 400, withoutEnlargement: true })
                            .webp({ quality: 70, effort: 4 })
                            .toBuffer();

                        const uploadedThumbUrl = await uploadToS3(thumbBuffer, thumbKey, "image/webp");

                        replacementMap.set(rawUrl, { hdUrl: uploadedHdUrl, thumbUrl: uploadedThumbUrl });

                        // Delete original staging file
                        if (rawKey.includes('business-staging') || rawKey.includes('temp/')) {
                            await deleteFromS3ByKey(rawKey).catch(e => {
                                logger.warn(`[ImageWorker] Failed to delete original staging object: ${rawKey}`, e);
                            });
                        }

                        imagesProcessedCount++;
                        thumbsGeneratedCount++;
                        logger.info(`[ImageWorker] Optimized successfully: ${rawKey} -> ${uploadedHdUrl}`);
                    } catch (error) {
                        logger.error(`[ImageWorker] Failed to optimize image ${rawUrl}:`, error);
                        // Retryable failure (timeout, network drop)
                        throw error;
                    }
                }

                if (replacementMap.size > 0 && ad) {
                    if (Array.isArray(ad.images)) {
                        let updatedImagesCount = 0;
                        const newImagesArray = ad.images.map(image => {
                            const match = replacementMap.get(image);
                            if (match) {
                                updatedImagesCount += 1;
                                return match.hdUrl;
                            }
                            return image;
                        });

                        let newThumbnailsArray: string[] = [];
                        let updatedThumbsCount = 0;
                        if (Array.isArray(ad.thumbnails) && ad.thumbnails.length > 0) {
                            newThumbnailsArray = ad.thumbnails.map((thumb: string) => {
                                const match = replacementMap.get(thumb);
                                if (match) {
                                    updatedThumbsCount += 1;
                                    return match.thumbUrl;
                                }
                                for (const [rawUrl, matchObj] of replacementMap.entries()) {
                                    if (thumb === rawUrl) {
                                        updatedThumbsCount += 1;
                                        return matchObj.thumbUrl;
                                    }
                                }
                                return thumb;
                            });
                        } else {
                            newThumbnailsArray = newImagesArray.map((image: string) => {
                                const match = replacementMap.get(image);
                                if (match) {
                                    updatedThumbsCount += 1;
                                    return match.thumbUrl;
                                }
                                return image;
                            });
                        }

                        // Atomic Update with Exact Image-Set Verification
                        const updateResult = await Ad.updateOne(
                            { 
                                _id: entityId, 
                                images: { $eq: ad.images }
                            },
                            {
                                $set: {
                                    images: newImagesArray.filter((img): img is string => typeof img === 'string'),
                                    thumbnails: newThumbnailsArray.filter((img): img is string => typeof img === 'string')
                                }
                            }
                        );

                        const durationMs = Date.now() - startProcessingTime;

                        if (updateResult.modifiedCount > 0) {
                            logger.info(`[ImageWorker] Updated MongoDB Ad ${entityId} with ${updatedImagesCount} optimized URLs and ${updatedThumbsCount} thumbnails`);
                            logger.info("[ImageWorker] Structured Telemetry", {
                                listingId: entityId,
                                jobId: job.id || '',
                                listingType: ad.listingType || 'ad',
                                imagesProcessed: imagesProcessedCount,
                                imagesSkipped: imagesSkippedCount,
                                thumbnailsGenerated: thumbsGeneratedCount,
                                durationMs,
                                retryCount: job.attemptsMade || 0,
                                result: 'success'
                            });
                        } else {
                            logger.warn(`[ImageWorker] Concurrency conflict: image set changed for Ad ${entityId}. Stale update discarded.`);
                            logger.info("[ImageWorker] Structured Telemetry", {
                                listingId: entityId,
                                jobId: job.id || '',
                                listingType: ad.listingType || 'ad',
                                imagesProcessed: 0,
                                imagesSkipped: imageUrls.length,
                                thumbnailsGenerated: 0,
                                durationMs,
                                retryCount: job.attemptsMade || 0,
                                result: 'concurrency_conflict'
                            });
                        }
                    }
                }
            } catch (error) {
                logger.error('[ImageWorker] Job processor failed', {
                    jobId: job.id,
                    jobName: job.name,
                    error: error instanceof Error ? error.message : String(error),
                });
                throw error;
            } finally {
                TraceContext.clear();
                clearReliabilityContext();
            }
        },
        {
            connection: redisConnection,
            concurrency: 2,
            settings: {
                backoffStrategy: (attemptsMade: number) => queueWorkerBackoffStrategy(attemptsMade, 5_000, 180_000),
            }
        }
    );

if (!shouldDisableQueueConnection) {
    imageOptimizationWorker.on('failed', (job, err) => {
        if (job) {
            logger.error(`Image Optimization Job ${job.id} failed: ${err.message}`, {
                attemptsMade: job.attemptsMade,
                attemptsConfigured: job.opts.attempts || 1,
            });
            void enqueueDeadLetter('image-optimization-events', job, err);
        } else {
            logger.error(`Image Worker failed: ${err.message}`);
        }
    });

    imageOptimizationWorker.on('error', (err) => {
        logger.error('[ImageWorker] Worker runtime error', { error: err.message });
    });
}
