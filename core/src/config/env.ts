/**
 * Environment Configuration & Validation
 * 
 * This module validates all required environment variables at startup
 * and provides type-safe access to configuration values.
 * 
 * @module config/env
 */

import { z } from 'zod';
import bootstrapLogger from '../utils/bootstrapLogger';
import {
    validateProductionSafetyFlagsOrThrow,
    validateProductionEnvOrThrow,
    validateRuntimeCriticalEnvOrThrow,
    validateS3BucketEnvAliasOrThrow,
    validateS3RuntimeEnvOrThrow
} from './validateEnv';
import { loadEnvFiles } from './loadEnvFiles';

// Load environment variables
loadEnvFiles({ cwd: process.cwd() });

/**
 * Environment variable schema with strict validation
 */
const envSchema = z.object({
    // 1. Runtime
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('5001').transform(Number).pipe(z.number().min(1000).max(65535)),
    CI: z.string().transform(val => val === 'true').default('false'),
    TZ: z.string().default('UTC'),
    PROCESS_ROLE: z.enum(['api', 'scheduler', 'worker']).default('api'),

    // 2. Database
    MONGODB_URI: z.string().url('Invalid MONGODB_URI'),
    ADMIN_MONGODB_URI: z.string().url('Invalid ADMIN_MONGODB_URI'),
    ALLOW_BOOT_AUTO_INDEX: z.string().transform(val => val === 'true').default('false'),
    ALLOW_DB_CONNECT: z.string().transform(val => val === 'true').default('false'),

    // 3. Redis
    ALLOW_REDIS: z.string().transform(val => val === 'true').default('false'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().default('6379').transform(Number).pipe(z.number()),
    REDIS_USERNAME: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_URL: z.string().optional(),
    REDIS_DB: z.string().default('0').transform(Number).pipe(z.number()),
    REDIS_MODE: z.string().default('single'),

    // 4. Authentication
    JWT_SECRET: z.string()
        .min(32, 'JWT_SECRET must be at least 32 characters')
        .regex(/^[A-Za-z0-9+/=_-]+$/, 'JWT_SECRET contains invalid characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    ADMIN_JWT_SECRET: z.string().optional(),
    ADMIN_SESSION_TTL_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    AUTH_LOCAL_RELAXED: z.string().transform(val => val === 'true').default('false'),
    ALLOW_DEFAULT_ADMIN_SEED: z.string().transform(val => val === 'true').default('false'),

    // 5. OTP & SMS
    OTP_HASH_SECRET: z.string().optional(),
    HMAC_SECRET: z.string().min(32, 'HMAC_SECRET must be at least 32 characters').default('super_secret_fallback_key_for_dev_32char'),
    MSG91_AUTH_KEY: z.string().optional(),
    MSG91_SENDER_ID: z.string().optional(),
    MSG91_TEMPLATE_ID: z.string().optional(),
    AUTH_BYPASS_OTP_LOCK: z.string().optional(),
    USE_DEFAULT_OTP: z.string().transform(val => val === 'true').default('false'),
    DEV_STATIC_OTP: z.string().default('123456'),

    // 6. Cookies & Security
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).optional(),
    COOKIE_SECURE: z.string().transform(val => val === 'true').optional(),

    // 7. CORS & URLs
    CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
    FRONTEND_URL: z.string().optional(),
    FRONTEND_INTERNAL_URL: z.string().optional(),
    ADMIN_URL: z.string().optional(),
    ADMIN_FRONTEND_URL: z.string().optional(),

    // 8. Upload Storage (S3)
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    S3_BUCKET_NAME: z.string().optional(),
    AWS_CLOUDFRONT_URL: z.string().optional(),
    DRY_RUN_S3_CLEANUP: z.string().transform(val => val === 'true').default('false'),

    // 9. Payments
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

    // 10. Notifications & Firebase
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
    ALLOW_FIREBASE_ADMIN: z.string().transform(val => val === 'true').default('false'),

    // 11. AI & Risk Scoring
    AI_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
    GEMINI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().optional(),
    GEMINI_MODEL: z.string().optional(),
    AI_REQUEST_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    AI_MAX_IMAGE_BYTES: z.string().transform(Number).pipe(z.number().positive()).optional(),
    FRAUD_DECISION_TIMEOUT_MS: z.string().default('1200').transform(Number).pipe(z.number().min(100)),
    FRAUD_AUTO_SUSPEND_THRESHOLD: z.string().transform(Number).pipe(z.number().positive()).default('81'),
    PROD_RISK_OVERRIDE: z.string().transform(val => val === 'true').default('false'),

    // 12. Search & Feed
    ATLAS_LOCATION_SEARCH_INDEX: z.string().default('location_autocomplete'),
    FEED_DEBUG: z.string().transform(val => val === 'true').default('false'),
    HOME_FEED_WARM_LOCATIONS: z.string().optional(),
    ENABLE_STRICT_DUPLICATE_INDEX: z.string().transform(val => val === 'true').default('false'),
    DUPLICATE_ROLLOUT_MIGRATION_TAG: z.string().optional(),

    // 13. Sentry
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),
    SENTRY_ENABLE_DEV: z.string().transform(val => val === 'true').default('false'),

    // 14. Email
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().transform(Number).pipe(z.number()).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),

    // 15. Scheduler & Workers
    RUN_SCHEDULERS: z.string().transform(val => val === 'true').default('false'),
    ENABLE_SCHEDULER: z.string().transform(val => val === 'true').default('false'),
    ALLOW_SCHEDULER_QUEUE: z.string().transform(val => val === 'true').default('false'),

    // 16. Reliability & Monitoring
    RELIABILITY_ALERTS_ENABLED: z.string().transform(val => val !== 'false').default('true'),
    RELIABILITY_SLACK_WEBHOOK_URL: z.string().optional(),
    RELIABILITY_ALERT_EMAIL_TO: z.string().optional(),
    RELIABILITY_ALERT_THROTTLE_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_API_LATENCY_THRESHOLD_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_HIGH_ERROR_RATE_THRESHOLD: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0).max(1)).optional(),
    RELIABILITY_ERROR_RATE_MIN_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_QUEUE_DELAY_THRESHOLD_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_DB_RESPONSE_THRESHOLD_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_SLO_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_SLO_API_MIN_SAMPLES: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_SLO_DB_MIN_SAMPLES: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_SLO_QUEUE_MIN_SAMPLES: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_SLO_RECOVERY_HYSTERESIS_RATIO: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0.5).max(1)).optional(),
    RELIABILITY_QUEUE_FAILURE_SPIKE_THRESHOLD: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_QUEUE_FAILURE_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_API_USAGE_SPIKE_THRESHOLD: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_API_USAGE_SPIKE_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_RATE_LIMIT_ABUSE_THRESHOLD: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_REPEATED_FAILURE_THRESHOLD: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_REPEATED_FAILURE_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_WORKER_AUTO_RECOVERY_DELAY_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_WORKER_AUTO_RECOVERY_MAX_ATTEMPTS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_STARTUP_READINESS_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
    RELIABILITY_REDIS_RECOVERY_PROBE_TIMEOUT_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),

    // 17. System Monitoring
    CONTAINER_MEMORY_LIMIT_MB: z.string().transform(Number).pipe(z.number().positive()).optional(),
    SYSTEM_MONITOR_WARN_RATIO: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0.01).max(0.99)).optional(),

    // 18. Feature Flags
    ENABLE_SWAGGER: z.string().transform(val => val === 'true').default('true'),
    ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
    ENABLE_MAINTENANCE_MODE: z.string().transform(val => val === 'true').default('false'),

    // 19. Backups
    BACKUP_DIR: z.string().default('./backups'),
    BACKUP_RETENTION_DAYS: z.string().transform(Number).default('30'),
    BACKUP_CRON_SCHEDULE: z.string().default('0 2 * * *'),
    ENABLE_AUTO_BACKUPS: z.string().transform(val => val === 'true').default('false'),

    // 20. Other (Optional)
    IPAPI_KEY: z.string().optional(),
    ADMIN_RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().positive()).optional(),
    ADMIN_MUTATION_RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().positive()).optional(),
});

/**
 * Validated environment configuration
 */
type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables and return typed config
 * 
 * @throws {Error} If validation fails
 * @returns {EnvConfig} Validated configuration object
 */
function validateEnv(): EnvConfig {
    try {
        validateS3BucketEnvAliasOrThrow(process.env);
        validateS3RuntimeEnvOrThrow(process.env);
        validateRuntimeCriticalEnvOrThrow(process.env);
        if ((process.env.NODE_ENV || 'development') === 'production') {
            validateProductionEnvOrThrow(process.env);
            validateProductionSafetyFlagsOrThrow(process.env);
        }
        const config = envSchema.parse(process.env);

        // Additional security checks
        if (config.NODE_ENV === 'production') {
            // Production-specific validations
            if (config.JWT_SECRET.length < 64) {
                bootstrapLogger.warn('⚠️  WARNING: JWT_SECRET should be at least 64 characters in production');
            }

            if (config.JWT_SECRET.includes('change_me') || config.JWT_SECRET.includes('secret')) {
                throw new Error('🚨 SECURITY ERROR: Default JWT_SECRET detected in production! Generate a strong secret.');
            }

            if (!config.SENTRY_DSN) {
                bootstrapLogger.warn('⚠️  WARNING: SENTRY_DSN not configured. Error tracking disabled.');
            }
        }

        if (config.NODE_ENV === 'production' && !config.S3_BUCKET_NAME) {
            bootstrapLogger.warn('🚨 WARNING: S3 bucket is not configured in production!');
        }
        return config;
    } catch (error) {
        if (error instanceof z.ZodError) {
            bootstrapLogger.error('❌ Environment validation failed:');
            error.errors.forEach(err => {
                bootstrapLogger.error(`  - ${err.path.join('.')}: ${err.message}`);
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
export const env = validateEnv();

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test';

// Log startup configuration (non-sensitive)
if (!isTest) {
    bootstrapLogger.info('✅ Environment configuration validated', {
        environment: env.NODE_ENV,
        port: env.PORT,
        corsOrigin: env.CORS_ORIGIN,
        swagger: env.ENABLE_SWAGGER ? 'enabled' : 'disabled',
        rateLimiting: env.ENABLE_RATE_LIMITING ? 'enabled' : 'disabled',
        maintenanceMode: env.ENABLE_MAINTENANCE_MODE ? 'ON' : 'OFF',
        schedulerJobs: env.RUN_SCHEDULERS ? 'enabled' : 'disabled',
        processRole: env.PROCESS_ROLE
    });

    if (isDevelopment && process.env.STARTUP_VERBOSE === 'true') {
        bootstrapLogger.info('\n💡 To generate a secure JWT secret for production, run:');
        bootstrapLogger.info('   node -e "const crypto=require(\'crypto\'); process.stdout.write(crypto.randomBytes(64).toString(\'base64\'))"');
    }
}

export default env;
