import { Queue } from 'bullmq';
import { isQueueConnectionAvailable, redisConnection, shouldDisableQueueConnection } from './redisConnection';
import logger from '../utils/logger';
import { addJobWithTrace, type TraceableJobData } from '../utils/queueWrapper';
import { withQueueDefaults } from './queueDefaults';
import {
    buildDeterministicJobId,
    releaseQueueIdempotencySlot,
    reserveQueueIdempotencySlot
} from './queueIdempotency';
import { emitReliabilityAlert } from '../utils/reliabilityAlerts';
import { reliabilityAlertsTotal } from '../utils/metrics';

export interface ImageOptimizationJobPayload extends TraceableJobData {
    entityId: string;
    entityType: 'ad' | 'business';
    imageUrls: string[];
}


const createNoopQueue = <T>() => ({
    add: async () => null,
    close: async () => undefined,
    on: () => undefined,
} as unknown as Queue<T>);

export const imageOptimizationQueue = shouldDisableQueueConnection
    ? createNoopQueue<ImageOptimizationJobPayload>()
    : new Queue('image-optimization-events', {
        connection: redisConnection,
        defaultJobOptions: withQueueDefaults({
            removeOnComplete: 500,
            removeOnFail: 1_000,
        }),
    });

export const enqueueImageOptimization = async (
    entityId: string,
    entityType: 'ad' | 'business',
    imageUrls: string[]
): Promise<void> => {
    if (!isQueueConnectionAvailable()) {
        logger.warn('[ImageQueue] Redis unavailable, image optimization enqueue skipped', {
            entityId,
            entityType,
            attemptedImages: imageUrls.length,
        });
        reliabilityAlertsTotal.labels('QUEUE_PAUSED_REDIS_UNAVAILABLE', 'high').inc();
        void emitReliabilityAlert({
            type: 'QUEUE_PAUSED_REDIS_UNAVAILABLE',
            title: 'Queue paused due to Redis outage',
            severity: 'high',
            summary: 'image-optimization-events queue is unavailable',
            dedupeKey: 'queue_paused_image_optimization',
            metadata: {
                queueName: 'image-optimization-events',
                entityId,
                entityType,
                attemptedImages: imageUrls.length,
            },
        });
        return;
    }

    if (!imageUrls || imageUrls.length === 0) return;

    // Filter out standard URLs that might already be optimized or placeholders to prevent looping
    const eligibleUrls = imageUrls.filter(url => 
        url.startsWith('https://') && 
        !url.includes('placehold.co') && 
        !url.endsWith('-hd.webp') && 
        !url.endsWith('-thumb.webp')
    );

    if (eligibleUrls.length === 0) return;

    const normalizedUrls = [...eligibleUrls].sort();
    const jobId = buildDeterministicJobId(
        `img-opt:${entityType}:${entityId}`,
        { entityId, entityType, imageUrls: normalizedUrls }
    );
    const reserved = await reserveQueueIdempotencySlot('image-optimization-events', jobId, 60 * 60);
    if (!reserved) {
        logger.info('[ImageQueue] Duplicate image optimization enqueue skipped', {
            entityId,
            entityType,
            jobId
        });
        return;
    }

    try {
        await addJobWithTrace(
            imageOptimizationQueue,
            `optimize-images-${entityId}`,
            { entityId, entityType, imageUrls: eligibleUrls },
            { jobId }
        );
        logger.info(`[ImageQueue] Enqueued image optimization for ${entityType} ${entityId}`, { count: eligibleUrls.length });

    } catch (error) {
        await releaseQueueIdempotencySlot('image-optimization-events', jobId);
        logger.error(`[ImageQueue] Failed to enqueue image optimization for ${entityType} ${entityId}`, error);
    }
};
