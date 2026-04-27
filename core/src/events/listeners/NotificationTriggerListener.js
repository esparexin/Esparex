"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNotificationTriggerListener = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const LifecycleEventDispatcher_1 = require("../LifecycleEventDispatcher");
const adQueue_1 = require("@core/queues/adQueue");
const LifecyclePolicyGuard_1 = require("@core/services/LifecyclePolicyGuard");
const registerNotificationTriggerListener = () => {
    LifecycleEventDispatcher_1.lifecycleEvents.on('listing.approved', async (payload) => {
        try {
            const event = (0, LifecyclePolicyGuard_1.assertListingApprovedEvent)(payload);
            const adId = event.listingId;
            const rawKey = `${adId}:LISTING_APPROVED`;
            const jobId = crypto_1.default.createHash('sha256').update(rawKey).digest('hex');
            logger_1.default.info('[NotificationTrigger] listing.approved intercepted', {
                listingId: event.listingId,
                listingType: event.listingType,
                approvedAt: event.approvedAt,
            });
            await adQueue_1.notificationMatchQueue.add('process_smart_alerts', { adId }, {
                jobId,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: true,
                removeOnFail: false,
            });
            logger_1.default.info(`[NotificationTrigger] Enqueued process_smart_alerts`, {
                adId,
                jobId,
            });
        }
        catch (error) {
            logger_1.default.error('[NotificationTrigger] Failed to process listing.approved event', {
                error: error instanceof Error ? error.message : String(error),
                payload,
            });
        }
    }, 'NotificationTrigger_ListingApproved');
    logger_1.default.info('[NotificationTrigger] Listener registered successfully.');
};
exports.registerNotificationTriggerListener = registerNotificationTriggerListener;
//# sourceMappingURL=NotificationTriggerListener.js.map