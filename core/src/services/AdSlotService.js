"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdSlotService = exports.withUserPostingLock = exports.getAdPostingBalance = exports.getMonthlyCycleStart = exports.MONTHLY_FREE_AD_SLOTS = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const UserWallet_1 = __importDefault(require("@core/models/UserWallet"));
const WalletService_1 = require("./WalletService");
const AppError_1 = require("@core/utils/AppError");
exports.MONTHLY_FREE_AD_SLOTS = 5;
const getMonthlyCycleStart = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), 1);
exports.getMonthlyCycleStart = getMonthlyCycleStart;
const syncWalletCycle = async (userId, session) => {
    const cycleStart = (0, exports.getMonthlyCycleStart)();
    await UserWallet_1.default.updateOne({
        userId,
        $or: [
            { lastMonthlyReset: { $exists: false } },
            { lastMonthlyReset: { $lt: cycleStart } }
        ]
    }, {
        $set: {
            lastMonthlyReset: cycleStart,
            monthlyFreeAdsUsed: 0
        }
    }, { upsert: true, session });
};
const getAdPostingBalance = async (userId, session) => {
    await syncWalletCycle(userId, session);
    let walletQuery = UserWallet_1.default.findOne({ userId });
    if (session)
        walletQuery = walletQuery.session(session);
    const wallet = await walletQuery.lean();
    const freeUsed = Math.max(0, wallet?.monthlyFreeAdsUsed || 0);
    const freeRemaining = Math.max(0, exports.MONTHLY_FREE_AD_SLOTS - freeUsed);
    const paidCredits = Math.max(0, wallet?.adCredits || 0);
    return {
        freeLimit: exports.MONTHLY_FREE_AD_SLOTS,
        freeUsed,
        freeRemaining,
        paidCredits,
        totalRemaining: freeRemaining + paidCredits
    };
};
exports.getAdPostingBalance = getAdPostingBalance;
const redis_1 = __importDefault(require("@core/config/redis"));
const withUserPostingLock = async (userId, ttlSeconds, callback) => {
    const lockKey = `lock:posting_quota:${userId}`;
    const acquired = await redis_1.default.set(lockKey, 'locked', 'EX', ttlSeconds, 'NX');
    if (!acquired) {
        throw Object.assign(new Error('Please wait. Another request is currently consuming your posting quota.'), { statusCode: 429 });
    }
    try {
        return await callback();
    }
    finally {
        await redis_1.default.del(lockKey).catch(() => { });
    }
};
exports.withUserPostingLock = withUserPostingLock;
/**
 * AdSlotService
 * Responsible for atomic deduction of ad posting slots.
 * Supports idempotency via adId tracking.
 */
class AdSlotService {
    /**
     * Consume an ad posting slot from the user's wallet.
     * Prioritizes monthly free slots, then falls back to paid ad credits.
     */
    static async consumeSlot(userId, session, adId) {
        return (0, exports.withUserPostingLock)(userId, 30, async () => {
            const now = new Date();
            // 0. Ensure monthly cycle is synced (SSOT Enforcement)
            await syncWalletCycle(userId, session);
            // 1. Idempotency Check
            if (adId && mongoose_1.default.Types.ObjectId.isValid(adId)) {
                const adObjectId = new mongoose_1.default.Types.ObjectId(adId);
                const alreadyConsumed = await UserWallet_1.default.findOne({
                    userId,
                    consumedSlots: adObjectId
                }).session(session || null).lean();
                if (alreadyConsumed) {
                    return { source: 'idempotency_hit' };
                }
            }
            const adObjectId = adId && mongoose_1.default.Types.ObjectId.isValid(adId)
                ? new mongoose_1.default.Types.ObjectId(adId)
                : null;
            // 2. Try Monthly Free Slot
            const freeSlotWallet = await UserWallet_1.default.findOneAndUpdate({
                userId,
                monthlyFreeAdsUsed: { $lt: exports.MONTHLY_FREE_AD_SLOTS }
            }, {
                $inc: { monthlyFreeAdsUsed: 1 },
                ...(adObjectId ? { $addToSet: { consumedSlots: adObjectId } } : {}),
                $setOnInsert: {
                    adCredits: 0,
                    spotlightCredits: 0,
                    smartAlertSlots: 2,
                    lastMonthlyReset: (0, exports.getMonthlyCycleStart)(now)
                }
            }, { upsert: true, new: true, session }).lean();
            if (freeSlotWallet) {
                await (0, WalletService_1.recordTransaction)({
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
                await (0, WalletService_1.consumeCredit)({
                    userId,
                    creditType: 'adCredits',
                    amount: 1,
                    reason: 'Consumed paid ad credit for new listing',
                    metadata: { adId, source: 'ad_credit' },
                    session
                });
                // Ensure adId is recorded for idempotency even when using WalletService
                if (adObjectId) {
                    await UserWallet_1.default.updateOne({ userId }, { $addToSet: { consumedSlots: adObjectId } }, { session });
                }
                return { source: 'ad_credit' };
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (message.includes('Insufficient')) {
                    throw new AppError_1.AppError('No ad posting slots available. Buy Ad Pack credits or wait for monthly reset.', 422, 'QUOTA_EXCEEDED');
                }
                throw error;
            }
        });
    }
}
exports.AdSlotService = AdSlotService;
//# sourceMappingURL=AdSlotService.js.map