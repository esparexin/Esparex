import type { ClientSession } from 'mongoose';
import { AppError } from '../../../../../shared-kernel/errors/AppError';
import logger from '../../../../../utils/logger';
import { getListingRepository, getListingsCache, getListingUnitOfWork } from '../../../../../composition/listings';
import { LISTING_TYPE } from '@esparex/contracts';
import { LISTING_STATUS } from '@esparex/contracts';
import { LIFECYCLE_STATUS } from '@esparex/contracts';
import { consumeCredit } from '../../../../payments/application/WalletService';
import { isValidObjectId } from '../../../../../utils/idUtils';
// Canonical boost-window math (boosts/shared) — the inline setDate math lost P0-1.
import { computeBoostWindow } from '../../../../boosts/shared/computeBoostWindow';

export interface PromoteAdParams {
    id: string;
    userId: string;
    days?: number;
    type?: 'spotlight_hp' | 'spotlight_cat';
    isAdmin?: boolean;
}

/**
 * @deprecated P0-1 (DECISION-GATE §1/§3): RETIRED flow, superseded by boosts-domain
 * `applyPromotion`. Kept only as the flag-OFF legacy branch for `ad-mutation`.
 * Do not call from new code. Deletion in Phase 4.
 */
export const promoteAdLogic = async (params: PromoteAdParams) => {
    const {
        id,
        days = 7,
        type = 'spotlight_hp',
        userId,
        isAdmin = false
    } = params;
    const Boost = (await import('../../../../../models/Boost')).default;
    const User = (await import('../../../../../models/User')).default;

    if (!isValidObjectId(id)) throw new AppError('Invalid Ad ID', 400);

    const ad = await getListingRepository().findById(id);
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
            const activePromotions = await getListingRepository().count({
                sellerId: userId,
                isSpotlight: true,
                status: LISTING_STATUS.LIVE
            });
            if (activePromotions >= 3) {
                throw new AppError('Maximum 3 active spotlight promotions allowed concurrently.', 403);
            }
        }
    }

    // Canonical boost-window math (boosts/shared): CLAMPED to ad expiry.
    // The retired inline setDate math (reject-instead-of-clamp) lost P0-1.
    const windowBase = (ad.isSpotlight && ad.spotlightExpiresAt && ad.spotlightExpiresAt > new Date())
        ? new Date(ad.spotlightExpiresAt.getTime())
        : new Date();
    const { startsAt, endsAt } = computeBoostWindow(ad, days, windowBase);

    await getListingUnitOfWork().executeTransaction(async (session) => {
        const clientSession = session as ClientSession;
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
                    session: clientSession
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
                { entityId: ad.id, isActive: true },
                { $set: { endsAt } },
                { session: clientSession }
            );
        } else {
            await Boost.create([{
                entityId: ad.id,
                entityType: 'ad',
                boostType: type,
                startsAt,
                endsAt,
                isActive: true
            }], { session: clientSession });
        }

        await getListingRepository().updateOne(id, {
            $set: {
                isSpotlight: true,
                spotlightExpiresAt: endsAt,
                spotlightWarningCount: 0
            },
            $unset: {
                spotlightWarningSentAt: 1
            }
        }, clientSession);
    });

    setImmediate(() => {
        getListingsCache().invalidateAdFeedCaches().catch((err: unknown) => {
            logger.error('Failed to clear homepage cache after promotion', { error: String(err) });
        });
    });

    return ad;
};
