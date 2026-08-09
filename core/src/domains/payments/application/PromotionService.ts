import mongoose, { type ClientSession } from 'mongoose';
import Boost, { type IBoost } from '../../../models/Boost';
import UserWallet from '../../../models/UserWallet';
import CreditTransaction from '../../../models/CreditTransaction';
import { AppError } from '../../../utils/AppError';
import logger from '../../../utils/logger';

export interface ApplyBoostParams {
    userId: string;
    listingId: string;
    entityType?: 'ad' | 'service' | 'part';
    durationDays?: number;
    session?: ClientSession;
}

export interface ApplySpotlightParams {
    userId: string;
    listingId: string;
    entityType?: 'ad' | 'service' | 'part';
    spotlightType?: 'spotlight_hp' | 'spotlight_cat';
    durationDays?: number;
    session?: ClientSession;
}

export class PromotionService {
    /**
     * Applies a Boost promotion to a listing using 1 credit from Entitlement ledger or UserWallet.
     */
    static async applyBoost(params: ApplyBoostParams): Promise<IBoost> {
        const { userId, listingId, entityType = 'ad', durationDays = 30 } = params;

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(listingId)) {
            throw new AppError('Invalid user or listing ID', 400, 'INVALID_ID');
        }

        const userObjId = new mongoose.Types.ObjectId(userId);
        const idFilter = { $in: [userObjId, userId] };

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const entitlement = await (await import('../../../models/Entitlement')).default.findOne({
                userId: idFilter,
                type: 'PUSH_TO_TOP',
                status: 'ACTIVE',
                remaining: { $gt: 0 },
            }).session(session);

            const wallet = await UserWallet.findOne({ userId: idFilter }).session(session);

            if (entitlement) {
                entitlement.consumed = (entitlement.consumed || 0) + 1;
                entitlement.remaining = Math.max(0, entitlement.remaining - 1);
                if (entitlement.remaining === 0) {
                    entitlement.status = 'EXHAUSTED';
                }
                await entitlement.save({ session });
                if (wallet) {
                    wallet.boostCredits = Math.max(0, (wallet.boostCredits || 0) - 1);
                    await wallet.save({ session });
                }
            } else if (wallet && (wallet.boostCredits || 0) > 0) {
                wallet.boostCredits = (wallet.boostCredits || 0) - 1;
                await wallet.save({ session });
            } else {
                throw new AppError('Insufficient Top Ad credits', 400, 'INSUFFICIENT_TOP_AD_CREDITS');
            }

            const startsAt = new Date();
            const endsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

            const [boost] = await Boost.create([{
                entityId: new mongoose.Types.ObjectId(listingId),
                entityType,
                boostType: 'push_to_top',
                startsAt,
                endsAt,
                isActive: true,
            }], { session });

            // Synchronize Ad document fields & bump recency timestamp
            const AdModel = (await import('../../../models/Ad')).default;
            const now = new Date();
            await AdModel.updateOne(
                { _id: new mongoose.Types.ObjectId(listingId) },
                { 
                    $set: { 
                        isBoosted: true, 
                        boostExpiresAt: endsAt,
                        createdAt: now, 
                        updatedAt: now 
                    } 
                },
                { session }
            );

            // Immutable Audit Log
            await CreditTransaction.create([{
                userId: userObjId,
                listingId: new mongoose.Types.ObjectId(listingId),
                creditPool: 'PURCHASED',
                amount: 1,
                type: 'DEBIT',
                reason: `Applied ${durationDays}-day Boost promotion to ${entityType} ${listingId}`,
                metadata: { boostId: boost._id, boostType: 'push_to_top' },
            }], { session });

            await session.commitTransaction();
            session.endSession();

            try {
                const { invalidateAdFeedCaches, invalidatePublicAdCache } = await import('../../../utils/redisCache');
                const { DashboardFacade } = await import('./DashboardFacade');
                await Promise.all([
                    invalidateAdFeedCaches().catch(() => {}),
                    invalidatePublicAdCache(listingId).catch(() => {}),
                    DashboardFacade.invalidateCache(userId).catch(() => {}),
                ]);
            } catch {
                // Non-blocking cache fallback
            }

            logger.info('[PROMOTION_SERVICE] Boost applied successfully', { userId, listingId, durationDays });
            return boost;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * Applies a Spotlight promotion to a listing using 1 spotlightCredit from Entitlement ledger or UserWallet.
     */
    static async applySpotlight(params: ApplySpotlightParams): Promise<IBoost> {
        const { userId, listingId, entityType = 'ad', spotlightType = 'spotlight_hp', durationDays = 30 } = params;

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(listingId)) {
            throw new AppError('Invalid user or listing ID', 400, 'INVALID_ID');
        }

        const userObjId = new mongoose.Types.ObjectId(userId);
        const idFilter = { $in: [userObjId, userId] };

        const entitlement = await (await import('../../../models/Entitlement')).default.findOne({
            userId: idFilter,
            type: { $in: ['SPOTLIGHT_CAT', 'SPOTLIGHT_HP'] },
            status: 'ACTIVE',
            remaining: { $gt: 0 },
        });

        const wallet = await UserWallet.findOne({ userId: idFilter });

        if (entitlement) {
            entitlement.consumed = (entitlement.consumed || 0) + 1;
            entitlement.remaining = Math.max(0, entitlement.remaining - 1);
            if (entitlement.remaining === 0) {
                entitlement.status = 'EXHAUSTED';
            }
            await entitlement.save();
            if (wallet) {
                wallet.spotlightCredits = Math.max(0, (wallet.spotlightCredits || 0) - 1);
                await wallet.save();
            }
        } else if (wallet && (wallet.spotlightCredits || 0) > 0) {
            wallet.spotlightCredits = (wallet.spotlightCredits || 0) - 1;
            await wallet.save();
        } else {
            throw new AppError('Insufficient spotlight credits', 400, 'INSUFFICIENT_SPOTLIGHT_CREDITS');
        }

        const startsAt = new Date();
        const endsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        const boost = await Boost.create({
            entityId: new mongoose.Types.ObjectId(listingId),
            entityType,
            boostType: spotlightType,
            startsAt,
            endsAt,
            isActive: true,
        });

        // Synchronize Ad document fields for search ranking aggregation & frontend badges
        const AdModel = (await import('../../../models/Ad')).default;
        await AdModel.updateOne(
            { _id: new mongoose.Types.ObjectId(listingId) },
            { $set: { isSpotlight: true, spotlightExpiresAt: endsAt } }
        );

        // Invalidate feed and detail caches so fresh DTO with isSpotlight: true renders immediately
        try {
            const { invalidateAdFeedCaches, invalidatePublicAdCache } = await import('../../../utils/redisCache');
            const { DashboardFacade } = await import('./DashboardFacade');
            await Promise.all([
                invalidateAdFeedCaches().catch(() => {}),
                invalidatePublicAdCache(listingId).catch(() => {}),
                DashboardFacade.invalidateCache(userId).catch(() => {}),
            ]);
        } catch {
            // Non-blocking cache fallback
        }

        // Immutable Audit Log
        await CreditTransaction.create({
            userId: userObjId,
            listingId: new mongoose.Types.ObjectId(listingId),
            creditPool: 'PURCHASED',
            amount: 1,
            type: 'DEBIT',
            reason: `Applied ${durationDays}-day Spotlight promotion (${spotlightType}) to ${entityType} ${listingId}`,
            metadata: { boostId: boost._id, boostType: spotlightType },
        });

        logger.info('[PROMOTION_SERVICE] Spotlight applied successfully', { userId, listingId, spotlightType, durationDays });
        return boost;
    }

    /**
     * Gets all active, non-expired promotions for a given listing.
     */
    static async getActivePromotions(entityId: string): Promise<IBoost[]> {
        if (!mongoose.Types.ObjectId.isValid(entityId)) {
            return [];
        }
        const now = new Date();
        return Boost.find({
            entityId: new mongoose.Types.ObjectId(entityId),
            isActive: true,
            startsAt: { $lte: now },
            endsAt: { $gte: now },
        });
    }
}
