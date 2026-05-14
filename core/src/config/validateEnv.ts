/* global NodeJS */
import bootstrapLogger from '../utils/bootstrapLogger';
import { inferCookieDomainFromEnv, requiresSharedCookieDomain } from '../utils/originConfig';
import { isLocalRedisHost, resolveRedisConfig } from './redisConfig';

const REQUIRED_PRODUCTION_ENV_VARS = [
    'RAZORPAY_WEBHOOK_SECRET',
    'OTP_HASH_SECRET',
    'JWT_SECRET',
    'REDIS_URL',
    'MONGODB_URI',
    'ADMIN_MONGODB_URI',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
] as const;

const REQUIRED_RUNTIME_CRITICAL_ENV_VARS = [
    'MONGODB_URI',
    'REDIS_URL',
    'JWT_SECRET',
] as const;

const REQUIRED_S3_RUNTIME_ENV_VARS = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'S3_BUCKET_NAME',
] as const;

const AWS_ACCESS_KEY_ID_PATTERN = /^(AKIA|ASIA|AIDA|AROA)[A-Z0-9]{16}$/;
const AWS_SECRET_ACCESS_KEY_PATTERN = /^[A-Za-z0-9/+=]{40}$/;

const BLOCKED_PRODUCTION_FLAGS = [
    'AUTH_LOCAL_RELAXED',
    'ALLOW_DEFAULT_ADMIN_SEED',
    'ALLOW_DB_CONNECT',
    'ALLOW_REDIS',
    'ALLOW_SCHEDULER_QUEUE',
    'ALLOW_BOOT_AUTO_INDEX',
    'SENTRY_ENABLE_DEV',
    'FEED_DEBUG',
] as const;

const hasValue = (value: string | undefined): boolean =>
    typeof value === 'string' && value.trim().length > 0;

const isEnabledFlag = (value: string | undefined): boolean =>
    (value || '').trim().toLowerCase() === 'true';

export function validateS3BucketEnvAliasOrThrow(sourceEnv: NodeJS.ProcessEnv): void {
    const legacyBucket = sourceEnv.AWS_S3_BUCKET?.trim();
    const canonicalBucket = sourceEnv.S3_BUCKET_NAME?.trim();

    if (legacyBucket && !canonicalBucket) {
        bootstrapLogger.warn(
            '⚠️  DEPRECATION: AWS_S3_BUCKET is deprecated. Please rename it to S3_BUCKET_NAME in your environment configuration.'
        );
        sourceEnv.S3_BUCKET_NAME = legacyBucket;
        return;
    }

    if (legacyBucket && canonicalBucket && legacyBucket !== canonicalBucket) {
        bootstrapLogger.info(
            'ℹ️  S3 CONFIG: Both AWS_S3_BUCKET and S3_BUCKET_NAME are set. Using S3_BUCKET_NAME.'
        );
    }
}

export function validateS3RuntimeEnvOrThrow(sourceEnv: NodeJS.ProcessEnv): void {
    const nodeEnv = sourceEnv.NODE_ENV || 'development';

    if (nodeEnv === 'test') {
        return;
    }

    const anyS3RuntimeVarProvided = REQUIRED_S3_RUNTIME_ENV_VARS.some((key) => hasValue(sourceEnv[key]));
    const shouldEnforceRuntimeS3Validation = nodeEnv === 'production' || anyS3RuntimeVarProvided;

    if (!shouldEnforceRuntimeS3Validation) {
        return;
    }

    const missingVars = REQUIRED_S3_RUNTIME_ENV_VARS.filter((key) => !hasValue(sourceEnv[key]));
    if (missingVars.length > 0) {
        throw new Error(
            `Missing required S3 environment variables: ${missingVars.join(', ')}`
        );
    }

    const accessKeyId = (sourceEnv.AWS_ACCESS_KEY_ID || '').trim();
    const secretAccessKey = (sourceEnv.AWS_SECRET_ACCESS_KEY || '').trim();

    const accessKeyLooksValid = AWS_ACCESS_KEY_ID_PATTERN.test(accessKeyId);
    const secretKeyLooksValid = AWS_SECRET_ACCESS_KEY_PATTERN.test(secretAccessKey);

    if (!accessKeyLooksValid && AWS_ACCESS_KEY_ID_PATTERN.test(secretAccessKey) && AWS_SECRET_ACCESS_KEY_PATTERN.test(accessKeyId)) {
        throw new Error(
            'Invalid S3 configuration: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY appear swapped.'
        );
    }

    if (!accessKeyLooksValid) {
        throw new Error(
            'Invalid S3 configuration: AWS_ACCESS_KEY_ID format is invalid.'
        );
    }

    if (!secretKeyLooksValid) {
        throw new Error(
            'Invalid S3 configuration: AWS_SECRET_ACCESS_KEY format is invalid.'
        );
    }
}

export function validateRuntimeCriticalEnvOrThrow(sourceEnv: NodeJS.ProcessEnv): void {
    if ((sourceEnv.NODE_ENV || 'development') === 'test') {
        return;
    }

    const missingVars = REQUIRED_RUNTIME_CRITICAL_ENV_VARS.filter((key) => !hasValue(sourceEnv[key]));
    if (missingVars.length > 0) {
        throw new Error(
            `Missing required runtime environment variables: ${missingVars.join(', ')}`
        );
    }
}

const hasWildcardCorsOrigin = (corsOrigin: string): boolean =>
    corsOrigin
        .split(',')
        .map(origin => origin.trim())
        .some(origin => origin === '*' || origin.includes('*'));

export function validateProductionEnvOrThrow(sourceEnv: NodeJS.ProcessEnv): void {
    validateS3BucketEnvAliasOrThrow(sourceEnv);

    if (sourceEnv.NODE_ENV !== 'production') {
        return;
    }

    const missingVars = REQUIRED_PRODUCTION_ENV_VARS.filter((key) => !hasValue(sourceEnv[key]));
    if (missingVars.length > 0) {
        throw new Error(
            `Missing required production environment variables: ${missingVars.join(', ')}`
        );
    }

    const mongodbUri = sourceEnv.MONGODB_URI || '';
    if (mongodbUri.includes('localhost') || mongodbUri.includes('127.0.0.1')) {
        throw new Error('MONGODB_URI cannot use localhost in production');
    }

    const adminMongodbUri = sourceEnv.ADMIN_MONGODB_URI || '';
    if (adminMongodbUri.includes('localhost') || adminMongodbUri.includes('127.0.0.1')) {
        throw new Error('ADMIN_MONGODB_URI cannot use localhost in production');
    }

    const redisConfig = resolveRedisConfig({
        REDIS_URL: sourceEnv.REDIS_URL,
        REDIS_HOST: sourceEnv.REDIS_HOST,
        REDIS_PORT: sourceEnv.REDIS_PORT,
        REDIS_DB: sourceEnv.REDIS_DB,
        REDIS_USERNAME: sourceEnv.REDIS_USERNAME,
        REDIS_PASSWORD: sourceEnv.REDIS_PASSWORD,
    });

    if (isLocalRedisHost(redisConfig.host)) {
        throw new Error('REDIS_URL/REDIS_HOST cannot use localhost in production');
    }

    if (!redisConfig.username) {
        throw new Error('Redis ACL username is required in production');
    }

    const corsOrigin = sourceEnv.CORS_ORIGIN;
    if (!hasValue(corsOrigin)) {
        throw new Error('CORS_ORIGIN must be defined in production');
    }

    if (hasWildcardCorsOrigin(corsOrigin as string)) {
        throw new Error('CORS_ORIGIN cannot include wildcard (*) in production');
    }

    if (corsOrigin?.includes('localhost') || corsOrigin?.includes('127.0.0.1')) {
        throw new Error('CORS_ORIGIN cannot use localhost in production');
    }

    const runtimeOriginEnv = {
        NODE_ENV: sourceEnv.NODE_ENV,
        CORS_ORIGIN: sourceEnv.CORS_ORIGIN,
        COOKIE_DOMAIN: sourceEnv.COOKIE_DOMAIN,
        FRONTEND_URL: sourceEnv.FRONTEND_URL,
        FRONTEND_INTERNAL_URL: sourceEnv.FRONTEND_INTERNAL_URL,
        ADMIN_FRONTEND_URL: sourceEnv.ADMIN_FRONTEND_URL,
        ADMIN_URL: sourceEnv.ADMIN_URL,
    };

    if (!sourceEnv.COOKIE_DOMAIN?.trim()) {
        const inferredCookieDomain = inferCookieDomainFromEnv(runtimeOriginEnv);
        if (inferredCookieDomain) {
            sourceEnv.COOKIE_DOMAIN = inferredCookieDomain;
            bootstrapLogger.warn(
                `⚠️ COOKIE_DOMAIN was missing in production; inferred ${inferredCookieDomain} from configured origins.`
            );
        } else if (requiresSharedCookieDomain(runtimeOriginEnv)) {
            throw new Error('COOKIE_DOMAIN must be set in production for split-subdomain auth deployments');
        }
    }

    const isRiskOverrideActive = (sourceEnv.PROD_RISK_OVERRIDE || '').trim().toLowerCase() === 'true';

    if ((sourceEnv.USE_DEFAULT_OTP || '').trim().toLowerCase() === 'true') {
        if (isRiskOverrideActive) {
            bootstrapLogger.warn('⚠️  SECURITY WARNING: USE_DEFAULT_OTP is enabled in production via PROD_RISK_OVERRIDE. Static OTPs are active!');
        } else {
            throw new Error(
                '🚨 SECURITY BLOCK: USE_DEFAULT_OTP=true is not allowed in production. ' +
                'This flag enables authentication bypass with a static OTP for every user. ' +
                'Remove it from your production environment or set PROD_RISK_OVERRIDE=true if this is intentional for pre-launch testing.'
            );
        }
    }

    if ((sourceEnv.AUTH_BYPASS_OTP_LOCK || '').trim().toLowerCase() === 'true') {
        if (isRiskOverrideActive) {
            bootstrapLogger.warn('⚠️  SECURITY WARNING: AUTH_BYPASS_OTP_LOCK is enabled in production via PROD_RISK_OVERRIDE. Brute-force protection is disabled!');
        } else {
            throw new Error(
                '🚨 SECURITY BLOCK: AUTH_BYPASS_OTP_LOCK=true is not allowed in production. ' +
                'This flag disables OTP attempt-count locking, enabling brute-force attacks. ' +
                'Remove it from your production environment or set PROD_RISK_OVERRIDE=true if this is intentional for pre-launch testing.'
            );
        }
    }

    bootstrapLogger.info('✅ Production environment secrets and origin constraints validated');
}

export function validateProductionSafetyFlagsOrThrow(sourceEnv: NodeJS.ProcessEnv): void {
    if ((sourceEnv.NODE_ENV || 'development') !== 'production') {
        return;
    }

    const enabledUnsafeFlags = BLOCKED_PRODUCTION_FLAGS.filter((key) => isEnabledFlag(sourceEnv[key]));
    if (enabledUnsafeFlags.length > 0) {
        throw new Error(
            `Unsafe production flags enabled: ${enabledUnsafeFlags.join(', ')}`
        );
    }

    if (isEnabledFlag(sourceEnv.ENABLE_SWAGGER)) {
        throw new Error('ENABLE_SWAGGER=true is not allowed in production');
    }

    const logLevel = (sourceEnv.LOG_LEVEL || '').trim().toLowerCase();
    if (['debug', 'verbose', 'silly', 'trace'].includes(logLevel)) {
        throw new Error(`LOG_LEVEL=${logLevel} is not allowed in production`);
    }

    if ((sourceEnv.NODE_OPTIONS || '').includes('--inspect')) {
        throw new Error('NODE_OPTIONS includes --inspect in production');
    }

    bootstrapLogger.info('✅ Production safety flags validated');
}
