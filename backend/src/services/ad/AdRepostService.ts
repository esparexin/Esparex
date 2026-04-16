import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError';
import logger from '../../utils/logger';
import Ad from '../../models/Ad';
import { getUserConnection } from '../../config/db';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { consumeAdPostingSlot } from '../PlanService';
import { getAdPostingBalance } from '../AdSlotService';
import { mutateStatus } from '../StatusMutationService';
import { normalizeAdStatus } from '../adStatusService';
import { invalidateAdFeedCaches, invalidatePublicAdCache } from '../../utils/redisCache';

export const repostAdLogic = async (
    id: string,
    userId: string
): Promise<Record<string, unknown> | null> => {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
        return null;
    }

    logger.info('[RepostLifecycle] Repost requested', { adId: id, userId });

    const adId = new mongoose.Types.ObjectId(id);
    const sellerObjectId = new mongoose.Types.ObjectId(userId);
    const connection = getUserConnection();
    const session = await connection.startSession();
    let updatedAd: Record<string, unknown> | null = null;

    try {
        await session.withTransaction(async () => {
            const ad = await Ad.findOne({
                _id: adId,
                sellerId: sellerObjectId,
                isDeleted: { $ne: true }
            }).session(session);

            if (!ad) {
                throw new AppError('Ad not found', 404);
            }

            const currentStatus = normalizeAdStatus(String(ad.status));
            const isExpired = currentStatus === AD_STATUS.EXPIRED;
            const isRejected = currentStatus === AD_STATUS.REJECTED;

            if (!isExpired && !isRejected) {
                throw new AppError('Only expired or rejected ads can be reposted', 400);
            }

            const postingBalance = await getAdPostingBalance(userId, session);
            if (!postingBalance || postingBalance.totalRemaining < 1) {
                throw new AppError('Insufficient posting credits for repost', 402);
            }

            await consumeAdPostingSlot(userId, session);

            const nextStatus = AD_STATUS.PENDING;
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

            const transitioned = await mutateStatus({
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
            updatedAd = transitioned as Record<string, unknown>;

            logger.info('[RepostLifecycle] Repost mutation applied', {
                adId: id,
                userId,
                nextStatus,
                expiresAt: ad.expiresAt
            });
        });

        setImmediate(() => {
            invalidateAdFeedCaches().catch((err: unknown) => {
                logger.error('Failed to clear feed cache after repost', { error: String(err), adId: id });
            });
            invalidatePublicAdCache(id).catch((err: unknown) => {
                logger.error('Failed to clear public ad cache after repost', { error: String(err), adId: id });
            });
        });

        return updatedAd;
    } catch (error) {
        logger.error('[RepostLifecycle] Repost failed', {
            adId: id,
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    } finally {
        await session.endSession();
    }
};
