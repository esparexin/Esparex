"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueImageOptimization = exports.imageOptimizationQueue = void 0;
const bullmq_1 = require("bullmq");
const redisConnection_1 = require("./redisConnection");
const logger_1 = __importDefault(require("@core/utils/logger"));
const queueWrapper_1 = require("@core/utils/queueWrapper");
exports.imageOptimizationQueue = new bullmq_1.Queue('image-optimization-events', {
    connection: redisConnection_1.redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
const enqueueImageOptimization = async (entityId, entityType, imageUrls) => {
    if (!imageUrls || imageUrls.length === 0)
        return;
    // Filter out standard URLs that might already be optimized or placeholders to prevent looping
    const eligibleUrls = imageUrls.filter(url => url.startsWith('https://') &&
        !url.includes('placehold.co') &&
        !url.endsWith('-hd.webp') &&
        !url.endsWith('-thumb.webp'));
    if (eligibleUrls.length === 0)
        return;
    try {
        await (0, queueWrapper_1.addJobWithTrace)(exports.imageOptimizationQueue, `optimize-images-${entityId}`, { entityId, entityType, imageUrls: eligibleUrls }, { jobId: `img-opt-${entityId}-${Date.now()}` });
        logger_1.default.info(`[ImageQueue] Enqueued image optimization for ${entityType} ${entityId}`, { count: eligibleUrls.length });
    }
    catch (error) {
        logger_1.default.error(`[ImageQueue] Failed to enqueue image optimization for ${entityType} ${entityId}`, error);
    }
};
exports.enqueueImageOptimization = enqueueImageOptimization;
//# sourceMappingURL=imageQueue.js.map