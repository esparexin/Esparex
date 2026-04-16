import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError';
import logger from '../../utils/logger';
import Ad from '../../models/Ad';
import { getUserConnection } from '../../config/db';
import { LISTING_TYPE } from '../../../../shared/enums/listingType';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { LIFECYCLE_STATUS } from '../../../../shared/enums/lifecycle';
import { consumeCredit } from '../WalletService';
import { invalidateAdFeedCaches } from '../../utils/redisCache';

export const promoteAdLogic = async (
    id: string,
    days: number = 7,
    type: 'spotlight_hp' | 'spotlight_cat' = 'spotlight_hp',
    userId: string,
    isAdmin: boolean = false
) => {
    const Boost = (await import('../../models/Boost')).default;
    const User = (await import('../../models/User')).default;

    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Ad ID', 400);

    const ad = await Ad.findById(id);
    if (!ad) return null;

    if (ad.listingType === LISTING_TYPE.SPARE_PART) {
        throw new AppError('Spare parts are not eligible for Spotlight promotion.', 403);
    }

    if (!isAdmin && ad.sellerId.toString() !== userId.toString()) {
        throw new AppError('Unauthorized', 403);
    }

    if (!isAdmin) {
        const user = await User.findById(userId).select('trustScore strikeCount');
        if (!user || user.trustScore < 30 || user.strikeCount >= 2) {
            throw new AppError('Account ineligible for promotion due to trust or moderation standing.', 403);
        }

        if ((ad.moderationStatus as string) === 'auto_hidden' || ad.moderationStatus === LIFECYCLE_STATUS.REJECTED || ad.moderationStatus === 'held_for_review') {
            throw new AppError('Ad must be in normal standing to be promoted.', 403);
        }

        if (!ad.isSpotlight) {
            const activePromotions = await Ad.countDocuments({
                sellerId: userId,
                isSpotlight: true,
                status: AD_STATUS.LIVE
            });
            if (activePromotions >= 3) {
                throw new AppError('Maximum 3 active spotlight promotions allowed concurrently.', 403);
            }
        }
    }

    const startsAt = new Date();
    let endsAt = new Date();

    if (ad.isSpotlight && ad.spotlightExpiresAt && ad.spotlightExpiresAt > new Date()) {
        endsAt = new Date(ad.spotlightExpiresAt.getTime());
    }
    endsAt.setDate(endsAt.getDate() + days);

    if (ad.expiresAt && ad.expiresAt < endsAt) {
        throw new AppError('Ad expires before boost duration. Extend ad expiry first.', 400);
    }

    const connection = getUserConnection();
    const session = await connection.startSession();

    try {
        await session.withTransaction(async () => {
            if (!isAdmin) {
                const promotionCost = Math.abs(Math.floor(days));
                if (promotionCost === 0) throw new AppError('Promotion cost cannot be zero', 400, 'INVALID_PROMOTION_COST');

                try {
                    await consumeCredit({
                        userId,
                        creditType: 'spotlightCredits',
                        amount: promotionCost,
                        reason: `Ad promotion - ${days} days`,
                        metadata: { adId: id, type, days },
                        session
                    });
                } catch (error) {
                    throw new AppError(
                        error instanceof Error ? error.message : 'Insufficient spotlight credits',
                        402
                    );
                }
            }

            if (ad.isSpotlight) {
                await Boost.updateOne(
                    { entityId: ad._id, isActive: true },
                    { $set: { endsAt } },
                    { session }
                );
            } else {
                await Boost.create([{
                    entityId: ad._id,
                    entityType: 'ad',
                    boostType: type,
                    startsAt,
                    endsAt,
                    isActive: true
                }], { session });
            }

            ad.isSpotlight = true;
            ad.spotlightExpiresAt = endsAt;
            await ad.save({ session });
        });

        setImmediate(() => {
            invalidateAdFeedCaches().catch((err: unknown) => {
                logger.error('Failed to clear homepage cache after promotion', { error: String(err) });
            });
        });
    } finally {
        await session.endSession();
    }

    return ad;
};
