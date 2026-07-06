/* global NodeJS */
import { Worker } from "bullmq";
import sharp from "sharp";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { redisConnection, shouldDisableQueueConnection } from "../queues/redisConnection";
import { s3Client, getBucketName, extractS3KeyFromUrl, uploadToS3, deleteFromS3ByKey } from '../infrastructure/storage/s3';
import Ad from "../models/Ad";
import logger from "../utils/logger";
import { ImageOptimizationJobPayload } from "../queues/imageQueue";
import { enqueueDeadLetter } from "../queues/deadLetterQueue";
import { queueWorkerBackoffStrategy } from "../queues/queueDefaults";
import { TraceContext } from '@esparex/shared';
import { clearReliabilityContext, setReliabilityContext } from '../infrastructure/telemetry/reliabilityContext';

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

                const replacementMap = new Map<string, string[]>();

                for (const rawUrl of imageUrls) {
                    const rawKey = extractS3KeyFromUrl(rawUrl);
                    if (!rawKey) continue;

                    try {
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

                        const hdKey = rawKey.replace(/\.[^/.]+$/, "") + "-hd.webp";
                        const hdUrl = await uploadToS3(hdBuffer, hdKey, "image/webp");

                        const thumbBuffer = await sharp(rawBuffer, { failOn: 'none' })
                            .rotate()
                            .resize({ width: 400, withoutEnlargement: true })
                            .webp({ quality: 70, effort: 4 })
                            .toBuffer();

                        const thumbKey = rawKey.replace(/\.[^/.]+$/, "") + "-thumb.webp";
                        await uploadToS3(thumbBuffer, thumbKey, "image/webp");

                        replacementMap.set(rawUrl, [hdUrl]);
                        await deleteFromS3ByKey(rawKey);

                        logger.info(`[ImageWorker] Optimized successfully: ${rawKey} -> ${hdUrl}`);
                    } catch (error) {
                        logger.error(`[ImageWorker] Failed to optimize image ${rawUrl}:`, error);
                    }
                }

                if (replacementMap.size > 0 && entityType === 'ad') {
                    const ad = await Ad.findById(entityId);
                    if (ad && Array.isArray(ad.images)) {
                        let updatedCount = 0;
                        const newImagesArray = ad.images.map(image => {
                            const replacements = replacementMap.get(image);
                            if (replacements && replacements.length > 0) {
                                updatedCount += 1;
                                return replacements[0];
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
