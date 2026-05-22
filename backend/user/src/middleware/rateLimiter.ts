import rateLimit, { type Store } from 'express-rate-limit';
import RedisStore, { type RedisReply } from 'rate-limit-redis';
import redisClient from '@esparex/core/config/redis';
import { Request, Response } from 'express';
import logger from '@esparex/core/utils/logger';
import { env } from '@esparex/core/config/env';
import {
    recordOtpAbuseSignal,
    recordRateLimitSignal
} from '@esparex/core/utils/securityMonitoring';

const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
const shouldDisableRedisStore =
    (env.NODE_ENV === 'test' || isJestRuntime || !env.ALLOW_REDIS);

type RedisCallable = {
    call: (...args: string[]) => Promise<RedisReply>;
};

type RedisStoreWithPendingScripts = RedisStore & {
    incrementScriptSha?: Promise<string>;
    getScriptSha?: Promise<string>;
};

type RateLimitRequest = Request & {
    rateLimit?: {
        resetTime?: Date;
    };
};

const resolveRequestIp = (req: Request): string => req.ip || req.socket?.remoteAddress || 'unknown';

const resolveUserOrMobile = (req: Request): string | undefined => {
    const userId = req.user?._id ? String(req.user._id) : undefined;
    if (userId) return userId;

    const body = req.body as { mobile?: unknown; email?: unknown } | undefined;
    if (body && typeof body.mobile === 'string') {
        const mobile = body.mobile.trim().replace(/\D/g, '').slice(-10);
        if (mobile) return mobile;
    }
    if (body && typeof body.email === 'string') {
        const email = body.email.trim().toLowerCase();
        if (email) return email;
    }
    return undefined;
};

const buildHybridRateLimitKey = (req: Request, actor?: string): string => {
    const ip = resolveRequestIp(req);
    const principal = actor || resolveUserOrMobile(req) || 'anonymous';
    return `${principal}:${ip}`;
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
const REDIS_READY_WAIT_MS = env.RELIABILITY_STARTUP_READINESS_TIMEOUT_MS ?? 12_000;
let redisReadyWaitInFlight: Promise<boolean> | null = null;

const isRedisNotReadyError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    const normalized = error.message.toLowerCase();
    return normalized.includes("stream isn't writeable")
        || normalized.includes('enableofflinequeue');
};

const waitForRedisReady = async (timeoutMs: number): Promise<boolean> => {
    const redisStatus = (redisClient as unknown as { status?: string }).status;
    if (redisStatus === 'ready') {
        return true;
    }

    if (redisReadyWaitInFlight) {
        return redisReadyWaitInFlight;
    }

    redisReadyWaitInFlight = new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => {
            cleanup(false);
        }, timeoutMs);
        timer.unref?.();

        const onReady = () => cleanup(true);
        const onError = () => undefined;
        const onEnd = () => cleanup(false);
        let settled = false;

        function cleanup(result: boolean) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            redisClient.off('ready', onReady);
            redisClient.off('error', onError);
            redisClient.off('end', onEnd);
            redisReadyWaitInFlight = null;
            resolve(result);
        }

        redisClient.on('ready', onReady);
        redisClient.on('error', onError);
        redisClient.on('end', onEnd);

        if ((redisClient as unknown as { status?: string }).status === 'ready') {
            cleanup(true);
        }
    });

    return redisReadyWaitInFlight;
};

const sendRedisCommandWithReadyRetry = async (...args: string[]): Promise<RedisReply> => {
    try {
        return await (redisClient as unknown as RedisCallable).call(...args);
    } catch (error) {
        if (!isRedisNotReadyError(error)) {
            throw error;
        }

        const recovered = await waitForRedisReady(REDIS_READY_WAIT_MS);
        if (!recovered) {
            throw error;
        }

        return (redisClient as unknown as RedisCallable).call(...args);
    }
};

const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

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
    const userIdRaw = req.user?._id;
    const userId = typeof userIdRaw === 'string'
        ? userIdRaw
        : userIdRaw && typeof userIdRaw.toString === 'function'
            ? userIdRaw.toString()
            : undefined;

    recordRateLimitSignal({
        path: req.originalUrl || req.url,
        ip: req.ip || req.socket?.remoteAddress || 'unknown',
        bucket,
        code: options.code,
        userId,
    });

    if (bucket.startsWith('otp')) {
        const actor = resolveUserOrMobile(req) || 'unknown';
        recordOtpAbuseSignal({
            mobileSuffix: actor.slice(-4).padStart(4, '*'),
            reason: 'rate_limited',
            userId,
        });
    }


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

    let errorMessage = error;
    if (typeof options.retryAfterSeconds === 'number') {
        errorMessage = `Too many requests. Please try again in ${formatCountdown(options.retryAfterSeconds)}.`;
    }

    return res.status(429).json({
        success: false,
        error: errorMessage,
        bucket,
        path: req.originalUrl || req.path || 'unknown',
        status: 429,
        ...(options.retryAfterSeconds !== undefined ? { retryAfterSeconds: options.retryAfterSeconds } : {}),
        ...(options.retryAfterSeconds !== undefined ? { retryAfter: options.retryAfterSeconds } : {}),
        ...(options.code ? { code: options.code } : {})
    });
};

const createRedisStore = (prefix: string, windowMs: number) => {
    if (env.NODE_ENV === 'production' && shouldDisableRedisStore) {
        throw new Error('FATAL: Redis store is required in production. In-memory fallback is strictly banned by SSOT.');
    }

    if (shouldDisableRedisStore) {
        return createEphemeralTestStore(prefix, windowMs);
    }

    const redisStore = new RedisStore({
        sendCommand: (...args: string[]) => sendRedisCommandWithReadyRetry(...args),
        prefix: `rl:${prefix}`,
    }) as RedisStoreWithPendingScripts;

    // Prevent startup-time unhandled promise rejections when Redis scripts load
    // before the underlying socket transitions to ready.
    void redisStore.incrementScriptSha?.catch((error: unknown) => {
        logger.warn('[RATE_LIMITER] Initial Redis increment script load deferred', {
            error: error instanceof Error ? error.message : String(error),
            prefix: `rl:${prefix}`,
        });
    });
    void redisStore.getScriptSha?.catch((error: unknown) => {
        logger.warn('[RATE_LIMITER] Initial Redis get script load deferred', {
            error: error instanceof Error ? error.message : String(error),
            prefix: `rl:${prefix}`,
        });
    });

    return redisStore;
};

const createEphemeralTestStore = (prefix: string, windowMs: number): Store => {
    const hits = new Map<string, { totalHits: number; resetTime: Date }>();

    return {
        localKeys: true,
        prefix: `test:${prefix}`,
        increment: (key: string) => {
            const now = Date.now();
            const current = hits.get(key);

            if (!current || current.resetTime.getTime() <= now) {
                const next = {
                    totalHits: 1,
                    resetTime: new Date(now + windowMs),
                };
                hits.set(key, next);
                return next;
            }

            const next = {
                totalHits: current.totalHits + 1,
                resetTime: current.resetTime,
            };
            hits.set(key, next);
            return next;
        },
        decrement: (key: string) => {
            const current = hits.get(key);
            if (!current) return;
            if (current.totalHits <= 1) {
                hits.delete(key);
                return;
            }
            hits.set(key, {
                totalHits: current.totalHits - 1,
                resetTime: current.resetTime,
            });
        },
        resetKey: (key: string) => {
            hits.delete(key);
        },
        resetAll: () => {
            hits.clear();
        },
        shutdown: () => {
            hits.clear();
        },
    };
};

// ============================================================================
// SSOT RATE LIMITERS (HYBRID ISOLATION MODEL)
// ============================================================================

export function createLimiter({
    windowMs,
    max,
    keyPrefix,
    keyGenerator,
    errorCode
}: {
    windowMs: number;
    max: number;
    keyPrefix: string;
    keyGenerator?: (req: Request) => string;
    /** Machine-readable code included in the 429 response body. Defaults to RATE_LIMITED. */
    errorCode?: string;
}) {
    const code = errorCode ?? 'RATE_LIMITED';
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        store: createRedisStore(keyPrefix, windowMs),
        keyGenerator: keyGenerator,
        validate: keyGenerator ? false : { ip: false },
        handler: (req: Request, res: Response) => {
            const retryAfterSeconds = resolveRetryAfterSeconds(req, Math.ceil(windowMs / 1000));
            respondRateLimited(req, res, 'Too many requests. Please try again later.', keyPrefix.replace(':', ''), { retryAfterSeconds, code });
        }
    });
}

/**
 * Global Baseline Limit
 * 100 requests per minute per IP
 */
export const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: env.NODE_ENV === 'development' ? 3000 : 100,
    store: createRedisStore('global:', 60 * 1000),
    skip: (req) => {
        return req.originalUrl === '/api/v1/health' || req.originalUrl === '/health' || req.originalUrl.includes('/webhook');
    },
    handler: (req: Request, res: Response) => {
        const retryAfterSeconds = resolveRetryAfterSeconds(req, 60);
        respondRateLimited(req, res, 'Too many requests globally, please try again later.', 'global', { retryAfterSeconds, code: 'RATE_LIMIT_EXCEEDED' });
    }
});

/**
 * Strict Auth Limiters
 */
export const authLoginLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 5, // 5 per minute
    keyPrefix: 'auth:login:',
    keyGenerator: (req: Request) => buildHybridRateLimitKey(req)
});

export const authRegisterLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 5, // 5 per minute
    keyPrefix: 'auth:register:',
    keyGenerator: (req: Request) => buildHybridRateLimitKey(req)
});

/**
 * Strict Write Limiters
 */
export const adPostLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10, // 10 per hour
    keyPrefix: 'ads:post:',
    keyGenerator: (req: Request) => {
        const userId = req.user?._id ? String(req.user._id) : undefined;
        return buildHybridRateLimitKey(req, userId);
    }
});

export const reportLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5, // 5 per hour
    keyPrefix: 'reports:',
    keyGenerator: (req: Request) => buildHybridRateLimitKey(req)
});

/**
 * Strict Admin Limiter
 */
const resolvedAdminLimiterMax = env.ADMIN_RATE_LIMIT_MAX ?? (env.NODE_ENV === 'development' ? 300 : 200);

export const adminLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: resolvedAdminLimiterMax,
    keyPrefix: 'admin:user:',
    // Key by adminId so separate admins (even behind the same IP/NAT) don't
    // consume each other's quota. Falls back to IP if no admin identity yet
    // (e.g. during the very first /me or /csrf-token call).
    keyGenerator: (req: Request) => {
        const admin = req.admin as unknown as { id?: string; _id?: { toString(): string } | string } | undefined | undefined;
        const adminId = admin?.id ?? admin?._id?.toString();
        return adminId || req.ip || 'unknown';
    }
});

const resolvedAdminMutationLimiterMax = env.ADMIN_MUTATION_RATE_LIMIT_MAX ?? (env.NODE_ENV === 'development' ? 300 : 100);

export const adminMutationLimiter = createLimiter({
    windowMs: 5 * 60 * 1000,
    max: resolvedAdminMutationLimiterMax,
    keyPrefix: 'admin:mutation:',
    keyGenerator: (req: Request) => {
        const userId = req.user?._id ? String(req.user._id) : '';
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
        keyGenerator: (req: Request) => ((req.user)?._id ? String((req.user)?._id) : undefined) ?? req.ip ?? 'unknown'
    }),
    createLimiter({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50,
        keyPrefix: 'phone:reveal:hour:',
        keyGenerator: (req: Request) => ((req.user)?._id ? String((req.user)?._id) : undefined) ?? req.ip ?? 'unknown'
    })
];

export const mutationLimiter = createLimiter({
    windowMs: 5 * 60 * 1000,
    max: 20,
    keyPrefix: 'mutation:',
    keyGenerator: (req: Request) => buildHybridRateLimitKey(req)
});

export const paymentRateLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyPrefix: 'payment:',
    keyGenerator: (req: Request) => buildHybridRateLimitKey(req)
});

export const otpIpLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 5 : 15,
    keyPrefix: 'otp:ip:',
    keyGenerator: (req: Request) => resolveRequestIp(req),
    errorCode: 'OTP_SEND_IP_RATE_LIMIT'
});

/** Mobile-keyed limiter for /send-otp — isolated from verify-otp bucket */
export const otpSendLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 5 : 15,
    keyPrefix: 'otp:send:',
    errorCode: 'OTP_SEND_MOBILE_RATE_LIMIT',
    keyGenerator: (req: Request) => {
        const mobile = ((req.body as { mobile?: string })?.mobile)?.trim().replace(/\D/g, '').slice(-10);
        return mobile || resolveRequestIp(req);
    }
});

/** Mobile-keyed limiter for /verify-otp — isolated from send-otp bucket */
export const otpVerifyLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 10 : 30,
    keyPrefix: 'otp:verify:',
    errorCode: 'OTP_VERIFY_RATE_LIMIT',
    keyGenerator: (req: Request) => {
        const mobile = ((req.body as { mobile?: string })?.mobile)?.trim().replace(/\D/g, '').slice(-10);
        return mobile || resolveRequestIp(req);
    }
});

/* -------------------------------------------------------------------------- */
/* Chat Limiters                                                               */
/* -------------------------------------------------------------------------- */

/** Send message: 20 per minute per userId */
export const chatSendLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: env.NODE_ENV === 'production' ? 20 : 200,
    keyPrefix: 'chat:send:',
    keyGenerator: (req: Request) => {
        const userId = (req.user)?._id ? String((req.user)?._id) : undefined;
        return buildHybridRateLimitKey(req, userId);
    }
});

/** Start conversation: 10 per 10 minutes per userId */
export const chatStartLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 10 : 100,
    keyPrefix: 'chat:start:',
    keyGenerator: (req: Request) => {
        const userId = (req.user)?._id ? String((req.user)?._id) : undefined;
        return buildHybridRateLimitKey(req, userId);
    }
});

/** Report conversation: 3 per hour per userId */
export const chatReportLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 3 : 30,
    keyPrefix: 'chat:report:',
    keyGenerator: (req: Request) => {
        const userId = (req.user)?._id ? String((req.user)?._id) : undefined;
        return buildHybridRateLimitKey(req, userId);
    }
});

/**
 * Contact Form Limiter
 *
 * Stricter than the generic mutationLimiter because the contact form is:
 *  - Publicly accessible (no auth required)
 *  - A common spam/flood vector
 *  - Never legitimately submitted more than a few times per hour
 *
 * 3 submissions per hour per IP. Uses an isolated Redis key prefix so it
 * does not consume quota from other mutation buckets.
 */
export const contactFormLimiter = createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: env.NODE_ENV === 'production' ? 3 : 30,
    keyPrefix: 'contact:form:',
    keyGenerator: (req: Request) => resolveRequestIp(req),
    errorCode: 'CONTACT_FORM_RATE_LIMIT',
});

