import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '@esparex/core/config/env';
import { createLimiter, resolveRequestIp, buildHybridRateLimitKey, createRedisStore, resolveRetryAfterSeconds, respondRateLimited } from './factory';

export const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: env.NODE_ENV === 'development' ? 3000 : 100,
    store: createRedisStore('global:', 60 * 1000),
    skip: (req) => req.originalUrl === '/api/v1/health' || req.originalUrl === '/health' || req.originalUrl.includes('/webhook'),
    handler: (req: Request, res: Response) => respondRateLimited(req, res, 'Too many requests globally', 'global', { retryAfterSeconds: resolveRetryAfterSeconds(req, 60), code: 'RATE_LIMIT_EXCEEDED' }),
});

export const authLoginLimiter = createLimiter({ windowMs: 60 * 1000, max: 5, keyPrefix: 'auth:login:', keyGenerator: (req) => buildHybridRateLimitKey(req) });
export const authRegisterLimiter = createLimiter({ windowMs: 60 * 1000, max: 5, keyPrefix: 'auth:register:', keyGenerator: (req) => buildHybridRateLimitKey(req) });
export const adPostLimiter = createLimiter({ windowMs: 60 * 60 * 1000, max: 10, keyPrefix: 'ads:post:', keyGenerator: (req) => { const uid = req.user?._id ? String(req.user._id) : undefined; return buildHybridRateLimitKey(req, uid); } });
export const reportLimiter = createLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'reports:', keyGenerator: (req) => buildHybridRateLimitKey(req) });
export const adminLimiter = createLimiter({ windowMs: 60 * 1000, max: env.ADMIN_RATE_LIMIT_MAX ?? (env.NODE_ENV === 'development' ? 300 : 200), keyPrefix: 'admin:user:', keyGenerator: (req) => { const a = req.admin as any; const id = a?.id ?? a?._id?.toString?.(); return id || req.ip || 'unknown'; } });
export const adminMutationLimiter = createLimiter({ windowMs: 5 * 60 * 1000, max: env.ADMIN_MUTATION_RATE_LIMIT_MAX ?? (env.NODE_ENV === 'development' ? 300 : 100), keyPrefix: 'admin:mutation:', keyGenerator: (req) => { const uid = req.user?._id ? String(req.user._id) : ''; return uid || req.ip || 'unknown'; } });
export const searchLimiter = createLimiter({ windowMs: 1 * 60 * 1000, max: 100, keyPrefix: 'search:' });
export const phoneRevealLimiter = [
    createLimiter({ windowMs: 1 * 60 * 1000, max: 10, keyPrefix: 'phone:reveal:min:', keyGenerator: (req) => (req.user?._id ? String(req.user._id) : undefined) ?? req.ip ?? 'unknown' }),
    createLimiter({ windowMs: 60 * 60 * 1000, max: 50, keyPrefix: 'phone:reveal:hour:', keyGenerator: (req) => (req.user?._id ? String(req.user._id) : undefined) ?? req.ip ?? 'unknown' }),
];
export const mutationLimiter = createLimiter({ windowMs: 5 * 60 * 1000, max: 20, keyPrefix: 'mutation:', keyGenerator: (req) => buildHybridRateLimitKey(req) });
export const paymentRateLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'payment:', keyGenerator: (req) => buildHybridRateLimitKey(req) });
export const otpIpLimiter = createLimiter({ windowMs: 10 * 60 * 1000, max: env.NODE_ENV === 'production' ? 5 : 15, keyPrefix: 'otp:ip:', keyGenerator: (req) => resolveRequestIp(req), errorCode: 'OTP_SEND_IP_RATE_LIMIT' });
export const otpSendLimiter = createLimiter({ windowMs: 10 * 60 * 1000, max: env.NODE_ENV === 'production' ? 5 : 15, keyPrefix: 'otp:send:', errorCode: 'OTP_SEND_MOBILE_RATE_LIMIT', keyGenerator: (req) => { const m = ((req.body as { mobile?: string })?.mobile)?.trim().replace(/\D/g, '').slice(-10); return m || resolveRequestIp(req); } });
export const otpVerifyLimiter = createLimiter({ windowMs: 10 * 60 * 1000, max: env.NODE_ENV === 'production' ? 10 : 30, keyPrefix: 'otp:verify:', errorCode: 'OTP_VERIFY_RATE_LIMIT', keyGenerator: (req) => { const m = ((req.body as { mobile?: string })?.mobile)?.trim().replace(/\D/g, '').slice(-10); return m || resolveRequestIp(req); } });
export const chatSendLimiter = createLimiter({ windowMs: 60 * 1000, max: env.NODE_ENV === 'production' ? 20 : 200, keyPrefix: 'chat:send:', keyGenerator: (req) => { const uid = req.user?._id ? String(req.user._id) : undefined; return buildHybridRateLimitKey(req, uid); } });
export const chatStartLimiter = createLimiter({ windowMs: 10 * 60 * 1000, max: env.NODE_ENV === 'production' ? 10 : 100, keyPrefix: 'chat:start:', keyGenerator: (req) => { const uid = req.user?._id ? String(req.user._id) : undefined; return buildHybridRateLimitKey(req, uid); } });
export const chatReportLimiter = createLimiter({ windowMs: 60 * 60 * 1000, max: env.NODE_ENV === 'production' ? 3 : 30, keyPrefix: 'chat:report:', keyGenerator: (req) => { const uid = req.user?._id ? String(req.user._id) : undefined; return buildHybridRateLimitKey(req, uid); } });
export const contactFormLimiter = createLimiter({ windowMs: 60 * 60 * 1000, max: env.NODE_ENV === 'production' ? 3 : 30, keyPrefix: 'contact:form:', keyGenerator: (req) => resolveRequestIp(req), errorCode: 'CONTACT_FORM_RATE_LIMIT' });
export const catalogSuggestionLimiter = createLimiter({ windowMs: 24 * 60 * 60 * 1000, max: env.NODE_ENV === 'production' ? 5 : 50, keyPrefix: 'catalog:suggest:', errorCode: 'CATALOG_SUGGESTION_RATE_LIMIT', keyGenerator: (req) => { const uid = req.user?._id ? String(req.user._id) : undefined; return buildHybridRateLimitKey(req, uid); } });
