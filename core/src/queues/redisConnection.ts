import { Redis } from "ioredis";
import bootstrapLogger from "../utils/bootstrapLogger";
import { env } from "../config/env";

const REDIS_URL = env.REDIS_URL || 'redis://127.0.0.1:6379';

if (env.NODE_ENV === 'production') {
    if (!REDIS_URL.includes('@') && !env.REDIS_PASSWORD) {
        bootstrapLogger.warn('Queue Redis connection lacks a password in production environment.');
    }
    if (!REDIS_URL.startsWith('rediss://')) {
        bootstrapLogger.warn('Queue Redis connection is not using TLS (rediss://). Cloud-hosted Redis should be encrypted.');
    }
}

// We use maxRetriesPerRequest: null, which is required by BullMQ
export const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: undefined, // 🔒 FORCE DISABLE TLS
});
