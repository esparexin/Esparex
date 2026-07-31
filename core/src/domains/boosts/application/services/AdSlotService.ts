/**
 * ESPAREX — AdSlotService.ts
 * Manage monthly free ad slots, paid ad credits, and posting balances.
 * Read-optimized: getAdPostingBalance executes fast read before triggering wallet sync.
 */
import { ClientSession, Types } from "mongoose";
import UserWallet from "../../../../models/UserWallet";
import CreditTransaction from "../../../../models/CreditTransaction";
import redisClient from "../../../../config/redis";
import { AppError } from "../../../../utils/AppError";
import { BusinessErrorCode } from "@esparex/contracts";

import Plan from "../../../../models/Plan";
import logger from "../../../../utils/logger";

export const DEFAULT_FREE_AD_SLOTS_FALLBACK = 5;
export const MONTHLY_FREE_AD_SLOTS = DEFAULT_FREE_AD_SLOTS_FALLBACK;

/**
 * Resolves the monthly free ad slot limit dynamically from the active Default Free Plan.
 * Uses DEFAULT_FREE_AD_SLOTS_FALLBACK (5) as emergency safeguard if default plan lookup fails.
 */
export async function getMonthlyFreeAdSlotLimit(): Promise<number> {
    try {
        const defaultPlan = await Plan.findOne({ isDefault: true, active: true });
        if (defaultPlan) {
            const limit = defaultPlan.limits?.maxAds ?? defaultPlan.credits;
            if (typeof limit === 'number' && limit >= 0) {
                return limit;
            }
        }
        logger.error('[CRITICAL] Active Default Free Plan missing or invalid maxAds limit. Using fallback.', {
            fallback: DEFAULT_FREE_AD_SLOTS_FALLBACK,
        });
        return DEFAULT_FREE_AD_SLOTS_FALLBACK;
    } catch (err) {
        logger.error('[CRITICAL] Failed to resolve active Default Free Plan for slot limit. Using fallback.', {
            error: err instanceof Error ? err.message : String(err),
            fallback: DEFAULT_FREE_AD_SLOTS_FALLBACK,
        });
        return DEFAULT_FREE_AD_SLOTS_FALLBACK;
    }
}

export type AdPostingSlotSource =
    | 'free_slot'
    | 'ad_credit'
    | 'active_slot_limit'
    | 'idempotency_hit';

export interface AdPostingBalance {
    freeLimit: number;
    freeUsed: number;
    freeRemaining: number;
    paidCredits: number;
    totalRemaining: number;
}

/**
 * Returns the start of the current monthly cycle in UTC.
 */
export function getMonthlyCycleStart(now?: Date): Date {
    const d = now ?? new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Ensures wallet exists and monthly free ad count resets at cycle start.
 */
export async function syncWalletCycle(
    userId: string,
    session?: ClientSession
): Promise<void> {
    const cycleStart = getMonthlyCycleStart();
    const existingWallet = await UserWallet.findOne({ userId })
        .session(session ?? null)
        .lean();

    const lastMonthlyReset = existingWallet?.lastMonthlyReset
        ? new Date(existingWallet.lastMonthlyReset)
        : null;

    const requiresReset =
        !existingWallet ||
        !lastMonthlyReset ||
        lastMonthlyReset.getTime() < cycleStart.getTime();

    if (!requiresReset) return;

    await UserWallet.updateOne(
        { userId },
        {
            $setOnInsert: { userId, adCredits: 0 },
            $set: { monthlyFreeAdsUsed: 0, lastMonthlyReset: cycleStart },
        },
        { upsert: true, session }
    );
}

/**
 * Read-optimized balance lookup (fast read first, writes only on cycle reset).
 */
export async function getAdPostingBalance(
    userId: string,
    session?: ClientSession
): Promise<AdPostingBalance> {
    const cycleStart = getMonthlyCycleStart();
    let walletQuery = UserWallet.findOne({ userId });
    if (session) walletQuery = walletQuery.session(session);

    let wallet = await walletQuery.lean();
    const lastMonthlyReset = wallet?.lastMonthlyReset ? new Date(wallet.lastMonthlyReset) : null;
    const requiresReset = !wallet || !lastMonthlyReset || lastMonthlyReset.getTime() < cycleStart.getTime();

    if (requiresReset) {
        await syncWalletCycle(userId, session);
        let refreshedQuery = UserWallet.findOne({ userId });
        if (session) refreshedQuery = refreshedQuery.session(session);
        wallet = await refreshedQuery.lean();
    }

    const freeSlotLimit = await getMonthlyFreeAdSlotLimit();
    const freeUsed = Math.max(0, Number(wallet?.monthlyFreeAdsUsed ?? 0));
    const freeRemaining = Math.max(0, freeSlotLimit - freeUsed);
    const paidCredits = Math.max(0, Number(wallet?.adCredits ?? 0));

    return {
        freeLimit: freeSlotLimit,
        freeUsed,
        freeRemaining,
        paidCredits,
        totalRemaining: freeRemaining + paidCredits,
    };
}

/**
 * Add paid credits to the user's wallet.
 */
export async function addAdCredits(
    userId: string,
    credits: number,
    session?: ClientSession
): Promise<void> {
    if (credits <= 0) return;
    await syncWalletCycle(userId, session);
    await UserWallet.updateOne({ userId }, { $inc: { adCredits: credits } }, { session });
}

/**
 * Legacy standalone helper. Delegates directly to AdSlotService.consumeSlot for SSOT compliance.
 */
export async function consumeAdSlot(
    userId: string,
    session?: ClientSession
): Promise<void> {
    await AdSlotService.consumeSlot(userId, session);
}

/**
 * Returns true if the user has available ad slots remaining.
 */
export async function canPostAd(
    userId: string,
    session?: ClientSession
): Promise<boolean> {
    const balance = await getAdPostingBalance(userId, session);
    return balance.totalRemaining > 0;
}

/**
 * Acquires a Redis-backed distributed lock before executing user quota operations.
 */
export async function withUserPostingLock<T>(
    userId: string,
    ttlSeconds: number,
    callback: () => Promise<T>
): Promise<T> {
    const lockKey = `lock:posting_quota:${userId}`;
    const acquired = await redisClient.set(lockKey, "locked", "EX", ttlSeconds, "NX");

    if (!acquired) {
        throw new AppError(
            "Please wait. Another request is currently consuming your posting quota.",
            429,
            BusinessErrorCode.RATE_LIMIT_EXCEEDED
        );
    }

    try {
        return await callback();
    } finally {
        await redisClient.del(lockKey);
    }
}

/**
 * Single Source of Truth for ad slot consumption and transaction audit logging.
 */
export const AdSlotService = {
    async consumeSlot(
        userId: string,
        session?: ClientSession,
        adId?: string
    ): Promise<{ source: AdPostingSlotSource }> {
        await syncWalletCycle(userId, session);
        const balance = await getAdPostingBalance(userId, session);

        if (balance.totalRemaining <= 0) {
            throw new AppError(
                "No ad posting slots available this month. Buy Ad Pack credits or wait for monthly reset.",
                403,
                BusinessErrorCode.QUOTA_EXHAUSTED
            );
        }

        const isFreeSlot = balance.freeRemaining > 0;
        const source: AdPostingSlotSource = isFreeSlot ? "free_slot" : "ad_credit";

        if (isFreeSlot) {
            await UserWallet.updateOne({ userId }, { $inc: { monthlyFreeAdsUsed: 1 } }, { session });
        } else {
            await UserWallet.updateOne({ userId }, { $inc: { adCredits: -1 } }, { session });
        }

        // Audit Trail: Log immutable credit transaction record
        await CreditTransaction.create(
            [
                {
                    userId: new Types.ObjectId(userId),
                    listingId: adId && Types.ObjectId.isValid(adId) ? new Types.ObjectId(adId) : undefined,
                    creditPool: isFreeSlot ? 'MONTHLY_FREE' : 'PURCHASED',
                    amount: 1,
                    type: 'DEBIT',
                    reason: 'Ad slot consumption',
                },
            ],
            { session }
        );

        return { source };
    },
};
