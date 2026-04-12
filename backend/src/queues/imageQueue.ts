import { Queue } from 'bullmq';
import { redisConnection } from './redisConnection';
import logger from '../utils/logger';

export interface ImageOptimizationJobPayload {
    entityId: string;
    entityType: 'ad' | 'business';
    imageUrls: string[];
}

export const imageOptimizationQueue = new Queue('image-optimization-events', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const enqueueImageOptimization = async (
    entityId: string,
    entityType: 'ad' | 'business',
    imageUrls: string[]
): Promise<void> => {
    if (!imageUrls || imageUrls.length === 0) return;

    // Filter out standard URLs that might already be optimized or placeholders to prevent looping
    const eligibleUrls = imageUrls.filter(url => 
        url.startsWith('https://') && 
        !url.includes('placehold.co') && 
        !url.endsWith('-hd.webp') && 
        !url.endsWith('-thumb.webp')
    );

    if (eligibleUrls.length === 0) return;

    try {
        await imageOptimizationQueue.add(
            `optimize-images-${entityId}`,
            { entityId, entityType, imageUrls: eligibleUrls },
            { jobId: `img-opt-${entityId}-${Date.now()}` }
        );
        logger.info(`[ImageQueue] Enqueued image optimization for ${entityType} ${entityId}`, { count: eligibleUrls.length });
    } catch (error) {
        logger.error(`[ImageQueue] Failed to enqueue image optimization for ${entityType} ${entityId}`, error);
    }
};
