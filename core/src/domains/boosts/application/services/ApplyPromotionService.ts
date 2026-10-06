/**
 * ESPAREX — ApplyPromotionService.ts
 *
 * CANONICAL promotion application flow (P0-1 consolidation, DECISION-GATE §1/§3).
 * Single `applyPromotion` owned by the boosts domain; payments exposes the
 * credit-debit port only; the retired flows
 * (`payments/application/PromotionService`, `listings/.../AdPromotionService.promoteAdLogic`)
 * lose and are scheduled for deletion in Phase 4.
 *
 * Survivor semantics (recorded 2026-10-06):
 *  - Eligibility: UNION of the boosts `PromotionPolicyService` tier policy
 *    (PromotionService path: LIVE status, listing-type gate, spotlight/top-ad
 *    hierarchy) and the listings flow's account-standing guards
 *    (trustScore >= 30, strikeCount < 2, moderation standing, 3-concurrent-spotlight cap).
 *  - Credit debit: exactly 1 credit per promotion via the payments credit-debit port
 *    (entitlement-first FEFO with wallet fallback — the retired payments flow's
 *    semantics). The retired listings flow charged 1 credit PER DAY; the flat
 *    per-promotion debit survives because entitlement packs are sold per promotion.
 *  - Boost window: `computeBoostWindow` CLAMPS to the ad expiry (retired payments
 *    flow); the retired listings flow's reject-instead-of-clamp loses.
 *  - Idempotency: re-applying while an identical active boost exists is rejected
 *    (ACTIVE_PROMOTION_EXISTS) and never double-debits; the check runs inside the
 *    transaction so a sequential re-apply cannot slip a second debit through.
 *  - Admin channel keeps the retired listings flow's bypass (no eligibility, no
 *    debit) and its extend-existing-spotlight behavior.
 *
 * Rollout: `FeatureFlag.ENABLE_UNIFIED_APPLY_PROMOTION` (default ON). When OFF,
 * each caller falls back to its own retired legacy flow (rollback only).
 */
import mongoose, { Types } from 'mongoose';
import { LISTING_STATUS } from '@esparex/contracts';
import { AppError } from '../../../../shared-kernel/errors/AppError';
import logger from '../../../../utils/logger';
import { FeatureFlag, isEnabled } from '../../../../config/featureFlags';
import { PromotionPolicyService } from './PromotionPolicyService';
import { computeBoostWindow } from '../../shared/computeBoostWindow';
import type { PromotionCreditType } from '../ports/PromotionCreditPort';
import { paymentsPromotionCreditPort } from '../../../payments/application/PromotionCreditPortAdapter';
import { applyPromotionLegacy } from './applyPromotionLegacy';
import { getListingsCache } from '../../../../composition/listings';
import type {
    PromotionKind,
    ApplyPromotionParams,
    ApplyPromotionResult,
} from './applyPromotionTypes';
import type { IBoost } from '../../../../models/Boost';

const DEFAULT_DURATION_DAYS = 30;

type CanonicalBoostType = 'push_to_top' | 'spotlight_hp' | 'spotlight_cat';

/** Minimal structural view of the Ad document needed for promotion decisions. */
interface PromotionAdDoc {
    isDeleted?: boolean;
    status?: string;
    listingType?: string;
    sellerId?: { toString(): string };
    isSpotlight?: boolean;
    spotlightExpiresAt?: Date | string | null;
    isBoosted?: boolean;
    boostExpiresAt?: Date | string | null;
    moderationStatus?: string;
    expiresAt?: Date | string | null;
}

const toBoostType = (kind: PromotionKind): CanonicalBoostType =>
    kind === 'push_to_top' || kind === 'boost' ? 'push_to_top' : kind;

const toCreditType = (kind: PromotionKind): PromotionCreditType =>
    kind === 'push_to_top' || kind === 'boost' ? 'boostCredits' : 'spotlightCredits';

const toRequestedType = (kind: PromotionKind): string =>
    kind === 'boost' ? 'push_to_top' : kind;

const BLOCKED_MODERATION_STATES = new Set(['auto_hidden', 'rejected', 'held_for_review']);

const isSpotlightKind = (kind: PromotionKind): boolean =>
    kind === 'spotlight_hp' || kind === 'spotlight_cat';

/**
 * Applies a boost/spotlight promotion to a listing through the single canonical flow.
 */
export async function applyPromotion(params: ApplyPromotionParams): Promise<ApplyPromotionResult> {
    const {
        userId,
        listingId,
        entityType = 'ad',
        promotionType,
        durationDays = DEFAULT_DURATION_DAYS,
        isAdmin = false,
        legacySource = 'listing-controller',
        creditPort = paymentsPromotionCreditPort,
    } = params;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(listingId)) {
        throw new AppError('Invalid user or listing ID', 400, 'INVALID_ID');
    }

    // Rollback hatch: retired legacy flows, per-caller. Remove with the flag (Phase 4).
    if (!(await isEnabled(FeatureFlag.ENABLE_UNIFIED_APPLY_PROMOTION))) {
        return applyPromotionLegacy({ userId, listingId, entityType, promotionType, durationDays, isAdmin, legacySource });
    }

    const AdModel = (await import('@esparex/core/models/Ad')).default;
    const BoostModel = (await import('@esparex/core/models/Boost')).default;
    const UserModel = (await import('@esparex/core/models/User')).default;

    const adDoc = (await AdModel.findById(listingId).lean()) as PromotionAdDoc | null;
    if (!adDoc || adDoc.isDeleted) {
        throw new AppError('Listing not found or has been deleted', 404, 'LISTING_NOT_FOUND');
    }

    const now = new Date();
    if (adDoc.status === 'expired' || (adDoc.expiresAt && new Date(adDoc.expiresAt).getTime() <= now.getTime())) {
        throw new AppError('Cannot apply promotion to an expired listing. Please renew the ad first.', 400, 'AD_EXPIRED');
    }

    if (!isAdmin) {
        // (a) Boosts-canonical tier policy — survives from the retired payments flow.
        const policyResult = PromotionPolicyService.validatePromotionEligibility({
            listingType: adDoc.listingType || 'ad',
            status: adDoc.status || '',
            isSpotlight: adDoc.isSpotlight,
            spotlightExpiresAt: adDoc.spotlightExpiresAt,
            isBoosted: adDoc.isBoosted,
            boostExpiresAt: adDoc.boostExpiresAt,
            requestedType: toRequestedType(promotionType),
        });
        if (!policyResult.allowed) {
            throw new AppError(policyResult.reason || 'Promotion not allowed', 403, policyResult.code || 'PROMOTION_POLICY_REJECTED');
        }

        // (b) Account-standing guards — survive from the retired listings flow.
        if (adDoc.sellerId?.toString() !== userId.toString()) {
            throw new AppError('Unauthorized', 403);
        }
        const user = await UserModel.findById(userId).select('trustScore strikeCount').lean();
        if (!user || Number(user.trustScore) < 30 || Number(user.strikeCount) >= 2) {
            throw new AppError('Account ineligible for promotion due to trust or moderation standing.', 403);
        }
        if (BLOCKED_MODERATION_STATES.has(String(adDoc.moderationStatus))) {
            throw new AppError('Ad must be in normal standing to be promoted.', 403);
        }
        if (isSpotlightKind(promotionType) && !adDoc.isSpotlight) {
            const activePromotions = await AdModel.countDocuments({
                sellerId: new Types.ObjectId(userId),
                isSpotlight: true,
                status: LISTING_STATUS.LIVE,
            });
            if (activePromotions >= 3) {
                throw new AppError('Maximum 3 active spotlight promotions allowed concurrently.', 403);
            }
        }
    }

    const boostType = toBoostType(promotionType);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Idempotency gate inside the transaction: an identical active boost must
        // never produce a second debit, even on a sequential re-apply.
        const existingActive = await BoostModel.findOne({
            entityId: new Types.ObjectId(listingId),
            boostType,
            isActive: true,
            endsAt: { $gt: now },
        }).session(session);

        let endsAt: Date;
        let startsAt: Date;
        let effectiveDays: number;
        let boost: IBoost;

        if (existingActive && isAdmin && isSpotlightKind(promotionType)) {
            // Admin extend (retired listings flow behavior): stretch the window, no debit.
            const window = computeBoostWindow(adDoc, durationDays, new Date(existingActive.endsAt));
            startsAt = window.startsAt;
            endsAt = window.endsAt;
            effectiveDays = window.effectiveDays;
            await BoostModel.updateOne(
                { _id: existingActive._id },
                { $set: { endsAt } },
                { session }
            );
            boost = existingActive;
        } else {
            if (existingActive) {
                throw new AppError(
                    'An active promotion of this type already exists for this listing.',
                    409,
                    'ACTIVE_PROMOTION_EXISTS'
                );
            }

            if (!isAdmin) {
                await creditPort.debitPromotionCredit({
                    userId,
                    creditType: toCreditType(promotionType),
                    amount: 1,
                    reason: `Applied ${durationDays}-day ${boostType} promotion to ${entityType} ${listingId}`,
                    metadata: { listingId, promotionType, durationDays, entityType },
                    session,
                });
            }

            const window = computeBoostWindow(adDoc, durationDays);
            startsAt = window.startsAt;
            endsAt = window.endsAt;
            effectiveDays = window.effectiveDays;

            [boost] = await BoostModel.create([{
                entityId: new Types.ObjectId(listingId),
                entityType,
                boostType,
                startsAt,
                endsAt,
                isActive: true,
            }], { session });
        }

        // Synchronize the Ad document for search ranking aggregation & badges.
        if (boostType === 'push_to_top') {
            await AdModel.updateOne(
                { _id: new Types.ObjectId(listingId) },
                { $set: { isBoosted: true, boostExpiresAt: endsAt } },
                { session }
            );
        } else {
            await AdModel.updateOne(
                { _id: new Types.ObjectId(listingId) },
                {
                    $set: { isSpotlight: true, spotlightExpiresAt: endsAt, spotlightWarningCount: 0 },
                    $unset: { spotlightWarningSentAt: 1 },
                },
                { session }
            );
        }

        // Immutable audit log (retired payments flow).
        const CreditTransactionModel = (await import('@esparex/core/models/CreditTransaction')).default;
        await CreditTransactionModel.create([{
            userId: new Types.ObjectId(userId),
            listingId: new Types.ObjectId(listingId),
            creditPool: 'PURCHASED',
            amount: 1,
            type: 'DEBIT',
            reason: `Applied ${effectiveDays}-day ${boostType} promotion to ${entityType} ${listingId}`,
            metadata: { boostId: boost._id, boostType, effectiveDurationDays: effectiveDays, adExpiresAt: adDoc.expiresAt },
        }], { session });

        await session.commitTransaction();
        session.endSession();

        setImmediate(() => {
            getListingsCache().invalidateAdFeedCaches().catch(() => {});
            getListingsCache().invalidatePublicAdCache(listingId).catch(() => {});
        });

        logger.info('[APPLY_PROMOTION] Promotion applied via unified boosts flow', {
            userId, listingId, promotionType, durationDays: effectiveDays,
        });
        return { boost, effectiveDays };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}
