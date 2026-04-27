"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdLogic = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = require("@core/utils/AppError");
const logger_1 = __importDefault(require("@core/utils/logger"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const db_1 = require("@core/config/db");
const adStatus_1 = require("@core/constants/enums/adStatus");
const lifecycle_1 = require("@core/constants/enums/lifecycle");
const notificationType_1 = require("@core/constants/enums/notificationType");
const slugGenerator_1 = require("@core/utils/slugGenerator");
const AdCreationService_1 = require("../AdCreationService");
const StatusMutationService_1 = require("../StatusMutationService");
const imageQueue_1 = require("@core/queues/imageQueue");
const updateAdLogic = async (adId, data, context, externalSession) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(adId))
        return null;
    const id = new mongoose_1.default.Types.ObjectId(adId);
    const connection = (0, db_1.getUserConnection)();
    const session = externalSession || await connection.startSession();
    const isInternalSession = !externalSession;
    try {
        let updatedAd = null;
        let oldPriceValue;
        const executeUpdate = async () => {
            const ad = await Ad_1.default.findById(id).session(session);
            if (!ad)
                return;
            oldPriceValue = ad.price;
            if (context.actor === 'USER' && String(ad.sellerId) !== context.sellerId)
                throw new AppError_1.AppError('Unauthorized: You can only edit your own ads', 403);
            if (ad.status === lifecycle_1.LIFECYCLE_STATUS.SOLD || ad.status === lifecycle_1.LIFECYCLE_STATUS.EXPIRED || ad.status === lifecycle_1.LIFECYCLE_STATUS.REJECTED || ad.status === lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED)
                throw new AppError_1.AppError('This ad can no longer be edited in its current status.', 400);
            // 🔒 LOCATION LOCK: Location is a trust signal — once an ad reaches pending/live
            // it cannot be silently changed. Prevents location gaming and buyer trust breaks.
            if (context.actor === 'USER' && (ad.status === adStatus_1.AD_STATUS.LIVE || ad.status === adStatus_1.AD_STATUS.PENDING)) {
                const untypedData = data;
                delete untypedData.location;
                delete untypedData.locationId;
            }
            if (context.actor === 'USER' && !context.allowSuspendedUser) {
                const User = (await Promise.resolve().then(() => __importStar(require('@core/models/User')))).default;
                const user = await User.findById(context.authUserId).select('isSuspended').lean();
                if (user?.isSuspended)
                    throw Object.assign(new Error('Account suspended'), { statusCode: 403, code: 'ACCOUNT_SUSPENDED' });
            }
            const payload = await AdCreationService_1.AdCreationService.preparePayload(data, context, true, adId.toString(), adId);
            const requiresReviewTransition = context.actor === 'USER' && ad.status === adStatus_1.AD_STATUS.LIVE;
            if (context.actor === 'USER') {
                const untypedPayload = payload;
                untypedPayload.$inc = { ...untypedPayload.$inc, reviewVersion: 1 };
            }
            // Status transitions must not be embedded in direct update queries.
            delete payload.status;
            let slugRetries = 0;
            while (slugRetries < 3) {
                try {
                    const updated = await Ad_1.default.findByIdAndUpdate(id, payload, {
                        new: true,
                        session,
                        runValidators: true
                    });
                    updatedAd = updated;
                    break;
                }
                catch (error) {
                    const mongoError = error;
                    if (mongoError.code === 11000 && mongoError.keyPattern?.seoSlug) {
                        slugRetries++;
                        const baseTitle = payload.title || ad.title;
                        payload.seoSlug = await (0, slugGenerator_1.generateUniqueSlug)(Ad_1.default, baseTitle, ad.seoSlug, adId);
                    }
                    else {
                        throw error;
                    }
                }
            }
            if (updatedAd && requiresReviewTransition) {
                updatedAd = await (0, StatusMutationService_1.mutateStatus)({
                    domain: 'ad',
                    entityId: id,
                    toStatus: adStatus_1.AD_STATUS.PENDING,
                    actor: {
                        type: context.actor === 'ADMIN' ? 'admin' : 'user',
                        id: context.authUserId,
                    },
                    reason: 'Re-submitted for review after edit',
                    metadata: {
                        action: 'listing_edit',
                        sourceRoute: '/api/v1/ads/:id',
                    },
                    patch: {
                        moderationStatus: 'held_for_review',
                        $push: {
                            timeline: {
                                status: adStatus_1.AD_STATUS.PENDING,
                                timestamp: new Date(),
                                reason: 'Re-submitted for review after edit',
                            },
                        },
                    },
                    session,
                });
            }
        };
        if (isInternalSession) {
            await session.withTransaction(executeUpdate);
        }
        else {
            await executeUpdate();
        }
        if (!updatedAd)
            return null;
        const updatedAdTyped = updatedAd;
        if (Array.isArray(updatedAdTyped.images) && updatedAdTyped.images.length > 0) {
            (0, imageQueue_1.enqueueImageOptimization)(adId, 'ad', updatedAdTyped.images).catch(err => {
                logger_1.default.error('Failed to enqueue image optimization after Ad edit', err);
            });
        }
        // 💰 PRICE DROP ENGINE
        if (oldPriceValue && updatedAdTyped.price < oldPriceValue) {
            void (async () => {
                try {
                    const SavedAd = (await Promise.resolve().then(() => __importStar(require('@core/models/SavedAd')))).default;
                    const keepers = await SavedAd.find({ adId: id }).select('userId').lean();
                    if (keepers.length > 0) {
                        const { dispatchTemplatedNotification } = await Promise.resolve().then(() => __importStar(require('../NotificationService')));
                        for (const keeper of keepers) {
                            await dispatchTemplatedNotification(String(keeper.userId), notificationType_1.NOTIFICATION_TYPE.PRICE_DROP, 'PRICE_DROP', {
                                adTitle: updatedAdTyped.title,
                                price: String(updatedAdTyped.price)
                            }, { adId: String(id), type: 'price_drop' });
                        }
                    }
                }
                catch (err) {
                    logger_1.default.error('Failed to dispatch price drop notifications', { error: err, adId });
                }
            })();
        }
        if (typeof updatedAd.toObject === 'function') {
            return updatedAd.toObject();
        }
        return updatedAd;
    }
    catch (error) {
        logger_1.default.error('Failed to update ad', {
            error: error instanceof Error ? error.message : String(error),
            adId
        });
        throw error;
    }
    finally {
        if (isInternalSession) {
            await session.endSession();
        }
    }
};
exports.updateAdLogic = updateAdLogic;
//# sourceMappingURL=AdUpdateService.js.map