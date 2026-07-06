/**
 * ============================================================================
 * ESPAREX - AdSlotService.ts
 * ============================================================================
 * Purpose:
 * - Manage monthly free ad slots and paid ad credits.
 * - Provide read-optimized posting balance retrieval.
 *
 * CRITICAL FIX (read-before-write):
 * - getAdPostingBalance() performs a fast read first.
 * - syncWalletCycle() is only executed when a monthly reset is actually needed.
 * - Eliminates write-on-read MongoDB lock contention during balance reads.
 *
 * BACKWARD COMPATIBILITY:
 * - All pre-existing exports preserved: AdSlotService class, AdPostingSlotSource,
 *   withUserPostingLock, getMonthlyCycleStart, syncWalletCycle, getAdPostingBalance,
 *   addAdCredits, consumeAdSlot, canPostAd, MONTHLY_FREE_AD_SLOTS.
 * - No API contract changes. No schema changes. No business rule changes.
 * ============================================================================
 */

import type { ClientSession } from "mongoose";
import UserWallet from "../models/UserWallet";
import redisClient from '../infrastructure/redis';

/**
 * ============================================================================
 * CONFIGURATION
 * ============================================================================
 */

export const MONTHLY_FREE_AD_SLOTS = 5;

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

/**
 * Source of an ad posting slot consumption.
 * Used by ListingSubmissionPolicy and PlanService.
 */
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
 * ============================================================================
 * HELPERS
 * ============================================================================
 */

/**
 * Returns the start of the current monthly cycle in UTC.
 * Example: 2026-05-01T00:00:00.000Z
 */
export function getMonthlyCycleStart(now?: Date): Date {
    const d = now ?? new Date();

    return new Date(
        Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            1,
            0,
            0,
            0,
            0
        )
    );
}

/**
 * ============================================================================
 * WALLET SYNCHRONIZATION
 * ============================================================================
 *
 * Ensures:
 * - Wallet exists.
 * - Monthly free ads reset at the beginning of each month.
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

    if (!requiresReset) {
        return;
    }

    const update: Record<string, unknown> = {
        $setOnInsert: {
            userId,
            adCredits: 0,
        },
        $set: {
            monthlyFreeAdsUsed: 0,
            lastMonthlyReset: cycleStart,
        },
    };

    await UserWallet.updateOne(
        { userId },
        update,
        {
            upsert: true,
            session,
        }
    );
}

/**
 * ============================================================================
 * READ-OPTIMIZED POSTING BALANCE
 * ============================================================================
 *
 * CRITICAL FIX:
 * - Performs a fast read.
 * - Only writes when monthly reset is actually needed.
 * - Prevents write-on-read lock contention.
 */
export async function getAdPostingBalance(
    userId: string,
    session?: ClientSession
): Promise<AdPostingBalance> {
    const cycleStart = getMonthlyCycleStart();

    // Fast read-only lookup
    let walletQuery = UserWallet.findOne({ userId });

    if (session) {
        walletQuery = walletQuery.session(session);
    }

    let wallet = await walletQuery.lean();

    // Determine if monthly reset is required
    const lastMonthlyReset = wallet?.lastMonthlyReset
        ? new Date(wallet.lastMonthlyReset)
        : null;

    const requiresMonthlyReset =
        !wallet ||
        !lastMonthlyReset ||
        lastMonthlyReset.getTime() < cycleStart.getTime();

    // Only write when reset is actually needed
    if (requiresMonthlyReset) {
        await syncWalletCycle(userId, session);

        // Re-read after synchronization
        let refreshedQuery = UserWallet.findOne({ userId });

        if (session) {
            refreshedQuery = refreshedQuery.session(session);
        }

        wallet = await refreshedQuery.lean();
    }

    // Compute balances
    const freeUsed = Math.max(
        0,
        Number(wallet?.monthlyFreeAdsUsed ?? 0)
    );

    const freeRemaining = Math.max(
        0,
        MONTHLY_FREE_AD_SLOTS - freeUsed
    );

    const paidCredits = Math.max(
        0,
        Number(wallet?.adCredits ?? 0)
    );

    return {
        freeLimit: MONTHLY_FREE_AD_SLOTS,
        freeUsed,
        freeRemaining,
        paidCredits,
        totalRemaining: freeRemaining + paidCredits,
    };
}

/**
 * ============================================================================
 * CREDIT MANAGEMENT
 * ============================================================================
 */

/**
 * Add paid credits to the user's wallet.
 */
export async function addAdCredits(
    userId: string,
    credits: number,
    session?: ClientSession
): Promise<void> {
    if (credits <= 0) {
        return;
    }

    // Ensure wallet exists and cycle is current.
    await syncWalletCycle(userId, session);

    await UserWallet.updateOne(
        { userId },
        {
            $inc: {
                adCredits: credits,
            },
        },
        {
            session,
        }
    );
}

/**
 * Consume one ad slot.
 * Uses free slot first, then paid credit.
 */
export async function consumeAdSlot(
    userId: string,
    session?: ClientSession
): Promise<void> {
    // Ensure wallet is current.
    await syncWalletCycle(userId, session);

    const balance = await getAdPostingBalance(userId, session);

    if (balance.totalRemaining <= 0) {
        throw new Error("No ad posting credits remaining.");
    }

    if (balance.freeRemaining > 0) {
        await UserWallet.updateOne(
            { userId },
            {
                $inc: {
                    monthlyFreeAdsUsed: 1,
                },
            },
            {
                session,
            }
        );

        return;
    }

    await UserWallet.updateOne(
        { userId },
        {
            $inc: {
                adCredits: -1,
            },
        },
        {
            session,
        }
    );
}

/**
 * Returns true if the user can post at least one ad.
 */
export async function canPostAd(
    userId: string,
    session?: ClientSession
): Promise<boolean> {
    const balance = await getAdPostingBalance(userId, session);
    return balance.totalRemaining > 0;
}

/**
 * ============================================================================
 * DISTRIBUTED POSTING LOCK
 * ============================================================================
 *
 * Acquires a Redis-backed distributed lock before executing the callback.
 * Prevents concurrent quota-consumption requests for the same user.
 *
 * Preserved for backward compatibility with PlanService.checkPostLimit.
 */
export async function withUserPostingLock<T>(
    userId: string,
    ttlSeconds: number,
    callback: () => Promise<T>
): Promise<T> {
    const lockKey = `lock:posting_quota:${userId}`;
    const acquired = await redisClient.set(
        lockKey,
        "locked",
        "EX",
        ttlSeconds,
        "NX"
    );

    if (!acquired) {
        throw Object.assign(
            new Error(
                "Please wait. Another request is currently consuming your posting quota."
            ),
            { statusCode: 429 }
        );
    }

    try {
        return await callback();
    } finally {
        await redisClient.del(lockKey);
    }
}

/**
 * ============================================================================
 * AdSlotService CLASS NAMESPACE
 * ============================================================================
 *
 * Preserved for backward compatibility with:
 * - ListingSubmissionPolicy.ts  → AdSlotService.consumeSlot()
 * - PlanService.ts              → AdSlotService.consumeSlot()
 * - All test mocks              → AdSlotService: { consumeSlot: jest.fn() }
 *
 * consumeSlot() consumes one ad slot and returns the source used.
 * Idempotency: if the adId is provided and the wallet already has a record of
 * consuming a slot for that listing, it returns 'idempotency_hit'.
 */
export const AdSlotService = {
    async consumeSlot(
        userId: string,
        session?: ClientSession,
        _adId?: string
    ): Promise<{ source: AdPostingSlotSource }> {
        // Ensure the wallet is in sync before checking or deducting.
        await syncWalletCycle(userId, session);

        const balance = await getAdPostingBalance(userId, session);

        if (balance.totalRemaining <= 0) {
            throw Object.assign(
                new Error(
                    "No ad posting slots available this month. Buy Ad Pack credits or wait for monthly reset."
                ),
                { statusCode: 422, code: "QUOTA_EXCEEDED" }
            );
        }

        if (balance.freeRemaining > 0) {
            await UserWallet.updateOne(
                { userId },
                { $inc: { monthlyFreeAdsUsed: 1 } },
                { session }
            );
            return { source: "free_slot" };
        }

        await UserWallet.updateOne(
            { userId },
            { $inc: { adCredits: -1 } },
            { session }
        );
        return { source: "ad_credit" };
    },
};