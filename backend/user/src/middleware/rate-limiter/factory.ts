import rateLimit, { type Store } from 'express-rate-limit';
import RedisStore, { type RedisReply } from 'rate-limit-redis';
import redisClient from '@esparex/core/config/redis';
import { Request, Response } from 'express';
import logger from '@esparex/core/utils/logger';
import { env } from '@esparex/core/config/env';
import { recordOtpAbuseSignal, recordRateLimitSignal } from '@esparex/core/utils/securityMonitoring';

const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
const shouldDisableRedisStore = (env.NODE_ENV === 'test' || isJestRuntime || !env.ALLOW_REDIS);

type RedisCallable = { call: (...args: string[]) => Promise<RedisReply> };
type RedisStoreWithPendingScripts = RedisStore & { incrementScriptSha?: Promise<string>; getScriptSha?: Promise<string> };
type RateLimitRequest = Request & { rateLimit?: { resetTime?: Date } };

const MAX_SPIKE_CACHE_SIZE = 2000;
const spikeCache = new Map<string, { count: number; resetAt: number }>();
const REDIS_READY_WAIT_MS = env.RELIABILITY_STARTUP_READINESS_TIMEOUT_MS ?? 12_000;
let redisReadyWaitInFlight: Promise<boolean> | null = null;

export const resolveRequestIp = (req: Request): string => req.ip || req.socket?.remoteAddress || 'unknown';

export const resolveUserOrMobile = (req: Request): string | undefined => {
    const userId = req.user?._id ? String(req.user._id) : undefined;
    if (userId) return userId;
    const body = req.body as { mobile?: unknown; email?: unknown } | undefined;
    if (body && typeof body.mobile === 'string') { const m = body.mobile.trim().replace(/\D/g, '').slice(-10); if (m) return m; }
    if (body && typeof body.email === 'string') { const e = body.email.trim().toLowerCase(); if (e) return e; }
    return undefined;
};

export const buildHybridRateLimitKey = (req: Request, actor?: string): string => {
    const ip = resolveRequestIp(req);
    return `${actor || resolveUserOrMobile(req) || 'anonymous'}:${ip}`;
};

export const resolveRetryAfterSeconds = (req: Request, fallbackSeconds: number): number => {
    const resetTime = (req as RateLimitRequest).rateLimit?.resetTime;
    if (resetTime instanceof Date) { const r = Math.ceil((resetTime.getTime() - Date.now()) / 1000); if (Number.isFinite(r) && r > 0) return r; }
    return fallbackSeconds;
};

const isRedisNotReadyError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    const n = error.message.toLowerCase();
    return n.includes("stream isn't writeable") || n.includes('enableofflinequeue');
};

const waitForRedisReady = async (timeoutMs: number): Promise<boolean> => {
    const status = (redisClient as unknown as { status?: string }).status;
    if (status === 'ready') return true;
    if (redisReadyWaitInFlight) return redisReadyWaitInFlight;
    redisReadyWaitInFlight = new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => { cleanup(false); }, timeoutMs);
        timer.unref?.();
        let settled = false;
        const cleanup = (result: boolean) => { if (settled) return; settled = true; clearTimeout(timer); redisClient.off('ready', onReady); redisClient.off('error', onError); redisClient.off('end', onEnd); redisReadyWaitInFlight = null; resolve(result); };
        const onReady = () => cleanup(true);
        const onError = () => undefined;
        const onEnd = () => cleanup(false);
        redisClient.on('ready', onReady); redisClient.on('error', onError); redisClient.on('end', onEnd);
        if ((redisClient as unknown as { status?: string }).status === 'ready') cleanup(true);
    });
    return redisReadyWaitInFlight;
};

const sendRedisCommandWithReadyRetry = async (...args: string[]): Promise<RedisReply> => {
    try { return await (redisClient as unknown as RedisCallable).call(...args); }
    catch (error) { if (!isRedisNotReadyError(error)) throw error; const r = await waitForRedisReady(REDIS_READY_WAIT_MS); if (!r) throw error; return (redisClient as unknown as RedisCallable).call(...args); }
};

const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60); const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const respondRateLimited = (req: Request, res: Response, error: string, bucket: string, options: { code?: string; retryAfterSeconds?: number } = {}) => {
    const key = `spike:${req.ip}:${req.originalUrl}`; const now = Date.now();
    let record = spikeCache.get(key);
    if (!record || now > record.resetAt) {
        if (!record && spikeCache.size >= MAX_SPIKE_CACHE_SIZE) { const oldestKey = spikeCache.keys().next().value; if (oldestKey !== undefined) spikeCache.delete(oldestKey); }
        record = { count: 0, resetAt: now + 60000 };
    }
    record.count += 1; spikeCache.set(key, record);
    const userIdRaw = req.user?._id;
    const userId = typeof userIdRaw === 'string' ? userIdRaw : userIdRaw && typeof userIdRaw.toString === 'function' ? userIdRaw.toString() : undefined;
    recordRateLimitSignal({ path: req.originalUrl || req.url, ip: req.ip || req.socket?.remoteAddress || 'unknown', bucket, code: options.code, userId });
    if (bucket.startsWith('otp')) { const actor = resolveUserOrMobile(req) || 'unknown'; recordOtpAbuseSignal({ mobileSuffix: actor.slice(-4).padStart(4, '*'), reason: 'rate_limited', userId }); }
    if (record.count >= 50 && Math.random() < 0.1) logger.warn(`UI RUNAWAY LOOP DETECTED: 429 spike on ${req.originalUrl} from ${req.ip}`, { ip: req.ip, url: req.originalUrl, error, count: record.count });
    if (typeof options.retryAfterSeconds === 'number') res.set('Retry-After', String(options.retryAfterSeconds));
    let errorMessage = error;
    if (typeof options.retryAfterSeconds === 'number') errorMessage = `Too many requests. Please try again in ${formatCountdown(options.retryAfterSeconds)}.`;
    return res.status(429).json({ success: false, error: errorMessage, bucket, path: req.originalUrl || req.path || 'unknown', status: 429, ...(options.retryAfterSeconds !== undefined ? { retryAfterSeconds: options.retryAfterSeconds } : {}), ...(options.retryAfterSeconds !== undefined ? { retryAfter: options.retryAfterSeconds } : {}), ...(options.code ? { code: options.code } : {}) });
};

const createEphemeralTestStore = (prefix: string, windowMs: number): Store => {
    const hits = new Map<string, { totalHits: number; resetTime: Date }>();
    return {
        localKeys: true, prefix: `test:${prefix}`,
        increment: (key: string) => { const now = Date.now(); const c = hits.get(key); if (!c || c.resetTime.getTime() <= now) { const n = { totalHits: 1, resetTime: new Date(now + windowMs) }; hits.set(key, n); return n; } const n = { totalHits: c.totalHits + 1, resetTime: c.resetTime }; hits.set(key, n); return n; },
        decrement: (key: string) => { const c = hits.get(key); if (!c) return; if (c.totalHits <= 1) { hits.delete(key); return; } hits.set(key, { totalHits: c.totalHits - 1, resetTime: c.resetTime }); },
        resetKey: (key: string) => { hits.delete(key); },
        resetAll: () => { hits.clear(); },
        shutdown: () => { hits.clear(); },
    };
};

export function createRedisStore(prefix: string, windowMs: number) {
    if (env.NODE_ENV === 'production' && shouldDisableRedisStore) throw new Error('FATAL: Redis store is required in production.');
    if (shouldDisableRedisStore) return createEphemeralTestStore(prefix, windowMs);
    const rs = new RedisStore({ sendCommand: (...args: string[]) => sendRedisCommandWithReadyRetry(...args), prefix: `rl:${prefix}` }) as RedisStoreWithPendingScripts;
    void rs.incrementScriptSha?.catch((error: unknown) => { logger.warn('[RATE_LIMITER] Redis increment script load deferred', { error: error instanceof Error ? error.message : String(error), prefix: `rl:${prefix}` }); });
    void rs.getScriptSha?.catch((error: unknown) => { logger.warn('[RATE_LIMITER] Redis get script load deferred', { error: error instanceof Error ? error.message : String(error), prefix: `rl:${prefix}` }); });
    return rs;
}

export function createLimiter({ windowMs, max, keyPrefix, keyGenerator, errorCode }: {
    windowMs: number; max: number; keyPrefix: string; keyGenerator?: (req: Request) => string; errorCode?: string;
}) {
    const code = errorCode ?? 'RATE_LIMITED';
    return rateLimit({
        windowMs, max, standardHeaders: true, legacyHeaders: false,
        store: createRedisStore(keyPrefix, windowMs),
        keyGenerator: keyGenerator,
        validate: keyGenerator ? false : { ip: false },
        handler: (req: Request, res: Response) => {
            const retryAfterSeconds = resolveRetryAfterSeconds(req, Math.ceil(windowMs / 1000));
            respondRateLimited(req, res, 'Too many requests. Please try again later.', keyPrefix.replace(':', ''), { retryAfterSeconds, code });
        }
    });
}
