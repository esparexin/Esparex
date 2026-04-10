import bootstrapLogger from '../utils/bootstrapLogger';
import { inferCookieDomainFromEnv, requiresSharedCookieDomain } from '../utils/originConfig';

const REQUIRED_PRODUCTION_ENV_VARS = [
    'RAZORPAY_WEBHOOK_SECRET',
    'OTP_HASH_SECRET',
    'JWT_SECRET',
    'REDIS_URL',
    'MONGODB_URI',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
] as const;

const REQUIRED_S3_RUNTIME_ENV_VARS = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'S3_BUCKET_NAME',
] as const;

const AWS_ACCESS_KEY_ID_PATTERN = /^(AKIA|ASIA|AIDA|AROA)[A-Z0-9]{16}$/;
const AWS_SECRET_ACCESS_KEY_PATTERN = /^[A-Za-z0-9/+=]{40}$/;

const hasValue = (value: string | undefined): boolean =>
    typeof value === 'string' && value.trim().length > 0;

export function validateS3BucketEnvAliasOrThrow(sourceEnv: NodeJS.ProcessEnv): void {
    const legacyBucket = sourceEnv.AWS_S3_BUCKET?.trim();
    const canonicalBucket = sourceEnv.S3_BUCKET_NAME?.trim();

    if (legacyBucket && !canonicalBucket) {
        bootstrapLogger.warn(
            '⚠️ Deprecated env var detected: AWS_S3_BUCKET. Mirroring it to S3_BUCKET_NAME for backward compatibility.'
        );
        sourceEnv.S3_BUCKET_NAME = legacyBucket;
        return;
    }

    if (legacyBucket && canonicalBucket && legacyBucket !== canonicalBucket) {
        bootstrapLogger.warn(
            '⚠️ Both AWS_S3_BUCKET and S3_BUCKET_NAME are set with different values. S3_BUCKET_NAME will be used.'
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

    const corsOrigin = sourceEnv.CORS_ORIGIN;
    if (!hasValue(corsOrigin)) {
        throw new Error('CORS_ORIGIN must be defined in production');
    }

    if (hasWildcardCorsOrigin(corsOrigin as string)) {
        throw new Error('CORS_ORIGIN cannot include wildcard (*) in production');
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

    if ((sourceEnv.USE_DEFAULT_OTP || '').trim().toLowerCase() === 'true') {
        throw new Error('USE_DEFAULT_OTP must be false in production');
    }

    bootstrapLogger.info('✅ Production environment secrets and origin constraints validated');
}
