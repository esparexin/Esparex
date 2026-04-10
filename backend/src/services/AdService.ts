import { createAd as orchestratorCreateAd } from './AdOrchestrator';
// DTOs and validation schemas
import { z } from "zod";

export interface AdCreationDTO {
    title: string;
    description: string;
    price: number;
    categoryId: string;
    brandId: string;
    modelId: string;
    location: { locationId: string; lat: number; lng: number };
    images?: string[];
    duplicateFingerprint?: string;
}

export const AdCreationSchema = z.object({
    title: z.string(),
    description: z.string(),
    price: z.number(),
    categoryId: z.string(),
    brandId: z.string(),
    modelId: z.string(),
    location: z.object({
        locationId: z.string(),
        lat: z.number(),
        lng: z.number(),
    }),
    images: z.array(z.string()).optional(),
    duplicateFingerprint: z.string().optional(),
});

function isAdCreationDTO(obj: unknown): obj is AdCreationDTO {
    return AdCreationSchema.safeParse(obj).success;
}
/**
 * Ad Service (REFACTORED - Phase 2.1)
 * Legacy fallback ad creation function removed after orchestrator stability confirmation.
 * 3. adStatusService - Status management & lifecycle
 * 4. adEngagementService - Views & engagement tracking
 * 5. adImageService - Image upload & processing
 * 
 * New code should import directly from the specialized services.
 * Existing code can continue using these re-exports for backward compatibility.
 */

import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import Ad, { type IAd } from '../models/Ad';
import { getUserConnection } from '../config/db';
import { normalizeAdStatus } from './adStatusService';
import { LISTING_TYPE } from '../../../shared/enums/listingType';
import {
    consumeAdPostingSlot,
} from './PlanService';
import { getAdPostingBalance } from './AdSlotService';
import { consumeCredit } from './WalletService';
import { AdContext } from '../types/ad.types';
import { generateUniqueSlug } from '../utils/slugGenerator';
import { LIFECYCLE_STATUS } from '../../../shared/enums/lifecycle';
import { AD_STATUS, AD_STATUS_VALUES } from '../../../shared/enums/adStatus';
import { invalidateAdFeedCaches, invalidatePublicAdCache } from '../utils/redisCache';
import { AdCreationService } from './AdCreationService';
import { mutateStatus } from './StatusMutationService';
import { hydrateAdMetadata, getAds } from './ad/AdAggregationService';
export {
    getAds,
    hydrateAdMetadata
};
export {
    getListingDetailById,
    getReportedAdsAggregation,
    getAdSuggestions,
    getAdsByStatus,
    getAdIdBySlug
} from './ad/AdDetailService';
export {
    getAdCounts,
    getSellerListingStats,
    computeModerationSummaryByType
} from './ad/AdMetricsService';
export { updateAdStatus, expireOutdatedAds, expireBoosts, computeActiveExpiry, extendAdExpiry, deleteAd, restoreAd } from './adStatusService';
export { incrementAdView } from './AdEngagementService';

// ─────────────────────────────────────────────────
// CORE CRUD - GET WITH DUPLICATE DETECTION
// ─────────────────────────────────────────────────

export const assertOwnership = async (adId: string, userId: string): Promise<{ sellerId: mongoose.Types.ObjectId; status: string }> => {
    const ad = await Ad.findById(adId).select('sellerId status').lean();
    if (!ad) {
        const err: any = new Error('Ad not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
    }
    if (String(ad.sellerId) !== String(userId)) {
        const err: any = new Error('Unauthorized');
        err.statusCode = 403;
        err.code = 'UNAUTHORIZED';
        throw err;
    }
    return ad as { sellerId: mongoose.Types.ObjectId; status: string };
};

export const getAnyAdById = async (
    adId: string,
    _requesterId?: string
): Promise<Record<string, unknown> | null> => {
    void _requesterId;
    if (!mongoose.Types.ObjectId.isValid(adId)) return null;

    const id = new mongoose.Types.ObjectId(adId);

    try {
        const ad = await Ad.findOne({ _id: id })
            .setOptions({ withDeleted: true })
            .populate('sellerId', 'name avatar isVerified role trustScore')
            .lean();

        if (!ad) return null;

        // Perform Split-DB hydration for catalog references
        await hydrateAdMetadata([ad]);

        // Use DTO/interface for ad
        const result = { ...ad } as Partial<IAd>;
        delete (result as any).password;
        delete (result as any).otp;
        delete (result as any).otpExpiry;
        return result;
    } catch (error) {
        logger.error('Failed to get ad by ID', {
            error: error instanceof Error ? error.message : String(error),
            adId
        });
        throw error;
    }
};

// ─────────────────────────────────────────────────
// CORE CRUD - CREATE
// ─────────────────────────────────────────────────


// ─────────────────────────────────────────────────
// CORE CRUD - UPDATE
// ─────────────────────────────────────────────────

export const updateAd = async (
    adId: string,
    data: unknown,
    context: AdContext,
    externalSession?: mongoose.ClientSession
): Promise<Record<string, unknown> | null> => {
    if (!mongoose.Types.ObjectId.isValid(adId)) return null;

    const id = new mongoose.Types.ObjectId(adId);
    const connection = getUserConnection();
    const session = externalSession || await connection.startSession();
    const isInternalSession = !externalSession;

    try {
        let updatedAd: any | null = null;
        
        const executeUpdate = async () => {
            const ad = await Ad.findById(id).session(session);
            if (!ad) return;

            if (context.actor === 'USER' && String(ad.sellerId) !== context.sellerId)
                throw new AppError('Unauthorized: You can only edit your own ads', 403);
            if (ad.status === LIFECYCLE_STATUS.SOLD || ad.status === LIFECYCLE_STATUS.EXPIRED || ad.status === LIFECYCLE_STATUS.REJECTED || ad.status === LIFECYCLE_STATUS.DEACTIVATED)
                throw new AppError('This ad can no longer be edited in its current status.', 400);

            // 🔒 LOCATION LOCK: Location is a trust signal — once an ad reaches pending/live
            // it cannot be silently changed. Prevents location gaming and buyer trust breaks.
            if (context.actor === 'USER' && (ad.status === AD_STATUS.LIVE || ad.status === AD_STATUS.PENDING)) {
                delete (data as any).location;
                delete (data as any).locationId;
            }

            if (context.actor === 'USER' && !context.allowSuspendedUser) {
                const User = (await import('../models/User')).default;
                const user = await User.findById(context.authUserId).select('isSuspended').lean();
                if ((user as { isSuspended?: boolean } | null)?.isSuspended)
                    throw Object.assign(new Error('Account suspended'), { statusCode: 403, code: 'ACCOUNT_SUSPENDED' });
            }

            const payload = await AdCreationService.preparePayload(data, context, true, adId.toString(), adId);
            const requiresReviewTransition = context.actor === 'USER' && ad.status === AD_STATUS.LIVE;

            if (context.actor === 'USER') {
                (payload as any).$inc = { ...((payload as any).$inc || {}), reviewVersion: 1 };
            }

            // Status transitions must not be embedded in direct update queries.
            delete (payload as any).status;

            let slugRetries = 0;
            while (slugRetries < 3) {
                try {
                    const updated = await Ad.findByIdAndUpdate(id, payload, {
                        new: true,
                        session,
                        runValidators: true
                    });
                    updatedAd = updated;
                    break;
                } catch (error: unknown) {
                    const mongoError = error as any;
                    if (mongoError.code === 11000 && mongoError.keyPattern?.seoSlug) {
                        slugRetries++;
                        const baseTitle = (payload as any).title || ad.title;
                        (payload as any).seoSlug = await generateUniqueSlug(Ad, baseTitle, ad.seoSlug, adId);
                    } else {
                        throw error;
                    }
                }
            }

            if (updatedAd && requiresReviewTransition) {
                updatedAd = await mutateStatus({
                    domain: 'ad',
                    entityId: id,
                    toStatus: AD_STATUS.PENDING,
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
                                status: AD_STATUS.PENDING,
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
        } else {
            await executeUpdate();
        }

        if (!updatedAd) return null;

        if (typeof (updatedAd as { toObject?: unknown }).toObject === 'function') {
            return (updatedAd as unknown as { toObject: () => Record<string, unknown> }).toObject();
        }
        return updatedAd as Record<string, unknown>;
    } catch (error) {
        logger.error('Failed to update ad', {
            error: error instanceof Error ? error.message : String(error),
            adId
        });
        throw error;
    } finally {
        if (isInternalSession) {
            await session.endSession();
        }
    }
};

export const updateAdTransactional = async (options: {
    adId: string,
    patch: unknown,
    context: AdContext,
    optionalStatusTransition?: { toStatus: string, reason?: string }
}): Promise<Record<string, unknown> | null> => {
    const { adId, patch, context, optionalStatusTransition } = options;
    const connection = getUserConnection();
    const session = await connection.startSession();
    
    try {
        let result: Record<string, unknown> | null = null;
        await session.withTransaction(async () => {
            if (Object.keys(patch as object).length > 0) {
                result = await updateAd(adId, patch, context, session);
            }
            if (optionalStatusTransition) {
                result = await mutateStatus({
                    domain: 'ad',
                    entityId: adId,
                    toStatus: optionalStatusTransition.toStatus,
                    actor: { type: context.actor === 'ADMIN' ? 'admin' : 'user', id: context.authUserId, ip: '', userAgent: '' },
                    reason: optionalStatusTransition.reason,
                    session
                }) as Record<string, unknown> | null;
            }
        });

        return result;
    } catch (error) {
        throw error;
    } finally {
        await session.endSession();
    }
};

// ─────────────────────────────────────────────────
// SPOTLIGHT PROMOTION
// ─────────────────────────────────────────────────

export const promoteAd = async (
    id: string,
    days: number = 7,
    type: 'spotlight_hp' | 'spotlight_cat' = 'spotlight_hp',
    userId: string,
    isAdmin: boolean = false
) => {
    const Boost = (await import('../models/Boost')).default;
    const Transaction = (await import('../models/Transaction')).default;
    const User = (await import('../models/User')).default;

    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Ad ID', 400);

    const ad = await Ad.findById(id);
    if (!ad) return null;

    // 🛡️ Phase 2: listingType Guard for Spotlight
    // Only 'ad' and 'service' types are eligible for spotlight.
    if (ad.listingType === LISTING_TYPE.SPARE_PART) {
        const err: any = new Error('Spare parts are not eligible for Spotlight promotion.');
        err.statusCode = 403;
        throw err;
    }

    if (!isAdmin && ad.sellerId.toString() !== userId.toString()) {
        const err: any = new Error('Unauthorized');
        err.statusCode = 403;
        throw err;
    }

    if (!isAdmin) {
        const user = await User.findById(userId).select('trustScore strikeCount');
        if (!user || user.trustScore < 30 || user.strikeCount >= 2) {
            const err: any = new Error('Account ineligible for promotion due to trust or moderation standing.');
            err.statusCode = 403;
            throw err;
        }

        if ((ad.moderationStatus as string) === 'auto_hidden' || ad.moderationStatus === LIFECYCLE_STATUS.REJECTED || ad.moderationStatus === 'held_for_review') {
            const err: any = new Error('Ad must be in normal standing to be promoted.');
            err.statusCode = 403;
            throw err;
        }

        if (!ad.isSpotlight) {
            const activePromotions = await Ad.countDocuments({
                sellerId: userId,
                isSpotlight: true,
                status: AD_STATUS.LIVE
            });
            if (activePromotions >= 3) {
                const err: any = new Error('Maximum 3 active spotlight promotions allowed concurrently.');
                err.statusCode = 403;
                throw err;
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
        const err: any = new Error('Ad expires before boost duration. Extend ad expiry first.');
        err.statusCode = 400;
        throw err;
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
                    const err: any = new Error(
                        error instanceof Error ? error.message : 'Insufficient spotlight credits'
                    );
                    err.statusCode = 402;
                    throw err;
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

export const repostAd = async (
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
                const err: any = new Error('Ad not found');
                err.statusCode = 404;
                throw err;
            }

            const currentStatus = normalizeAdStatus(String(ad.status));
            const isExpired = currentStatus === AD_STATUS.EXPIRED;
            const isRejected = currentStatus === AD_STATUS.REJECTED;

            if (!isExpired && !isRejected) {
                const err: any = new Error('Only expired or rejected ads can be reposted');
                err.statusCode = 400;
                throw err;
            }

            const postingBalance = await getAdPostingBalance(userId, session);
            if (!postingBalance || postingBalance.totalRemaining < 1) {
                const err: any = new Error('Insufficient posting credits for repost');
                err.statusCode = 402;
                throw err;
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


// ─────────────────────────────────────────────────
// STATUS VALIDATION
// ─────────────────────────────────────────────────

export const isValidAdStatus = (status: string): boolean => {
    if (!status || typeof status !== 'string') return false;
    return (AD_STATUS_VALUES as readonly string[]).includes(status);
};


export const preparePayload = AdCreationService.preparePayload;
export const createAd = orchestratorCreateAd;
