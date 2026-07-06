// Public API for transport-neutral runtime infrastructure resources

// Database Connection Manager
export {
    connectDB,
    closeDB,
    connectDB as connectDatabase,
    closeDB as disconnectDatabase,
    getUserConnection,
    getAdminConnection,
    isDbReady,
    getDatabaseHealthProbe
} from './db';

// Redis Client & Cache Manager
export {
    redisClient,
    redisClient as redis,
    waitForRedisReady,
    getRedisClientByRole,
    closeRedisClients
} from './redis';

export {
    getCache,
    setCache,
    delCache,
    CACHE_TTLS,
    CACHE_KEYS,
    blacklistToken,
    isTokenBlacklisted,
    clearCachePattern,
    getCacheStats,
    getRedisHealthProbe,
    scanKeysByPattern,
    buildDeterministicSearchCacheKey
} from './cache/redisCache';

// Socket.io Server Ingress
export {
    initIO,
    getIO,
    closeIO
} from './socket';

// Third-Party Payment Client SDKs
export {
    getRazorpayClient,
    getRazorpayRuntimeConfig,
    buildMockOrder,
    type InvoiceUser
} from './payment/razorpay';

// Cloud Storage Middlewares & S3 client
export {
    createUploadMiddleware
} from './storage/uploadFactory';

export {
    uploadToS3,
    deleteFromS3Url,
    isS3UploadConfigured,
    getMissingS3UploadConfigKeys,
    isPlaceholderImageUrl,
    generatePresignedUploadUrl
} from './storage/s3';

// Telemetry & Exception Tracking
export {
    initSentry,
    captureException
} from './telemetry/sentry';

export {
    dbQueryDuration,
    httpErrorRate,
    httpErrorsTotal,
    httpRequestDuration,
    reliabilityAlertsTotal,
    register
} from './telemetry/metrics';

export {
    emitReliabilityAlert
} from './telemetry/reliabilityAlerts';

export {
    recordApiRequestSample
} from './telemetry/sloMonitor';

export {
    getSystemMetricsSummary
} from './telemetry/systemMetricsSummary';

export {
    recordApiUsageSignal,
    recordRepeatedFailureSignal,
    recordOtpAbuseSignal,
    recordRateLimitSignal
} from './telemetry/securityMonitoring';

export {
    setReliabilityContext,
    clearReliabilityContext
} from './telemetry/reliabilityContext';

// Push Notification Gateway Client
export {
    default as firebaseAdmin
} from './push/firebaseAdmin';
