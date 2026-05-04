"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = exports.WalletModel = exports.consumeCredit = exports.debit = exports.credit = exports.recordTransaction = exports.getWallet = exports.hasWalletIncrement = exports.buildWalletIncrement = void 0;
const UserWallet_1 = __importDefault(require("@core/models/UserWallet"));
const Transaction_1 = __importDefault(require("@core/models/Transaction"));
const db_1 = require("@core/config/db");
const AppError_1 = require("@core/utils/AppError");
const planEntitlements_1 = require("@esparex/shared/utils/planEntitlements");
const buildWalletIncrement = (tx) => {
    const kind = tx.planSnapshot?.type;
    const credits = (0, planEntitlements_1.getPrimaryPlanCreditCount)(tx.planSnapshot);
    const amount = {};
    if (kind === 'AD_PACK')
        amount.adCredits = credits;
    if (kind === 'SPOTLIGHT')
        amount.spotlightCredits = credits;
    if (kind === 'SMART_ALERT')
        amount.smartAlertSlots = credits;
    return amount;
};
exports.buildWalletIncrement = buildWalletIncrement;
const hasWalletIncrement = (amount) => Object.values(amount).some((value) => Number(value || 0) > 0);
exports.hasWalletIncrement = hasWalletIncrement;
/**
 * Ensures wallet mutation runs inside a secure transaction.
 */
async function withTransaction(existingSession, operation) {
    if (existingSession) {
        return operation(existingSession);
    }
    const session = await (0, db_1.getUserConnection)().startSession();
    try {
        session.startTransaction();
        const result = await operation(session);
        await session.commitTransaction();
        return result;
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        void session.endSession();
    }
}
/**
 * 1. Fetch wallet by userId
 */
const getWallet = async (userId) => {
    let wallet = await UserWallet_1.default.findOne({ userId });
    if (!wallet) {
        wallet = await UserWallet_1.default.create({ userId });
    }
    return wallet;
};
exports.getWallet = getWallet;
/**
 * 4. Record a Transaction
 */
const recordTransaction = async ({ userId, amount, type, reason, metadata, session }) => {
    // If credit/debit amount object is passed, build description string.
    const isAmountObj = typeof amount === 'object' && amount !== null;
    const descPrefix = type === 'credit' ? 'Credit' : 'Debit';
    let descriptionStr = reason;
    if (isAmountObj) {
        const details = Object.entries(amount)
            .filter(([, v]) => v && Number(v) > 0)
            .map(([k, v]) => `${k}=${type === 'credit' ? '+' : '-'}${v}`)
            .join(', ');
        descriptionStr = `${reason} | ${descPrefix}: ${details}`;
    }
    const transactionPayload = {
        userId,
        amount: isAmountObj ? 0 : Number(amount), // Internal credits are historically amount=0 in Transaction.
        status: 'SUCCESS',
        applied: true,
        description: descriptionStr,
        metadata: {
            operation: type,
            adjustment: isAmountObj ? amount : { value: amount },
            ...metadata
        }
    };
    const records = await Transaction_1.default.create([transactionPayload], { session });
    return records[0];
};
exports.recordTransaction = recordTransaction;
/**
 * 2. Credit Wallet
 */
const credit = async ({ userId, amount, reason, metadata, session }) => {
    return withTransaction(session, async (activeSession) => {
        const incrementPayload = {};
        if (amount.adCredits)
            incrementPayload.adCredits = amount.adCredits;
        if (amount.spotlightCredits)
            incrementPayload.spotlightCredits = amount.spotlightCredits;
        if (amount.smartAlertSlots)
            incrementPayload.smartAlertSlots = amount.smartAlertSlots;
        if (Object.keys(incrementPayload).length === 0) {
            throw new AppError_1.AppError('No valid credit amounts provided.', 400, 'INVALID_WALLET_OPERATION');
        }
        const updatedWallet = await UserWallet_1.default.findOneAndUpdate({ userId }, { $inc: incrementPayload }, { upsert: true, new: true, session: activeSession });
        await (0, exports.recordTransaction)({
            userId,
            amount,
            type: 'credit',
            reason,
            metadata,
            session: activeSession
        });
        return updatedWallet;
    });
};
exports.credit = credit;
/**
 * 3. Debit Wallet
 */
const debit = async ({ userId, amount, reason, metadata, session }) => {
    return withTransaction(session, async (activeSession) => {
        const wallet = await UserWallet_1.default.findOne({ userId }).session(activeSession);
        if (!wallet) {
            throw new AppError_1.AppError('Wallet not found for deduction.', 404, 'WALLET_NOT_FOUND');
        }
        const decrementPayload = {};
        // Validation checks
        if (amount.adCredits) {
            if (wallet.adCredits < amount.adCredits)
                throw new AppError_1.AppError('Insufficient Ad Credits.', 422, 'INSUFFICIENT_CREDITS');
            decrementPayload.adCredits = -Math.abs(amount.adCredits);
        }
        if (amount.spotlightCredits) {
            if (wallet.spotlightCredits < amount.spotlightCredits)
                throw new AppError_1.AppError('Insufficient Spotlight Credits.', 422, 'INSUFFICIENT_CREDITS');
            decrementPayload.spotlightCredits = -Math.abs(amount.spotlightCredits);
        }
        if (amount.smartAlertSlots) {
            if (wallet.smartAlertSlots < amount.smartAlertSlots)
                throw new AppError_1.AppError('Insufficient Smart Alert Slots.', 422, 'INSUFFICIENT_CREDITS');
            decrementPayload.smartAlertSlots = -Math.abs(amount.smartAlertSlots);
        }
        if (Object.keys(decrementPayload).length === 0) {
            throw new AppError_1.AppError('No valid debit amounts provided.', 400, 'INVALID_WALLET_OPERATION');
        }
        const updatedWallet = await UserWallet_1.default.findOneAndUpdate({ userId }, { $inc: decrementPayload }, { new: true, session: activeSession });
        await (0, exports.recordTransaction)({
            userId,
            amount,
            type: 'debit',
            reason,
            metadata,
            session: activeSession
        });
        return updatedWallet;
    });
};
exports.debit = debit;
/**
 * Canonical credit-consumption API.
 * Use this instead of duplicating wallet deduction logic in feature services.
 */
const consumeCredit = async ({ userId, creditType, amount = 1, reason, metadata, session }) => {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError_1.AppError('Credit consumption amount must be a positive number.', 400, 'INVALID_WALLET_OPERATION');
    }
    return (0, exports.debit)({
        userId,
        amount: { [creditType]: amount },
        reason,
        metadata,
        session
    });
};
exports.consumeCredit = consumeCredit;
// ── Typed model wrappers for controller shared files ─────────────────────────
exports.WalletModel = UserWallet_1.default;
exports.TransactionModel = Transaction_1.default;
//# sourceMappingURL=WalletService.js.map