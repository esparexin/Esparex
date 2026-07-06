import logger from '../../utils/logger';
import Category from '../../models/Category';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import type { Model as MongooseModel } from 'mongoose';
import { getDatabaseHealthProbe } from '../db';
import { getQueueHealthProbe } from '../../queues/queueHealth';
import { getRedisHealthProbe } from '../cache/redisCache';
import { env } from '../../config/env';

const STARTUP_COUNT_MAX_TIME_MS = 1200;

const getFastCollectionCount = async (model: MongooseModel<unknown>): Promise<number> => {
    try {
        return await model.collection.estimatedDocumentCount({
            maxTimeMS: STARTUP_COUNT_MAX_TIME_MS
        });
    } catch (estimateError) {
        const modelName = model.modelName || 'Unknown';
        logger.warn('[MetadataHealth] estimatedDocumentCount failed; falling back to countDocuments', {
            model: modelName,
            error: estimateError instanceof Error ? estimateError.message : String(estimateError)
        });

        return model.collection.countDocuments({}, {
            maxTimeMS: STARTUP_COUNT_MAX_TIME_MS
        });
    }
};

/**
 * Validates the integrity of metadata collections at startup.
 * Since metadata (Categories, Brands) often resides in a separate Admin DB,
 * this check ensures that the application is correctly connected and the data is present.
 */
export async function validateMetadataHealth() {
    try {
        const [categoryCount, brandCount, modelCount] = await Promise.all([
            getFastCollectionCount(Category),
            getFastCollectionCount(Brand),
            getFastCollectionCount(Model)
        ]);

        if (categoryCount === 0 || brandCount === 0) {
            logger.warn('⚠️ METADATA ALERT: Category or Brand collection is empty. Listings may lack critical metadata.', {
                categories: categoryCount,
                brands: brandCount,
                models: modelCount
            });
        } else {
            logger.info('✅ Metadata health verified', {
                categories: categoryCount,
                brands: brandCount,
                models: modelCount
            });
        }
    } catch (err) {
        logger.error('❌ Metadata validation failed', {
            error: err instanceof Error ? err.message : String(err)
        });
    }
}

const STARTUP_READINESS_TIMEOUT_MS = env.RELIABILITY_STARTUP_READINESS_TIMEOUT_MS ?? 12_000;

export const assertCriticalStartupReadiness = async (): Promise<void> => {
    const startedAt = Date.now();
    const [databaseHealth, redisHealth, queueHealth] = await Promise.all([
        getDatabaseHealthProbe(),
        getRedisHealthProbe(),
        getQueueHealthProbe(),
    ]);

    const readinessFailures: string[] = [];
    if (databaseHealth.overall === 'down') {
        readinessFailures.push('database subsystem is down');
    }

    const redisConnected = redisHealth.connected && redisHealth.pingOk && redisHealth.roundTripOk;
    const isProduction = env.NODE_ENV === 'production';
    const redisRequired = isProduction;

    if (!redisConnected) {
        if (redisRequired) {
            readinessFailures.push('redis subsystem is unavailable');
        } else {
            logger.warn('Redis unavailable; continuing with in-memory cache and rate limiter fallbacks.', {
                connected: redisHealth.connected,
                pingOk: redisHealth.pingOk,
                roundTripOk: redisHealth.roundTripOk
            });
        }
    }
    if (queueHealth.status === 'down') {
        readinessFailures.push('queue subsystem is down');
    }

    if (Date.now() - startedAt > STARTUP_READINESS_TIMEOUT_MS) {
        readinessFailures.push(`readiness evaluation exceeded ${STARTUP_READINESS_TIMEOUT_MS}ms`);
    }

    if (readinessFailures.length > 0) {
        throw new Error(`Critical startup readiness failed: ${readinessFailures.join('; ')}`);
    }

    logger.info('Critical startup readiness passed', {
        databaseStatus: databaseHealth.overall,
        redisConnected: redisHealth.connected,
        redisPingOk: redisHealth.pingOk,
        redisRoundTripOk: redisHealth.roundTripOk,
        queueStatus: queueHealth.status,
        evaluatedInMs: Date.now() - startedAt,
    });
};
