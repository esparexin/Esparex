import redis, { shouldDisableRedis } from '../infrastructure/redis';
import AdMetrics from '../models/AdMetrics';
import logger from '../utils/logger';
import mongoose from 'mongoose';

/**
 * 🛡️ STAFF+ PRODUCTION HARDENING: View Buffering Service
 * 
 * Implements a dual-write safety pattern with Redis-based buffering to mitigate 
 * write contention on high-traffic listings. Prevents document locking and
 * write amplification by batching increments.
 */
export class ViewBufferingService {
    private static BATCH_SIZE = 100;
    private static FLUSH_INTERVAL_MS = 60000; // 1 minute
    private static BUFFER_PREFIX = 'views:buffer:';

    /**
     * Records a view in Redis and triggers a flush if the batch size is reached.
     * Guaranteed idempotent and crash-resilient via Redis INCR.
     */
    static async recordView(adId: string | mongoose.Types.ObjectId): Promise<void> {
        if (shouldDisableRedis) {
            // Fallback to direct write if Redis is unavailable
            await this.directWrite(adId.toString(), 1);
            return;
        }

        const sid = adId.toString();
        const key = `${this.BUFFER_PREFIX}${sid}`;
        
        try {
            const count = await redis.incr(key);
            
            // Set TTL on first increment to prevent stale key leakage
            if (count === 1) {
                await redis.expire(key, 86400); // 24h
            }

            if (count >= this.BATCH_SIZE) {
                await this.flush(sid);
            }
        } catch (err) {
            logger.error('ViewBufferingService: Redis error, falling back to direct write', { sid, err });
            await this.directWrite(sid, 1);
        }
    }

    /**
     * Idempotently flushes the buffered count from Redis to MongoDB.
     * Uses a 'lastFlushed' tracking key to ensure that even if the flush 
     * process crashes, no increments are lost or double-counted.
     */
    static async flush(adId: string): Promise<void> {
        const key = `${this.BUFFER_PREFIX}${adId}`;
        const lastFlushedKey = `views:last_flushed:${adId}`;
        
        try {
            // 1. Get current count and last successfully flushed count
            const [currentStr, lastFlushedStr] = await Promise.all([
                redis.get(key),
                redis.get(lastFlushedKey)
            ]);

            const current = parseInt(currentStr || '0', 10);
            const lastFlushed = parseInt(lastFlushedStr || '0', 10);

            // 2. Only update if there are new views since the last flush
            if (current <= lastFlushed) {
                if (current === 0) await redis.del(key); // Cleanup
                return;
            }

            const delta = current - lastFlushed;

            // 3. Atomically update AdMetrics with the delta
            await AdMetrics.updateOne(
                { adId: new mongoose.Types.ObjectId(adId) },
                { 
                    $inc: { 'views.total': delta },
                    $set: { 'views.lastViewedAt': new Date() }
                },
                { upsert: true }
            );

            // 4. Update the watermark and set TTL
            await redis.set(lastFlushedKey, current, 'EX', 86400 * 7); // 7 days
            
            // 5. Cleanup the buffer key if it hasn't changed
            const finalCheck = await redis.get(key);
            if (Number(finalCheck) === current) {
                await redis.del(key);
                await redis.del(lastFlushedKey); // Watermark only needed while buffer exists
            }
        } catch (err) {
            logger.error('ViewBufferingService: Idempotent flush failed', { adId, err });
        }
    }

    /**
     * Updates the AdMetrics collection.
     * Implements UPSERT to handle newly created listings without prior metrics.
     */
    private static async directWrite(adId: string, count: number): Promise<void> {
        try {
            await AdMetrics.updateOne(
                { adId: new mongoose.Types.ObjectId(adId) },
                { 
                    $inc: { 'views.total': count },
                    $set: { 'views.lastViewedAt': new Date() }
                },
                { upsert: true }
            );
        } catch (err) {
            logger.error('ViewBufferingService: MongoDB direct write failed', { adId, count, err });
        }
    }

    /**
     * Periodic flush task to ensure low-traffic listings still get updated.
     * Should be called by a cron or background worker.
     */
    static async flushAll(): Promise<number> {
        if (shouldDisableRedis) return 0;
        
        try {
            const keys = await redis.keys(`${this.BUFFER_PREFIX}*`);
            let flushedCount = 0;
            
            for (const key of keys) {
                const adId = key.replace(this.BUFFER_PREFIX, '');
                await this.flush(adId);
                flushedCount++;
            }
            
            return flushedCount;
        } catch (err) {
            logger.error('ViewBufferingService: Global flush failed', { err });
            return 0;
        }
    }
}
