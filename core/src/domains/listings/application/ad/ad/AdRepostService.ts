import { AppError } from '../../../../../utils/AppError';
import logger from '../../../../../utils/logger';
import { getListingRepository, getListingsCache, getListingUnitOfWork } from '../../../../../composition/listings';
import { LISTING_STATUS } from '@esparex/contracts';
import { ListingSubmissionPolicy } from '../../../domain/policies/ListingSubmissionPolicy';
import { mutateStatus } from '../../../../../services/lifecycle/StatusMutationService';
import { normalizeAdStatus } from "../../../../../services/lifecycle/AdStatusService";
import { isValidObjectId } from '../../../../../utils/idUtils';

import { type ListingTypeValue } from '@esparex/contracts';

export const repostAdLogic = async (
    id: string,
    userId: string
): Promise<Record<string, unknown> | null> => {
    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
        return null;
    }

    logger.info('[RepostLifecycle] Repost requested', { adId: id, userId });

    let updatedAd: Record<string, unknown> | null = null;

    try {
        await getListingUnitOfWork().executeTransaction(async (session) => {
            const ad = await getListingRepository().findOne({
                ids: [id],
                sellerId: userId,
                isDeleted: false as any
            });

            if (!ad) {
                throw new AppError('Ad not found', 404);
            }

            const currentStatus = normalizeAdStatus(String(ad.status));
            const isExpired = currentStatus === LISTING_STATUS.EXPIRED;
            const isRejected = currentStatus === LISTING_STATUS.REJECTED;

            if (!isExpired && !isRejected) {
                throw new AppError('Only expired or rejected ads can be reposted', 400);
            }

            // 🛡️ GOVERNANCE: Unified Slot Reservation via SubmissionPolicy
            await ListingSubmissionPolicy.reserveSlot({
                userId,
                listingType: (ad.listingType as ListingTypeValue),
                listingId: id,
                session: session as any,
                actor: 'user'
            });

            const nextStatus = LISTING_STATUS.PENDING;
            const now = new Date();
            const patchDoc: Record<string, unknown> = {
                $unset: {
                    expiresAt: 1,
                    approvedAt: 1,
                    expiryWarningSentAt: 1,
                    lastExpiryWarningChannel: 1,
                    spotlightWarningSentAt: 1,
                    duplicateFingerprint: 1,
                    duplicateOf: 1,
                    rejectionReason: 1
                },
                $set: {
                    publishedAt: now,
                    expiryWarningCount: 0,
                    spotlightWarningCount: 0,
                    duplicateScore: 0,
                    isDuplicateFlag: false,
                    moderationStatus: 'held_for_review',
                    moderationReason: 'Reposted by seller for moderation review'
                }
            };
            await getListingRepository().updateOne(id, patchDoc as any, session);

            const transitioned = await mutateStatus({
                domain: 'ad',
                entityId: ad.id,
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
                session: session as any,
            });
            updatedAd = transitioned;

            logger.info('[RepostLifecycle] Repost mutation applied', {
                adId: id,
                userId,
                nextStatus,
                expiresAt: ad.expiresAt
            });
        });

        setImmediate(() => {
            getListingsCache().invalidateAdFeedCaches().catch((err: unknown) => {
                logger.error('Failed to clear feed cache after repost', { error: String(err), adId: id });
            });
            getListingsCache().invalidatePublicAdCache(id).catch((err: unknown) => {
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
    }
};
