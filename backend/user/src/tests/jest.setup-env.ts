// Force test semantics before any application modules read process.env.
process.env.NODE_ENV ??= 'test';
process.env.ALLOW_REDIS ??= 'false';

// Test-only environment normalization to reduce noisy logs in CI/local test output.
process.env.DOTENV_CONFIG_QUIET = 'true';

// Prevent repeated webhook "secret not set" warnings when importing app routes in tests.
if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
}

// Fallbacks for core/src/config/env.ts validation in test environment
process.env.MONGODB_URI ??= 'mongodb://localhost:27017/esparex_test';
process.env.ADMIN_MONGODB_URI ??= 'mongodb://localhost:27017/esparex_admin_test';
process.env.JWT_SECRET ??= 'test_secret_key_at_least_32_characters_long';
process.env.HMAC_SECRET ??= 'test_hmac_secret_at_least_32_characters_long';

const SUPPRESSED_WARNING_PATTERNS = [
    '[DEP0169]',
    '[DEP0040]',
    '`url.parse()` behavior is not standardized',
    'The `punycode` module is deprecated',
];

const originalEmitWarning = process.emitWarning.bind(process);
process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
    const warningText = typeof warning === 'string' ? warning : warning.message;
    if (SUPPRESSED_WARNING_PATTERNS.some((pattern) => warningText.includes(pattern))) {
        return;
    }
    originalEmitWarning(warning as string | Error, ...(args as []));
}) as typeof process.emitWarning;
