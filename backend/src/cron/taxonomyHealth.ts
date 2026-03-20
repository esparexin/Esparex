/**
 * Taxonomy Health Timer
 *
 * Runs every 24 hours after the server starts to detect and soft-delete any
 * orphaned Models whose parent Brand has been deleted.
 *
 * Uses native Node.js setInterval — no extra dependencies required.
 *
 * Patch 6: Redis NX mutex prevents duplicate execution across multi-node deployments.
 * Only the first replica to acquire the lock will run the job each cycle.
 */
import Brand from '../models/Brand';
import Model from '../models/Model';
import logger from '../utils/logger';
import redisClient from '../utils/redisCache';

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MUTEX_KEY = 'taxonomy_health_lock';
const MUTEX_TTL_SECONDS = 60; // lock expires after 60s — prevents stale lock if node crashes mid-run

async function acquireLock(): Promise<boolean> {
    try {
        // ioredis positional arguments: key, value, 'EX', seconds, 'NX'
        const result = await redisClient.set(MUTEX_KEY, '1', 'EX', MUTEX_TTL_SECONDS, 'NX');
        return result === 'OK';
    } catch {
        // If Redis is unavailable, allow the job to run (fail-open) to avoid complete stoppage
        logger.warn('[TaxonomyHealth] Redis mutex unavailable — running without lock (single-node fallback).');
        return true;
    }
}

async function runTaxonomyHealthCheck(): Promise<void> {
    const acquired = await acquireLock();
    if (!acquired) {
        logger.info('[TaxonomyHealth] Lock not acquired — another node is running this cycle. Skipping.');
        return;
    }

    logger.info('[TaxonomyHealth] Lock acquired. Starting daily orphan check...');
    try {
        const validBrandIds = await Brand.find({ isDeleted: { $ne: true } }).distinct('_id');

        const result = await Model.updateMany(
            {
                brandId: { $nin: validBrandIds },
                isDeleted: { $ne: true }
            },
            {
                $set: { isDeleted: true, isActive: false }
            }
        );

        if (result.modifiedCount > 0) {
            logger.warn(`[TaxonomyHealth] ⚠️  Soft-deleted ${result.modifiedCount} orphaned models.`);
        } else {
            logger.info('[TaxonomyHealth] ✅ No orphaned models found. Taxonomy is clean.');
        }
    } catch (error) {
        logger.error('[TaxonomyHealth] ❌ Health check failed:', error);
    }
}

export function startTaxonomyHealthCron(): void {
    // Run once after a 10-second startup delay, then every 24 hours
    setTimeout(() => {
        void runTaxonomyHealthCheck();
        setInterval(() => {
            void runTaxonomyHealthCheck();
        }, INTERVAL_MS);
    }, 10_000);

    logger.info('[TaxonomyHealth] Scheduled to run every 24 hours (Redis mutex enabled).');
}
