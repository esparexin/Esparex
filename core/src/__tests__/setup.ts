// Force test semantics before any application modules read process.env.
process.env.NODE_ENV = 'test';
process.env.ALLOW_REDIS = 'false';

// Fallbacks for core/src/config/env.ts validation in test environment
process.env.MONGODB_URI = 'mongodb://localhost:27017/esparex_test';
process.env.ADMIN_MONGODB_URI = 'mongodb://localhost:27017/esparex_admin_test';
process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters_long';
process.env.HMAC_SECRET = 'test_hmac_secret_at_least_32_characters_long';
process.env.RAZORPAY_KEY_ID = 'rzp_test_id';
process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
