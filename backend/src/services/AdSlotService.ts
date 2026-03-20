import mongoose, { ClientSession } from 'mongoose';
import UserWallet from '../models/UserWallet';
import { recordTransaction, consumeCredit } from './WalletService';

export type AdPostingSlotSource = 'free_slot' | 'ad_credit' | 'idempotency_hit';

export const MONTHLY_FREE_AD_SLOTS = 5;

export const getMonthlyCycleStart = (now: Date = new Date()) =>
    new Date(now.getFullYear(), now.getMonth(), 1);

const syncWalletCycle = async (userId: string, session?: ClientSession) => {
    const cycleStart = getMonthlyCycleStart();
    await UserWallet.updateOne(
        {
            userId,
            $or: [
                { lastMonthlyReset: { $exists: false } },
                { lastMonthlyReset: { $lt: cycleStart } }
            ]
        },
        {
            $set: {
                lastMonthlyReset: cycleStart,
                monthlyFreeAdsUsed: 0
            }
        },
        { upsert: true, session }
    );
};

export const getAdPostingBalance = async (userId: string, session?: ClientSession) => {
    await syncWalletCycle(userId, session);
    let walletQuery = UserWallet.findOne({ userId });
    if (session) walletQuery = walletQuery.session(session);
    const wallet = await walletQuery.lean();

    const freeUsed = Math.max(0, wallet?.monthlyFreeAdsUsed || 0);
    const freeRemaining = Math.max(0, MONTHLY_FREE_AD_SLOTS - freeUsed);
    const paidCredits = Math.max(0, wallet?.adCredits || 0);

    return {
        freeLimit: MONTHLY_FREE_AD_SLOTS,
        freeUsed,
        freeRemaining,
        paidCredits,
        totalRemaining: freeRemaining + paidCredits
    };
};

import redisClient from '../config/redis';

export const withUserPostingLock = async <T>(userId: string, ttlSeconds: number, callback: () => Promise<T>): Promise<T> => {
    const lockKey = `lock:posting_quota:${userId}`;
    const acquired = await redisClient.set(lockKey, 'locked', 'EX', ttlSeconds, 'NX');
    
    if (!acquired) {
        throw Object.assign(new Error('Please wait. Another request is currently consuming your posting quota.'), { statusCode: 429 });
    }
    
    try {
        return await callback();
    } finally {
        await redisClient.del(lockKey).catch(() => {});
    }
};

/**
 * AdSlotService
 * Responsible for atomic deduction of ad posting slots.
 * Supports idempotency via adId tracking.
 */
export class AdSlotService {
    /**
     * Consume an ad posting slot from the user's wallet.
     * Prioritizes monthly free slots, then falls back to paid ad credits.
     */
    static async consumeSlot(
        userId: string,
        session?: ClientSession,
        adId?: string
    ): Promise<{ source: AdPostingSlotSource }> {
        return withUserPostingLock(userId, 30, async () => {
        const now = new Date();

        // 0. Ensure monthly cycle is synced (SSOT Enforcement)
        await syncWalletCycle(userId, session);

        // 1. Idempotency Check
        if (adId && mongoose.Types.ObjectId.isValid(adId)) {
            const adObjectId = new mongoose.Types.ObjectId(adId);
            const alreadyConsumed = await UserWallet.findOne({
                userId,
                consumedSlots: adObjectId
            }).session(session || null).lean();

            if (alreadyConsumed) {
                return { source: 'idempotency_hit' };
            }
        }

        const adObjectId = adId && mongoose.Types.ObjectId.isValid(adId) 
            ? new mongoose.Types.ObjectId(adId) 
            : null;

        // 2. Try Monthly Free Slot
        const freeSlotWallet = await UserWallet.findOneAndUpdate(
            {
                userId,
                monthlyFreeAdsUsed: { $lt: MONTHLY_FREE_AD_SLOTS }
            },
            {
                $inc: { monthlyFreeAdsUsed: 1 },
                ...(adObjectId ? { $addToSet: { consumedSlots: adObjectId } } : {}),
                $setOnInsert: {
                    adCredits: 0,
                    spotlightCredits: 0,
                    smartAlertSlots: 2,
                    lastMonthlyReset: getMonthlyCycleStart(now)
                }
            },
            { upsert: true, new: true, session }
        ).lean();

        if (freeSlotWallet) {
            await recordTransaction({
                userId,
                amount: 1,
                type: 'debit',
                reason: 'Consumed monthly free ad slot',
                metadata: { adId, source: 'free_slot' },
                session
            });
            return { source: 'free_slot' };
        }

        // 3. Fallback to Paid Ad Credits (via Canonical WalletService)
        try {
            await consumeCredit({
                userId,
                creditType: 'adCredits',
                amount: 1,
                reason: 'Consumed paid ad credit for new listing',
                metadata: { adId, source: 'ad_credit' },
                session
            });

            // Ensure adId is recorded for idempotency even when using WalletService
            if (adObjectId) {
                await UserWallet.updateOne(
                    { userId },
                    { $addToSet: { consumedSlots: adObjectId } },
                    { session }
                );
            }

            return { source: 'ad_credit' };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes('Insufficient')) {
                throw new Error('No ad posting slots available. Buy Ad Pack credits or wait for monthly reset.');
            }
            throw error;
        }
        });
    }
}
