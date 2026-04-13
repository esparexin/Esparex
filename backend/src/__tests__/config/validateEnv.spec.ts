import {
    validateProductionEnvOrThrow,
    validateS3BucketEnvAliasOrThrow,
    validateS3RuntimeEnvOrThrow
} from '../../config/validateEnv';
import bootstrapLogger from '../../utils/bootstrapLogger';

jest.mock('../../utils/bootstrapLogger', () => ({
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
}));

const VALID_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE';
const VALID_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

const baseProductionEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'production',
    RAZORPAY_WEBHOOK_SECRET: 'webhook_secret',
    OTP_HASH_SECRET: 'otp_hash_secret',
    JWT_SECRET: 'jwt_secret_value_long_enough_for_tests',
    REDIS_URL: 'redis://localhost:6379',
    MONGODB_URI: 'mongodb://localhost:27017/esparex_test',
    ADMIN_MONGODB_URI: 'mongodb://localhost:27017/esparex_admin',
    AWS_ACCESS_KEY_ID: VALID_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: VALID_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: 'esparex-test-bucket',
    CORS_ORIGIN: 'https://esparex.in',
};

describe('validateProductionEnvOrThrow', () => {
    it('throws when required production secrets are missing', () => {
        const env = { ...baseProductionEnv };
        delete env.JWT_SECRET;

        expect(() => validateProductionEnvOrThrow(env)).toThrow(
            /^Missing required production environment variables: .*JWT_SECRET/
        );
    });

    it('throws when S3_BUCKET_NAME is missing', () => {
        const env = { ...baseProductionEnv };
        delete env.S3_BUCKET_NAME;

        expect(() => validateProductionEnvOrThrow(env)).toThrow(
            /^Missing required production environment variables: .*S3_BUCKET_NAME/
        );
    });

    it('throws when USE_DEFAULT_OTP is enabled in production', () => {
        const env = { ...baseProductionEnv, USE_DEFAULT_OTP: 'true' };

        expect(() => validateProductionEnvOrThrow(env)).toThrow(
            /USE_DEFAULT_OTP=true is not allowed in production/
        );
    });

    it('throws when AUTH_BYPASS_OTP_LOCK is enabled in production', () => {
        const env = { ...baseProductionEnv, AUTH_BYPASS_OTP_LOCK: 'true' };

        expect(() => validateProductionEnvOrThrow(env)).toThrow(
            /AUTH_BYPASS_OTP_LOCK=true is not allowed in production/
        );
    });

    it('infers COOKIE_DOMAIN from split-subdomain production origins when it is omitted', () => {
        const env: NodeJS.ProcessEnv = {
            ...baseProductionEnv,
            FRONTEND_URL: 'https://exparex.in',
            ADMIN_FRONTEND_URL: 'https://admin.exparex.in',
            CORS_ORIGIN: 'https://exparex.in,https://admin.exparex.in',
        };

        expect(() => validateProductionEnvOrThrow(env)).not.toThrow();
        expect(env.COOKIE_DOMAIN).toBe('exparex.in');
        expect(bootstrapLogger.warn).toHaveBeenCalledWith(expect.stringContaining('COOKIE_DOMAIN was missing'));
    });

    it('throws when production split-domain auth lacks an inferable shared cookie domain', () => {
        const env = {
            ...baseProductionEnv,
            FRONTEND_URL: 'https://shop.exparex.in',
            ADMIN_FRONTEND_URL: 'https://console.other-root.in',
            CORS_ORIGIN: 'https://shop.exparex.in,https://console.other-root.in',
        };

        expect(() => validateProductionEnvOrThrow(env)).toThrow(
            /COOKIE_DOMAIN must be set in production for split-subdomain auth deployments/
        );
    });

    it('accepts AWS_S3_BUCKET alias when canonical name is not provided', () => {
        const env: NodeJS.ProcessEnv = {
            ...baseProductionEnv,
            AWS_S3_BUCKET: 'legacy-bucket',
        };
        delete env.S3_BUCKET_NAME;

        expect(() => validateProductionEnvOrThrow(env)).not.toThrow();
        expect(env.S3_BUCKET_NAME).toBe('legacy-bucket');
        expect(bootstrapLogger.warn).toHaveBeenCalledWith(expect.stringContaining('DEPRECATION: AWS_S3_BUCKET is deprecated'));
    });
});

describe('validateS3BucketEnvAliasOrThrow', () => {
    it('mirrors AWS_S3_BUCKET into S3_BUCKET_NAME when canonical env is missing', () => {
        const env: NodeJS.ProcessEnv = {
            NODE_ENV: 'development',
            AWS_S3_BUCKET: 'legacy-bucket',
        };

        expect(() => validateS3BucketEnvAliasOrThrow(env)).not.toThrow();
        expect(env.S3_BUCKET_NAME).toBe('legacy-bucket');
    });

    it('does not throw when S3_BUCKET_NAME is used', () => {
        const env: NodeJS.ProcessEnv = {
            NODE_ENV: 'development',
            S3_BUCKET_NAME: 'canonical-bucket',
        };

        expect(() => validateS3BucketEnvAliasOrThrow(env)).not.toThrow();
    });
});

describe('validateS3RuntimeEnvOrThrow', () => {
    it('throws in development when S3 is partially configured but required runtime variables are missing', () => {
        const env: NodeJS.ProcessEnv = {
            NODE_ENV: 'development',
            AWS_ACCESS_KEY_ID: VALID_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: '',
            AWS_REGION: 'ap-south-1',
            S3_BUCKET_NAME: '',
        };

        expect(() => validateS3RuntimeEnvOrThrow(env)).toThrow(
            /Missing required S3 environment variables/
        );
    });

    it('does not throw in development when S3 is fully unset', () => {
        const env: NodeJS.ProcessEnv = {
            NODE_ENV: 'development',
        };

        expect(() => validateS3RuntimeEnvOrThrow(env)).not.toThrow();
    });

    it('throws when access key and secret key appear swapped', () => {
        const env: NodeJS.ProcessEnv = {
            NODE_ENV: 'development',
            AWS_ACCESS_KEY_ID: VALID_SECRET_ACCESS_KEY,
            AWS_SECRET_ACCESS_KEY: VALID_ACCESS_KEY_ID,
            AWS_REGION: 'ap-south-1',
            S3_BUCKET_NAME: 'esparex-test-bucket',
        };

        expect(() => validateS3RuntimeEnvOrThrow(env)).toThrow(
            /appear swapped/
        );
    });

    it('accepts valid runtime S3 credential format in development', () => {
        const env: NodeJS.ProcessEnv = {
            NODE_ENV: 'development',
            AWS_ACCESS_KEY_ID: VALID_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: VALID_SECRET_ACCESS_KEY,
            AWS_REGION: 'ap-south-1',
            S3_BUCKET_NAME: 'esparex-test-bucket',
        };

        expect(() => validateS3RuntimeEnvOrThrow(env)).not.toThrow();
    });

    it('does not throw in test environment', () => {
        const env: NodeJS.ProcessEnv = {
            NODE_ENV: 'test',
        };

        expect(() => validateS3RuntimeEnvOrThrow(env)).not.toThrow();
    });
});
