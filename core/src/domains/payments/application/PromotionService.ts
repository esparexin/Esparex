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
     * Applies a Boost promotion to a listing using 1 boostCredit from the user's wallet.
     */
    static async applyBoost(params: ApplyBoostParams): Promise<IBoost> {
        const { userId, listingId, entityType = 'ad', durationDays = 7 } = params;

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(listingId)) {
            throw new AppError('Invalid user or listing ID', 400, 'INVALID_ID');
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const wallet = await UserWallet.findOne({ userId: new mongoose.Types.ObjectId(userId) }).session(session);
            if (!wallet || (wallet.boostCredits || 0) < 1) {
                throw new AppError('Insufficient boost credits', 400, 'INSUFFICIENT_BOOST_CREDITS');
            }

            // Deduct 1 boost credit
            wallet.boostCredits = (wallet.boostCredits || 0) - 1;
            await wallet.save({ session });

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

            // Immutable Audit Log
            await CreditTransaction.create([{
                userId: new mongoose.Types.ObjectId(userId),
                listingId: new mongoose.Types.ObjectId(listingId),
                creditPool: 'PURCHASED',
                amount: 1,
                type: 'DEBIT',
                reason: `Applied ${durationDays}-day Boost promotion to ${entityType} ${listingId}`,
                metadata: { boostId: boost._id, boostType: 'push_to_top' },
            }], { session });

            await session.commitTransaction();
            session.endSession();

            logger.info('[PROMOTION_SERVICE] Boost applied successfully', { userId, listingId, durationDays });
            return boost;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * Applies a Spotlight promotion to a listing using 1 spotlightCredit from the user's wallet.
     */
    static async applySpotlight(params: ApplySpotlightParams): Promise<IBoost> {
        const { userId, listingId, entityType = 'ad', spotlightType = 'spotlight_hp', durationDays = 7 } = params;

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(listingId)) {
            throw new AppError('Invalid user or listing ID', 400, 'INVALID_ID');
        }

        const wallet = await UserWallet.findOne({ userId: new mongoose.Types.ObjectId(userId) });
        if (!wallet || (wallet.spotlightCredits || 0) < 1) {
            throw new AppError('Insufficient spotlight credits', 400, 'INSUFFICIENT_SPOTLIGHT_CREDITS');
        }

        // Deduct 1 spotlight credit
        wallet.spotlightCredits = (wallet.spotlightCredits || 0) - 1;
        await wallet.save();

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

        // Immutable Audit Log
        await CreditTransaction.create({
            userId: new mongoose.Types.ObjectId(userId),
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
