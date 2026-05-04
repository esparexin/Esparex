"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewBufferingService = void 0;
const redis_1 = __importStar(require("@core/config/redis"));
const AdMetrics_1 = __importDefault(require("@core/models/AdMetrics"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * 🛡️ STAFF+ PRODUCTION HARDENING: View Buffering Service
 *
 * Implements a dual-write safety pattern with Redis-based buffering to mitigate
 * write contention on high-traffic listings. Prevents document locking and
 * write amplification by batching increments.
 */
class ViewBufferingService {
    static BATCH_SIZE = 100;
    static FLUSH_INTERVAL_MS = 60000; // 1 minute
    static BUFFER_PREFIX = 'views:buffer:';
    /**
     * Records a view in Redis and triggers a flush if the batch size is reached.
     * Guaranteed idempotent and crash-resilient via Redis INCR.
     */
    static async recordView(adId) {
        if (redis_1.shouldDisableRedis) {
            // Fallback to direct write if Redis is unavailable
            await this.directWrite(adId.toString(), 1);
            return;
        }
        const sid = adId.toString();
        const key = `${this.BUFFER_PREFIX}${sid}`;
        try {
            const count = await redis_1.default.incr(key);
            // Set TTL on first increment to prevent stale key leakage
            if (count === 1) {
                await redis_1.default.expire(key, 86400); // 24h
            }
            if (count >= this.BATCH_SIZE) {
                await this.flush(sid);
            }
        }
        catch (err) {
            logger_1.default.error('ViewBufferingService: Redis error, falling back to direct write', { sid, err });
            await this.directWrite(sid, 1);
        }
    }
    /**
     * Idempotently flushes the buffered count from Redis to MongoDB.
     * Uses a 'lastFlushed' tracking key to ensure that even if the flush
     * process crashes, no increments are lost or double-counted.
     */
    static async flush(adId) {
        const key = `${this.BUFFER_PREFIX}${adId}`;
        const lastFlushedKey = `views:last_flushed:${adId}`;
        try {
            // 1. Get current count and last successfully flushed count
            const [currentStr, lastFlushedStr] = await Promise.all([
                redis_1.default.get(key),
                redis_1.default.get(lastFlushedKey)
            ]);
            const current = parseInt(currentStr || '0', 10);
            const lastFlushed = parseInt(lastFlushedStr || '0', 10);
            // 2. Only update if there are new views since the last flush
            if (current <= lastFlushed) {
                if (current === 0)
                    await redis_1.default.del(key); // Cleanup
                return;
            }
            const delta = current - lastFlushed;
            // 3. Atomically update AdMetrics with the delta
            await AdMetrics_1.default.updateOne({ adId: new mongoose_1.default.Types.ObjectId(adId) }, {
                $inc: { 'views.total': delta },
                $set: { 'views.lastViewedAt': new Date() }
            }, { upsert: true });
            // 4. Update the watermark and set TTL
            await redis_1.default.set(lastFlushedKey, current, 'EX', 86400 * 7); // 7 days
            // 5. Cleanup the buffer key if it hasn't changed
            const finalCheck = await redis_1.default.get(key);
            if (Number(finalCheck) === current) {
                await redis_1.default.del(key);
                await redis_1.default.del(lastFlushedKey); // Watermark only needed while buffer exists
            }
        }
        catch (err) {
            logger_1.default.error('ViewBufferingService: Idempotent flush failed', { adId, err });
        }
    }
    /**
     * Updates the AdMetrics collection.
     * Implements UPSERT to handle newly created listings without prior metrics.
     */
    static async directWrite(adId, count) {
        try {
            await AdMetrics_1.default.updateOne({ adId: new mongoose_1.default.Types.ObjectId(adId) }, {
                $inc: { 'views.total': count },
                $set: { 'views.lastViewedAt': new Date() }
            }, { upsert: true });
        }
        catch (err) {
            logger_1.default.error('ViewBufferingService: MongoDB direct write failed', { adId, count, err });
        }
    }
    /**
     * Periodic flush task to ensure low-traffic listings still get updated.
     * Should be called by a cron or background worker.
     */
    static async flushAll() {
        if (redis_1.shouldDisableRedis)
            return 0;
        try {
            const keys = await redis_1.default.keys(`${this.BUFFER_PREFIX}*`);
            let flushedCount = 0;
            for (const key of keys) {
                const adId = key.replace(this.BUFFER_PREFIX, '');
                await this.flush(adId);
                flushedCount++;
            }
            return flushedCount;
        }
        catch (err) {
            logger_1.default.error('ViewBufferingService: Global flush failed', { err });
            return 0;
        }
    }
}
exports.ViewBufferingService = ViewBufferingService;
//# sourceMappingURL=ViewBufferingService.js.map