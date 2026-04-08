/**
 * Environment Configuration & Validation
 * 
 * This module validates all required environment variables at startup
 * and provides type-safe access to configuration values.
 * 
 * @module config/env
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import bootstrapLogger from '../utils/bootstrapLogger';
import {
    validateProductionEnvOrThrow,
    validateS3BucketEnvAliasOrThrow,
    validateS3RuntimeEnvOrThrow
} from './validateEnv';

// Load environment variables
dotenv.config({ quiet: true });

/**
 * Environment variable schema with strict validation
 */
const envSchema = z.object({
    // Node Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('5001').transform(Number).pipe(z.number().min(1000).max(65535)),
    CI: z.string().transform(val => val === 'true').default('false'),

    // Database
    MONGODB_URI: z.string().url('Invalid MongoDB URI'),
    ADMIN_MONGODB_URI: z.string().url('Invalid Admin MongoDB URI'),

    // Authentication
    JWT_SECRET: z.string()
        .min(32, 'JWT_SECRET must be at least 32 characters for security')
        .regex(/^[A-Za-z0-9+/=_-]+$/, 'JWT_SECRET contains invalid characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    ADMIN_JWT_SECRET: z.string().optional(),
    REFRESH_TOKEN_SECRET: z.string().optional(),
    OTP_HASH_SECRET: z.string().optional(),

    // CORS
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    COOKIE_DOMAIN: z.string().optional(),

    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    S3_BUCKET_NAME: z.string().optional(),

    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),

    MSG91_AUTH_KEY: z.string().optional(),
    MSG91_SENDER_ID: z.string().optional(),
    MSG91_TEMPLATE_ID: z.string().optional(),
    AUTH_BYPASS_OTP_LOCK: z.string().optional(),
    USE_DEFAULT_OTP: z.string().transform(val => val === 'true').default('false'),
    DEV_STATIC_OTP: z.string().default('123456'),

    GEMINI_API_KEY: z.string().optional(),

    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

    // External APIs (Optional)
    IPAPI_KEY: z.string().optional(),

    // Redis (Optional)
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().default('6379').transform(Number).pipe(z.number()),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_URL: z.string().optional(),

    // Email (Optional)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().transform(Number).pipe(z.number()).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),

    // Sentry (Optional)
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),

    // Backups (Optional)
    BACKUP_DIR: z.string().default('./backups'),
    BACKUP_RETENTION_DAYS: z.string().transform(Number).default('30'),
    BACKUP_CRON_SCHEDULE: z.string().default('0 2 * * *'),
    ENABLE_AUTO_BACKUPS: z.string().transform(val => val === 'true').default('false'),

    // Feature Flags
    ENABLE_SWAGGER: z.string().transform(val => val === 'true').default('true'),
    ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
    ENABLE_MAINTENANCE_MODE: z.string().transform(val => val === 'true').default('false'),
    RUN_SCHEDULERS: z.string().transform(val => val === 'true').default('true'),
    ENABLE_SCHEDULER: z.string().transform(val => val === 'true').default('true'),
    PROCESS_ROLE: z.enum(['api', 'scheduler']).default('api'),
    TZ: z.string().default('UTC'),
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
        const config = envSchema.parse(process.env);

        // Additional security checks
        if (config.NODE_ENV === 'production') {
            validateProductionEnvOrThrow(process.env);

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
