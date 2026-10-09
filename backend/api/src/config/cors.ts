import type cors from 'cors';
import { env } from '@esparex/core';
import {
    DEFAULT_STATIC_ALLOWED_ORIGINS,
    getAllowedOriginList,
    isAllowedOrigin,
    normalizeOrigin,
} from '@esparex/core';

// ─── CORS config (P3 extract-before-split from app.ts composition root) ───
// Single owner for origin allow-list + CORS options. app.ts stays a thin composer.

const configuredOrigins = getAllowedOriginList({
    NODE_ENV: env.NODE_ENV,
    CORS_ORIGIN: env.CORS_ORIGIN,
    COOKIE_DOMAIN: env.COOKIE_DOMAIN,
    FRONTEND_URL: env.FRONTEND_URL,
    FRONTEND_INTERNAL_URL: env.FRONTEND_INTERNAL_URL,
    ADMIN_FRONTEND_URL: env.ADMIN_FRONTEND_URL,
    ADMIN_URL: env.ADMIN_URL,
});

const allowedOriginsList = [
    ...DEFAULT_STATIC_ALLOWED_ORIGINS,
    ...configuredOrigins
].map(normalizeOrigin);

export const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin, allowedOriginsList, env.NODE_ENV)) {
            return callback(null, true);
        }

        return callback(new Error('CORS blocked'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',   // ✅ REQUIRED FOR AXIOS
        'accessToken',
        'x-user-session',
        'X-Encrypted',
        'x-geo-lat',
        'x-geo-lng',
        'Idempotency-Key',
        'Cache-Control',
        'Pragma',
        'x-no-retry',         // ✅ REQUIRED FOR OTP REQUESTS
        'X-CSRF-Token',       // ✅ REQUIRED FOR CSRF PROTECTION
        'x-correlation-id',   // ✅ REQUIRED FOR DISTRIBUTED TRACING
        'x-trace-id',         // ✅ REQUIRED FOR DISTRIBUTED TRACING
        'x-request-id'        // ✅ REQUIRED FOR LOG CORRELATION
    ],
    exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After',
        'X-Correlation-ID',
        'X-Trace-ID',
        'X-Request-ID'
    ]
};
