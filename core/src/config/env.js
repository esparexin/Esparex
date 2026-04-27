"use strict";
/**
 * Environment Configuration & Validation
 *
 * This module validates all required environment variables at startup
 * and provides type-safe access to configuration values.
 *
 * @module config/env
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isDevelopment = exports.isProduction = exports.env = void 0;
const zod_1 = require("zod");
const bootstrapLogger_1 = __importDefault(require("@core/utils/bootstrapLogger"));
const validateEnv_1 = require("./validateEnv");
const loadEnvFiles_1 = require("./loadEnvFiles");
// Load environment variables
(0, loadEnvFiles_1.loadEnvFiles)({ cwd: process.cwd() });
/**
 * Environment variable schema with strict validation
 */
const envSchema = zod_1.z.object({
    // Node Environment
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5001').transform(Number).pipe(zod_1.z.number().min(1000).max(65535)),
    CI: zod_1.z.string().transform(val => val === 'true').default('false'),
    // Database
    MONGODB_URI: zod_1.z.string().url('Invalid MongoDB URI'),
    ADMIN_MONGODB_URI: zod_1.z.string().url('Invalid Admin MongoDB URI'),
    // Authentication
    JWT_SECRET: zod_1.z.string()
        .min(32, 'JWT_SECRET must be at least 32 characters for security')
        .regex(/^[A-Za-z0-9+/=_-]+$/, 'JWT_SECRET contains invalid characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('30d'),
    ADMIN_JWT_SECRET: zod_1.z.string().optional(),
    REFRESH_TOKEN_SECRET: zod_1.z.string().optional(),
    OTP_HASH_SECRET: zod_1.z.string().optional(),
    HMAC_SECRET: zod_1.z.string().min(32, 'HMAC_SECRET must be at least 32 characters').default('super_secret_fallback_key_for_dev_32char'),
    // CORS
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000,http://localhost:3001'),
    COOKIE_DOMAIN: zod_1.z.string().optional(),
    FRONTEND_URL: zod_1.z.string().optional(),
    FRONTEND_INTERNAL_URL: zod_1.z.string().optional(),
    ADMIN_URL: zod_1.z.string().optional(),
    ADMIN_FRONTEND_URL: zod_1.z.string().optional(),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_REGION: zod_1.z.string().optional(),
    AWS_S3_BUCKET: zod_1.z.string().optional(),
    S3_BUCKET_NAME: zod_1.z.string().optional(),
    FIREBASE_PROJECT_ID: zod_1.z.string().optional(),
    FIREBASE_CLIENT_EMAIL: zod_1.z.string().email().optional(),
    FIREBASE_PRIVATE_KEY: zod_1.z.string().optional(),
    FIREBASE_SERVICE_ACCOUNT_JSON: zod_1.z.string().optional(),
    MSG91_AUTH_KEY: zod_1.z.string().optional(),
    MSG91_SENDER_ID: zod_1.z.string().optional(),
    MSG91_TEMPLATE_ID: zod_1.z.string().optional(),
    AUTH_BYPASS_OTP_LOCK: zod_1.z.string().optional(),
    USE_DEFAULT_OTP: zod_1.z.string().transform(val => val === 'true').default('false'),
    DEV_STATIC_OTP: zod_1.z.string().default('123456'),
    PROD_RISK_OVERRIDE: zod_1.z.string().transform(val => val === 'true').default('false'),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    RAZORPAY_KEY_ID: zod_1.z.string().optional(),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().optional(),
    // External APIs (Optional)
    IPAPI_KEY: zod_1.z.string().optional(),
    // Redis (Optional)
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.string().default('6379').transform(Number).pipe(zod_1.z.number()),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().optional(),
    // Email (Optional)
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().transform(Number).pipe(zod_1.z.number()).optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASSWORD: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().email().optional(),
    // Sentry (Optional)
    SENTRY_DSN: zod_1.z.string().url().optional(),
    SENTRY_ENVIRONMENT: zod_1.z.string().optional(),
    // Backups (Optional)
    BACKUP_DIR: zod_1.z.string().default('./backups'),
    BACKUP_RETENTION_DAYS: zod_1.z.string().transform(Number).default('30'),
    BACKUP_CRON_SCHEDULE: zod_1.z.string().default('0 2 * * *'),
    ENABLE_AUTO_BACKUPS: zod_1.z.string().transform(val => val === 'true').default('false'),
    // Feature Flags
    ENABLE_SWAGGER: zod_1.z.string().transform(val => val === 'true').default('true'),
    ENABLE_RATE_LIMITING: zod_1.z.string().transform(val => val === 'true').default('true'),
    ENABLE_MAINTENANCE_MODE: zod_1.z.string().transform(val => val === 'true').default('false'),
    RUN_SCHEDULERS: zod_1.z.string().transform(val => val === 'true').default('true'),
    ENABLE_SCHEDULER: zod_1.z.string().transform(val => val === 'true').default('true'),
    PROCESS_ROLE: zod_1.z.enum(['api', 'scheduler']).default('api'),
    TZ: zod_1.z.string().default('UTC'),
    // Database boot flags
    ALLOW_BOOT_AUTO_INDEX: zod_1.z.string().transform(val => val === 'true').default('false'),
    ALLOW_DB_CONNECT: zod_1.z.string().transform(val => val === 'true').default('false'),
    // Redis extras
    REDIS_DB: zod_1.z.string().default('0').transform(Number).pipe(zod_1.z.number()),
    ALLOW_REDIS: zod_1.z.string().transform(val => val === 'true').default('false'),
    // Auth dev flags (must be blocked in production — see validateProductionEnvOrThrow)
    AUTH_LOCAL_RELAXED: zod_1.z.string().transform(val => val === 'true').default('false'),
    ALLOW_DEFAULT_ADMIN_SEED: zod_1.z.string().transform(val => val === 'true').default('false'),
    // AWS extras
    AWS_CLOUDFRONT_URL: zod_1.z.string().optional(),
    // Fraud service tuning
    FRAUD_DECISION_TIMEOUT_MS: zod_1.z.string().default('1200').transform(Number).pipe(zod_1.z.number().min(100)),
    // Sentry dev override
    SENTRY_ENABLE_DEV: zod_1.z.string().transform(val => val === 'true').default('false'),
    // Admin rate limiter overrides (optional; defaults applied in rateLimiter.ts)
    ADMIN_RATE_LIMIT_MAX: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).optional(),
    ADMIN_MUTATION_RATE_LIMIT_MAX: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).optional(),
    // Firebase dev flag
    ALLOW_FIREBASE_ADMIN: zod_1.z.string().transform(val => val === 'true').default('false'),
    // Scheduler queue dev flag
    ALLOW_SCHEDULER_QUEUE: zod_1.z.string().transform(val => val === 'true').default('false'),
    // Redis client mode (informational, used in cache stats)
    REDIS_MODE: zod_1.z.string().default('single'),
    // Cookie configuration overrides
    COOKIE_SAME_SITE: zod_1.z.enum(['strict', 'lax', 'none']).optional(),
    COOKIE_SECURE: zod_1.z.string().transform(val => val === 'true').optional(),
    // Feed tuning
    FEED_DEBUG: zod_1.z.string().transform(val => val === 'true').default('false'),
    HOME_FEED_WARM_LOCATIONS: zod_1.z.string().optional(),
    // Location search
    ATLAS_LOCATION_SEARCH_INDEX: zod_1.z.string().default('location_autocomplete'),
    // Duplicate rollout guard
    ENABLE_STRICT_DUPLICATE_INDEX: zod_1.z.string().transform(val => val === 'true').default('false'),
    DUPLICATE_ROLLOUT_MIGRATION_TAG: zod_1.z.string().optional(),
    // AI service tuning
    AI_REQUEST_TIMEOUT_MS: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).optional(),
    AI_MAX_IMAGE_BYTES: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).optional(),
    // S3 garbage collector
    DRY_RUN_S3_CLEANUP: zod_1.z.string().transform(val => val === 'true').default('false'),
    // Fraud escalation
    FRAUD_AUTO_SUSPEND_THRESHOLD: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).default('81'),
    // System monitor
    CONTAINER_MEMORY_LIMIT_MB: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).optional(),
    SYSTEM_MONITOR_WARN_RATIO: zod_1.z.string().transform(val => parseFloat(val)).pipe(zod_1.z.number().min(0.01).max(0.99)).optional(),
    // Admin session
    ADMIN_SESSION_TTL_MS: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive()).optional(),
});
/**
 * Validate environment variables and return typed config
 *
 * @throws {Error} If validation fails
 * @returns {EnvConfig} Validated configuration object
 */
function validateEnv() {
    try {
        (0, validateEnv_1.validateS3BucketEnvAliasOrThrow)(process.env);
        (0, validateEnv_1.validateS3RuntimeEnvOrThrow)(process.env);
        if ((process.env.NODE_ENV || 'development') === 'production') {
            (0, validateEnv_1.validateProductionEnvOrThrow)(process.env);
        }
        const config = envSchema.parse(process.env);
        // Additional security checks
        if (config.NODE_ENV === 'production') {
            // Production-specific validations
            if (config.JWT_SECRET.length < 64) {
                bootstrapLogger_1.default.warn('⚠️  WARNING: JWT_SECRET should be at least 64 characters in production');
            }
            if (config.JWT_SECRET.includes('change_me') || config.JWT_SECRET.includes('secret')) {
                throw new Error('🚨 SECURITY ERROR: Default JWT_SECRET detected in production! Generate a strong secret.');
            }
            if (!config.SENTRY_DSN) {
                bootstrapLogger_1.default.warn('⚠️  WARNING: SENTRY_DSN not configured. Error tracking disabled.');
            }
        }
        if (config.NODE_ENV === 'production' && !config.S3_BUCKET_NAME) {
            bootstrapLogger_1.default.warn('🚨 WARNING: S3 bucket is not configured in production!');
        }
        return config;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            bootstrapLogger_1.default.error('❌ Environment validation failed:');
            error.errors.forEach(err => {
                bootstrapLogger_1.default.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
            throw new Error('Invalid environment configuration. Check .env file.');
        }
        throw error;
    }
}
/**
 * Validated and typed environment configuration
 * Available throughout the application
 */
exports.env = validateEnv();
/**
 * Check if running in production
 */
exports.isProduction = exports.env.NODE_ENV === 'production';
/**
 * Check if running in development
 */
exports.isDevelopment = exports.env.NODE_ENV === 'development';
/**
 * Check if running in test
 */
exports.isTest = exports.env.NODE_ENV === 'test';
// Log startup configuration (non-sensitive)
if (!exports.isTest) {
    bootstrapLogger_1.default.info('✅ Environment configuration validated', {
        environment: exports.env.NODE_ENV,
        port: exports.env.PORT,
        corsOrigin: exports.env.CORS_ORIGIN,
        swagger: exports.env.ENABLE_SWAGGER ? 'enabled' : 'disabled',
        rateLimiting: exports.env.ENABLE_RATE_LIMITING ? 'enabled' : 'disabled',
        maintenanceMode: exports.env.ENABLE_MAINTENANCE_MODE ? 'ON' : 'OFF',
        schedulerJobs: exports.env.RUN_SCHEDULERS ? 'enabled' : 'disabled',
        processRole: exports.env.PROCESS_ROLE
    });
    if (exports.isDevelopment && process.env.STARTUP_VERBOSE === 'true') {
        bootstrapLogger_1.default.info('\n💡 To generate a secure JWT secret for production, run:');
        bootstrapLogger_1.default.info('   node -e "const crypto=require(\'crypto\'); process.stdout.write(crypto.randomBytes(64).toString(\'base64\'))"');
    }
}
exports.default = exports.env;
//# sourceMappingURL=env.js.map