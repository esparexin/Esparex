/**
 * ESPAREX ARCHITECTURE GUARANTEE
 *
 * - Single Express server
 * - All routes mounted under /api/v1
 * - Dual DB supported (User/Admin)
 * - GeoJSON only for query models
 * - No duplicate model registration
 *
 * Any architectural changes must pass SSOT audit.
 */
import './config/loadEnv'; // MUST BE FIRST
import { initSentry } from './config/sentry'; // Initialize Sentry early
import express, { type RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import './models/registry';
import { env } from './config/env';
import { validateOtpConfiguration } from './middleware/otpGuard';

// Initialize Sentry for error tracking
initSentry();

// Initialize OTP Guard with configuration validation
validateOtpConfiguration({
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
    msg91AuthKey: env.MSG91_AUTH_KEY,
    msg91SenderId: env.MSG91_SENDER_ID,
    authBypassOtpLock: env.AUTH_BYPASS_OTP_LOCK,
    useDefaultOtp: env.USE_DEFAULT_OTP,
});

/* -------------------------------------------------------------------------- */
/* ROUTES                                                                      */
/* -------------------------------------------------------------------------- */
import catalogRoutes from './routes/catalogRoutes';
import adminRoutes, { publicRouter as adminPublicRoutes } from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';

import adRoutes from './routes/adRoutes';
import listingRoutes from './routes/listingRoutes';
import smartAlertRoutes from './routes/smartAlertRoutes';
import locationRoutes from './routes/locationRoutes';
import aiRoutes from './routes/aiRoutes';
import notificationRoutes from './routes/notificationRoutes';
import serviceRoutes from './routes/serviceRoutes';
import sparePartRoutes from './routes/sparePartRoutes';
import businessRoutes from './routes/businessRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reportRoutes from './routes/reportRoutes';
import chatRoutes from './routes/chatRoutes';



import editorialRoutes from './routes/editorialRoutes';
import contactRoutes from './routes/contactRoutes';
import rootRoutes from './routes/rootRoutes';




/* -------------------------------------------------------------------------- */
/* MIDDLEWARE                                                                  */
/* -------------------------------------------------------------------------- */
import { globalLimiter } from './middleware/rateLimiter';
import { requireDb } from './middleware/requireDb';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware';
import { enforceErrorResponseContract } from './middleware/errorResponseContract';

/* -------------------------------------------------------------------------- */
/* DB / HEALTH                                                                 */
/* -------------------------------------------------------------------------- */
import { isDbReady } from './config/db';
import logger from './utils/logger';
import { resolveCookieDomain } from './utils/cookieHelper';

/* -------------------------------------------------------------------------- */
/* SWAGGER                                                                     */
/* -------------------------------------------------------------------------- */
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

/* -------------------------------------------------------------------------- */
/* APP INIT                                                                    */
/* -------------------------------------------------------------------------- */
const app = express();
app.disable("x-powered-by");
const BODY_LIMIT = '1mb';
const ADMIN_API_V1_PREFIX = '/api/v1/admin';
const ADMIN_API_LEGACY_PREFIX = '/api/admin';
const CONTACT_API_V1_PREFIX = '/api/v1/contacts';
const CONTACT_API_LEGACY_PREFIX = '/api/v1/contact';
const LEGACY_ADMIN_API_SUNSET = 'Wed, 31 Dec 2026 23:59:59 GMT';

const buildSuccessorPath = (req: express.Request, fromPrefix: string, toPrefix: string): string => {
    const originalPath = req.originalUrl || req.url || fromPrefix;
    return originalPath.replace(new RegExp(`^${fromPrefix}(?=/|$)`), toPrefix);
};

const markLegacyAdminApiUsage = (req: express.Request, res: express.Response) => {
    const canonicalPath = buildSuccessorPath(req, ADMIN_API_LEGACY_PREFIX, ADMIN_API_V1_PREFIX);
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', LEGACY_ADMIN_API_SUNSET);
    res.setHeader('Link', `<${canonicalPath}>; rel="successor-version"`);
    res.setHeader('X-Esparex-Legacy-Admin-Api', 'true');
    res.setHeader('X-Deprecated-Endpoint', 'true');
    logger.warn(`Deprecated API route used: ${req.originalUrl}`, {
        method: req.method,
        originalUrl: req.originalUrl,
        successorPath: canonicalPath,
        aliasPrefix: ADMIN_API_LEGACY_PREFIX,
        canonicalPrefix: ADMIN_API_V1_PREFIX,
    });
};

const redirectLegacyAdminApi: RequestHandler = (req, res) => {
    markLegacyAdminApiUsage(req, res);
    const successorPath = buildSuccessorPath(req, ADMIN_API_LEGACY_PREFIX, ADMIN_API_V1_PREFIX);
    res.redirect(308, successorPath);
};

const redirectLegacyContactApi: RequestHandler = (req, res) => {
    const successorPath = buildSuccessorPath(req, CONTACT_API_LEGACY_PREFIX, CONTACT_API_V1_PREFIX);
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', LEGACY_ADMIN_API_SUNSET);
    res.setHeader('Link', `<${successorPath}>; rel="successor-version"`);
    res.setHeader('X-Deprecated-Endpoint', 'true');
    logger.warn(`Deprecated API route used: ${req.originalUrl}`, {
        method: req.method,
        originalUrl: req.originalUrl,
        successorPath,
        aliasPrefix: CONTACT_API_LEGACY_PREFIX,
        canonicalPrefix: CONTACT_API_V1_PREFIX,
    });
    res.redirect(308, successorPath);
};

// Trust proxy for rate limiting behind load balancers/proxies
app.set('trust proxy', 1);

/* -------------------------------------------------------------------------- */
/* CORS — MUST BE FIRST                                                        */
/* -------------------------------------------------------------------------- */
const normalizeOrigin = (value: string): string => value.trim().replace(/\/+$/, '').toLowerCase();

const configuredAllowedOrigins = (env.CORS_ORIGIN || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

const cookieDomain = resolveCookieDomain();
const inferredFirstPartyOrigins = cookieDomain
    ? cookieDomain.startsWith('admin.')
        ? [`https://${cookieDomain}`]
        : [`https://${cookieDomain}`, `https://admin.${cookieDomain}`]
    : [];

const allowedOrigins = new Set<string>([
    ...configuredAllowedOrigins,
    ...inferredFirstPartyOrigins.map(normalizeOrigin),
]);

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow server-to-server, curl, mobile apps
        if (!origin) return callback(null, true);

        // 🛡️ AUTOMATIC LOCAL DEV ALLOWANCE
        // In development, automatically allow localhost/127.0.0.1 or any private IP (for mobile testing)
        if (env.NODE_ENV === 'development') {
            const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);
            if (isLocal) return callback(null, true);
        }

        if (allowedOrigins.has(normalizeOrigin(origin))) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
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
        'x-request-id'        // ✅ REQUIRED FOR LOG CORRELATION
    ],
    exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After',
        'X-Correlation-ID',
        'X-Request-ID'
    ]
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // ✅ ENABLE PREFLIGHT for all routes

/* -------------------------------------------------------------------------- */
/* SECURITY                                                                    */
/* -------------------------------------------------------------------------- */
// TLS 1.2+ and Secure Cipher Suites must be enforced at the Load Balancer / Ingress layer.
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    }
}));

/* -------------------------------------------------------------------------- */
/* COMPRESSION                                                                 */
/* -------------------------------------------------------------------------- */
// Gzip compress all responses. Must come before routes and body parsers.
app.use(compression());

/* -------------------------------------------------------------------------- */
/* CORE MIDDLEWARE                                                             */
/* -------------------------------------------------------------------------- */
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());

import { apiLatencyMiddleware, memoryUsageMiddleware } from './middleware/metricsMiddleware';
app.use(apiLatencyMiddleware);
app.use(memoryUsageMiddleware);

// Sentry request handler - must be first middleware
import { sentryRequestHandler, sentryTracingHandler } from './middleware/sentryErrorHandler';
import requestIdMiddleware from './middleware/requestId';

app.use(requestIdMiddleware); // Add request ID for tracking
app.use(sentryRequestHandler); // Sentry request context
app.use(sentryTracingHandler); // Sentry performance monitoring

if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Force JSON responses everywhere
app.use((_req, res, next) => {
    res.locals.forceJson = true;
    next();
});
app.use(enforceErrorResponseContract);

/* -------------------------------------------------------------------------- */
/* SWAGGER — dev/staging only                                                  */
/* -------------------------------------------------------------------------- */
// API docs are hidden in production to prevent schema exposure.
if (env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
}

/* -------------------------------------------------------------------------- */
/* RATE LIMITING                                                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* HEALTH & ROOT (NO DB GUARD)                                                  */
/* -------------------------------------------------------------------------- */

// app.get('/health', healthCheckHandler); // Handled by rootRoutes under /api/v1
// app.get('/api/v1/health', healthCheckHandler); // Handled by rootRoutes

// Legacy namespace redirects (no parallel API handlers).
app.use(ADMIN_API_LEGACY_PREFIX, redirectLegacyAdminApi);
app.use(CONTACT_API_LEGACY_PREFIX, redirectLegacyContactApi);

app.use('/api/v1', globalLimiter);

/* -------------------------------------------------------------------------- */
/* HEALTH & ROOT (NO DB GUARD)                                                  */
/* -------------------------------------------------------------------------- */
// Health check moved to before rate limiter


app.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Esparex API is running',
        version: '1.0.0',
        isDbReady: isDbReady(),
        timestamp: new Date().toISOString()
    });
});

/* -------------------------------------------------------------------------- */
/* CSRF PROTECTION                                                             */
/* -------------------------------------------------------------------------- */
import { verifyCsrfToken } from './middleware/csrfProtection';

// CSRF token endpoint (public, no auth required)
// Handled by rootRoutes and adminRoutes

/* -------------------------------------------------------------------------- */
/* FAIL-FAST DB GATE (DATA ROUTES ONLY)                                         */
/* -------------------------------------------------------------------------- */
app.use('/api/v1', requireDb, maintenanceMiddleware);

// Apply CSRF protection to all state-changing requests
app.use('/api/v1', verifyCsrfToken);

/* -------------------------------------------------------------------------- */
/* ROUTES                                                                      */
/* -------------------------------------------------------------------------- */
app.use('/api/v1', rootRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/editorial', editorialRoutes);

// Admin
app.use('/api/v1/admin', adminPublicRoutes);
app.use('/api/v1/admin', adminRoutes);


// User
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/ads', adRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/smart-alerts', smartAlertRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/spare-part-listings', sparePartRoutes);
app.use('/api/v1/businesses', businessRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/chat', chatRoutes);

/* -------------------------------------------------------------------------- */
/* 404 & ERROR HANDLERS                                                         */
/* -------------------------------------------------------------------------- */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        method: req.method,
        path: req.path,
        status: 404
    });
});

// Sentry error handler - must be before other error handlers
import { sentryErrorHandler, customErrorHandler } from './middleware/sentryErrorHandler';
app.use(sentryErrorHandler);

// Custom error handler
app.use(customErrorHandler);

export default app;
