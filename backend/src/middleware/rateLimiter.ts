import rateLimit from 'express-rate-limit';
import RedisStore, { type RedisReply } from 'rate-limit-redis';
import redisClient from '../config/redis';
import { Request, Response } from 'express';
import logger from '../utils/logger';

const shouldDisableRedisStore =
    process.env.NODE_ENV === 'test' && process.env.ALLOW_REDIS !== 'true';
const isLocalRelaxedAuth =
    process.env.NODE_ENV === 'development' &&
    process.env.CI !== 'true' &&
    process.env.AUTH_LOCAL_RELAXED === 'true';

type RedisCallable = {
    call: (...args: string[]) => Promise<RedisReply>;
};

type RateLimitRequest = Request & {
    rateLimit?: {
        resetTime?: Date;
    };
};

const resolveRetryAfterSeconds = (req: Request, fallbackSeconds: number): number => {
    const resetTime = (req as RateLimitRequest).rateLimit?.resetTime;
    if (resetTime instanceof Date) {
        const remaining = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
        if (Number.isFinite(remaining) && remaining > 0) {
            return remaining;
        }
    }
    return fallbackSeconds;
};

const MAX_SPIKE_CACHE_SIZE = 2000;
const spikeCache = new Map<string, { count: number, resetAt: number }>();

const respondRateLimited = (
    req: Request,
    res: Response,
    error: string,
    bucket: string,
    options: { code?: string; retryAfterSeconds?: number } = {}
) => {
    // 429 Spike Auto-Monitor
    const key = `spike:${req.ip}:${req.originalUrl}`;
    const now = Date.now();
    let record = spikeCache.get(key);

    if (!record || now > record.resetAt) {
        // Evict oldest entry when at capacity to prevent unbounded growth
        if (!record && spikeCache.size >= MAX_SPIKE_CACHE_SIZE) {
            const oldestKey = spikeCache.keys().next().value;
            if (oldestKey !== undefined) spikeCache.delete(oldestKey);
        }
        record = { count: 0, resetAt: now + 60000 }; // 1 minute window
    }
    record.count += 1;
    spikeCache.set(key, record);


    // Sample runaway-loop warnings to avoid attacker-controlled log amplification.
    if (record.count >= 50 && Math.random() < 0.1) {
        logger.warn(`UI RUNAWAY LOOP DETECTED: 429 spike on ${req.originalUrl} from ${req.ip}`, {
            ip: req.ip,
            url: req.originalUrl,
            error,
            count: record.count
        });
    }

    if (typeof options.retryAfterSeconds === 'number') {
        res.set('Retry-After', String(options.retryAfterSeconds));
    }
    return res.status(429).json({
        success: false,
        error: error,
        bucket,
        ...(options.retryAfterSeconds !== undefined ? { retryAfter: options.retryAfterSeconds } : {}),
        ...(options.code ? { code: options.code } : {})
    });
};

const createRedisStore = (prefix: string) => {
    if (process.env.NODE_ENV === 'production' && shouldDisableRedisStore) {
        throw new Error('FATAL: Redis store is required in production. In-memory fallback is strictly banned by SSOT.');
    }
    return shouldDisableRedisStore
        ? undefined
        : new RedisStore({
            sendCommand: (...args: string[]) =>
                (redisClient as unknown as RedisCallable).call(...args),
            prefix: `rl:${prefix}`,
        });
};

// ============================================================================
// SSOT RATE LIMITERS (HYBRID ISOLATION MODEL)
// ============================================================================

export function createLimiter({
    windowMs,
    max,
    keyPrefix,
    keyGenerator
}: {
    windowMs: number;
    max: number;
    keyPrefix: string;
    keyGenerator?: (req: Request) => string;
}) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        store: createRedisStore(keyPrefix),
        keyGenerator: keyGenerator,
        validate: keyGenerator ? false : { ip: false },
        handler: (req: Request, res: Response) => {
            const retryAfterSeconds = resolveRetryAfterSeconds(req, Math.ceil(windowMs / 1000));
            respondRateLimited(req, res, 'Too many requests. Please try again later.', keyPrefix.replace(':', ''), { retryAfterSeconds });
        }
    });
}

/**
 * Global Baseline Limit
 * 100 requests per minute per IP
 */
export const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 3000 : 100,
    store: createRedisStore('global:'),
    skip: (req) => {
        return req.originalUrl === '/api/v1/health' || req.originalUrl === '/health' || req.originalUrl.includes('/webhook');
    },
    handler: (req: Request, res: Response) => {
        const retryAfterSeconds = resolveRetryAfterSeconds(req, 60);
        respondRateLimited(req, res, 'Too many requests globally, please try again later.', 'global', { retryAfterSeconds });
    }
});

/**
 * Strict Auth Limiters
 */
export const authLoginLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 5, // 5 per minute
    keyPrefix: 'auth:login:'
});

export const authRegisterLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 5, // 5 per minute
    keyPrefix: 'auth:register:'
});

/**
 * Strict Write Limiters
 */
export const adPostLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10, // 10 per hour
    keyPrefix: 'ads:post:',
    keyGenerator: (req: Request) => {
        const userId = (req as any).user?.id || (req as any).user?._id;
        return userId ? String(userId) : req.ip || 'unknown';
    }
});

export const reportLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5, // 5 per hour
    keyPrefix: 'reports:'
});

/**
 * Strict Admin Limiter
 */
const resolvedAdminLimiterMax = (() => {
    const configured = Number(process.env.ADMIN_RATE_LIMIT_MAX);
    if (Number.isFinite(configured) && configured > 0) {
        return configured;
    }
    return process.env.NODE_ENV === 'development' ? 300 : 200;
})();

export const adminLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: resolvedAdminLimiterMax,
    keyPrefix: 'admin:user:',
    // Key by adminId so separate admins (even behind the same IP/NAT) don't
    // consume each other's quota. Falls back to IP if no admin identity yet
    // (e.g. during the very first /me or /csrf-token call).
    keyGenerator: (req: Request) => {
        const r = req as Request & { admin?: { id?: string; _id?: unknown } };
        const adminId = r.admin?.id ?? (r.admin?._id ? String(r.admin._id) : undefined);
        return adminId || req.ip || 'unknown';
    }
});

const resolvedAdminMutationLimiterMax = (() => {
    const configured = Number(process.env.ADMIN_MUTATION_RATE_LIMIT_MAX);
    if (Number.isFinite(configured) && configured > 0) {
        return configured;
    }
    return process.env.NODE_ENV === 'development' ? 300 : 100;
})();

export const adminMutationLimiter = createLimiter({
    windowMs: 5 * 60 * 1000,
    max: resolvedAdminMutationLimiterMax,
    keyPrefix: 'admin:mutation:',
    keyGenerator: (req: Request) => {
        const userId = req.user?.id || String(req.user?._id || '');
        return userId || req.ip || 'unknown';
    }
});

/**
 * Restored Pre-existing Limiters with Factory Pattern
 */
export const searchLimiter = createLimiter({
    windowMs: 1 * 60 * 1000,
    max: 100,
    keyPrefix: 'search:'
});

export const phoneRevealLimiter = [
    createLimiter({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 10,
        keyPrefix: 'phone:reveal:min:',
        keyGenerator: (req: Request) => (req.user as any)?._id?.toString() || req.ip || 'unknown'
    }),
    createLimiter({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50,
        keyPrefix: 'phone:reveal:hour:',
        keyGenerator: (req: Request) => (req.user as any)?._id?.toString() || req.ip || 'unknown'
    })
];

export const mutationLimiter = createLimiter({
    windowMs: 5 * 60 * 1000,
    max: 20,
    keyPrefix: 'mutation:'
});

export const paymentRateLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyPrefix: 'payment:'
});

export const otpIpLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 5 : 15,
    keyPrefix: 'otp:ip:'
});

/** Mobile-keyed limiter for /send-otp — isolated from verify-otp bucket */
export const otpSendLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 5 : 15,
    keyPrefix: 'otp:send:',
    keyGenerator: (req: Request) => {
        const mobile = (req.body?.mobile as string | undefined)?.trim().replace(/\D/g, '').slice(-10);
        return mobile || req.ip || 'unknown';
    }
});

/** Mobile-keyed limiter for /verify-otp — isolated from send-otp bucket */
export const otpVerifyLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 10 : 30,
    keyPrefix: 'otp:verify:',
    keyGenerator: (req: Request) => {
        const mobile = (req.body?.mobile as string | undefined)?.trim().replace(/\D/g, '').slice(-10);
        return mobile || req.ip || 'unknown';
    }
});

/* -------------------------------------------------------------------------- */
/* Chat Limiters                                                               */
/* -------------------------------------------------------------------------- */

/** Send message: 20 per minute per userId */
export const chatSendLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 20 : 200,
    keyPrefix: 'chat:send:',
    keyGenerator: (req: Request) => {
        const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id || req.ip || 'unknown';
        return String(userId);
    }
});

/** Start conversation: 10 per 10 minutes per userId */
export const chatStartLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    keyPrefix: 'chat:start:',
    keyGenerator: (req: Request) => {
        const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id || req.ip || 'unknown';
        return String(userId);
    }
});

/** Report conversation: 3 per hour per userId */
export const chatReportLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 3 : 30,
    keyPrefix: 'chat:report:',
    keyGenerator: (req: Request) => {
        const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id || req.ip || 'unknown';
        return String(userId);
    }
});
