"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repostAdLogic = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = require("@core/utils/AppError");
const logger_1 = __importDefault(require("@core/utils/logger"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const db_1 = require("@core/config/db");
const adStatus_1 = require("@core/constants/enums/adStatus");
const PlanService_1 = require("../PlanService");
const AdSlotService_1 = require("../AdSlotService");
const StatusMutationService_1 = require("../StatusMutationService");
const adStatusService_1 = require("@core/services/adStatusService");
const redisCache_1 = require("@core/utils/redisCache");
const repostAdLogic = async (id, userId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id) || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return null;
    }
    logger_1.default.info('[RepostLifecycle] Repost requested', { adId: id, userId });
    const adId = new mongoose_1.default.Types.ObjectId(id);
    const sellerObjectId = new mongoose_1.default.Types.ObjectId(userId);
    const connection = (0, db_1.getUserConnection)();
    const session = await connection.startSession();
    let updatedAd = null;
    try {
        await session.withTransaction(async () => {
            const ad = await Ad_1.default.findOne({
                _id: adId,
                sellerId: sellerObjectId,
                isDeleted: { $ne: true }
            }).session(session);
            if (!ad) {
                throw new AppError_1.AppError('Ad not found', 404);
            }
            const currentStatus = (0, adStatusService_1.normalizeAdStatus)(String(ad.status));
            const isExpired = currentStatus === adStatus_1.AD_STATUS.EXPIRED;
            const isRejected = currentStatus === adStatus_1.AD_STATUS.REJECTED;
            if (!isExpired && !isRejected) {
                throw new AppError_1.AppError('Only expired or rejected ads can be reposted', 400);
            }
            const postingBalance = await (0, AdSlotService_1.getAdPostingBalance)(userId, session);
            if (!postingBalance || postingBalance.totalRemaining < 1) {
                throw new AppError_1.AppError('Insufficient posting credits for repost', 402);
            }
            await (0, PlanService_1.consumeAdPostingSlot)(userId, session);
            const nextStatus = adStatus_1.AD_STATUS.PENDING;
            const now = new Date();
            ad.expiresAt = undefined;
            ad.approvedAt = undefined;
            ad.publishedAt = now;
            ad.duplicateFingerprint = undefined;
            ad.duplicateOf = undefined;
            ad.duplicateScore = 0;
            ad.isDuplicateFlag = false;
            ad.rejectionReason = undefined;
            ad.moderationStatus = 'held_for_review';
            ad.moderationReason = 'Reposted by seller for moderation review';
            await ad.save({ session });
            const transitioned = await (0, StatusMutationService_1.mutateStatus)({
                domain: 'ad',
                entityId: ad._id.toString(),
                toStatus: nextStatus,
                actor: { type: 'user', id: userId },
                reason: 'Reposted by seller',
                metadata: {
                    action: 'repost',
                    sourceRoute: '/api/v1/ads/:id/repost',
                },
                patch: {
                    moderationStatus: 'held_for_review',
                    moderationReason: 'Reposted by seller for moderation review',
                    $push: {
                        timeline: {
                            status: nextStatus,
                            timestamp: now,
                            reason: 'Reposted by seller',
                        },
                    },
                },
                session,
            });
            updatedAd = transitioned;
            logger_1.default.info('[RepostLifecycle] Repost mutation applied', {
                adId: id,
                userId,
                nextStatus,
                expiresAt: ad.expiresAt
            });
        });
        setImmediate(() => {
            (0, redisCache_1.invalidateAdFeedCaches)().catch((err) => {
                logger_1.default.error('Failed to clear feed cache after repost', { error: String(err), adId: id });
            });
            (0, redisCache_1.invalidatePublicAdCache)(id).catch((err) => {
                logger_1.default.error('Failed to clear public ad cache after repost', { error: String(err), adId: id });
            });
        });
        return updatedAd;
    }
    catch (error) {
        logger_1.default.error('[RepostLifecycle] Repost failed', {
            adId: id,
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
    finally {
        await session.endSession();
    }
};
exports.repostAdLogic = repostAdLogic;
//# sourceMappingURL=AdRepostService.js.map