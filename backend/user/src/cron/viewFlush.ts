import { ViewBufferingService } from '@esparex/core/services';;

/**
 * View Buffer Flush Cron
 *
 * Periodically drains the Redis view buffer into MongoDB (AdMetrics).
 * Ensures low-traffic listings (that never hit the BATCH_SIZE threshold
 * inside ViewBufferingService.recordView) still get their view counts
 * persisted within a bounded latency window.
 *
 * Run interval: 1 minute (matches ViewBufferingService.FLUSH_INTERVAL_MS)
 * Startup delay: 30s (gives the server time to fully initialize)
 *
 * Uses a distributed job lock so only one process flushes at a time
 * in a multi-instance deployment.
 */

import { runWithDistributedJobLock } from '@esparex/core/tooling';;
import { logger } from '@esparex/core/utils';;;;

const VIEW_FLUSH_INTERVAL_MS = 60_000; // 1 minute
const VIEW_FLUSH_STARTUP_DELAY_MS = 30_000;
const VIEW_FLUSH_LOCK_TTL_MS = 55_000; // < interval to prevent overlap
const VIEW_FLUSH_JOB_NAME = 'view_buffer_flush';

const runViewFlush = async (): Promise<void> => {
    try {
        await runWithDistributedJobLock(
            VIEW_FLUSH_JOB_NAME,
            { ttlMs: VIEW_FLUSH_LOCK_TTL_MS, failOpen: true }, // failOpen: don't crash if Redis is down
            async () => {
                const flushedCount = await ViewBufferingService.flushAll();
                if (flushedCount > 0) {
                    logger.info('[ViewFlushCron] Flushed view buffers to AdMetrics', { flushedCount });
                }
            }
        );
    } catch (error) {
        // Cron job — log only, never throw
        logger.error('[ViewFlushCron] Flush job failed', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
};

export const startViewFlushCron = (): void => {
    setTimeout(() => {
        void runViewFlush();
        setInterval(() => {
            void runViewFlush();
        }, VIEW_FLUSH_INTERVAL_MS);
    }, VIEW_FLUSH_STARTUP_DELAY_MS);

    logger.info('[ViewFlushCron] Scheduled to flush Redis view buffer every 1 minute');
};

export default startViewFlushCron;
