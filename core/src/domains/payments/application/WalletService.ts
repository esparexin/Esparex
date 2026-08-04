import { ClientSession, Types } from 'mongoose';
import UserWallet from '../../../models/UserWallet';
import Transaction, { type ITransaction } from '../../../models/Transaction';
import Entitlement from '../../../models/Entitlement';
import { getUserConnection } from '../../../config/db';
import { AppError } from '../../../utils/AppError';
import { getPrimaryPlanCreditCount } from "@esparex/shared";


export interface WalletAmount {
    adCredits?: number;
    boostCredits?: number;
    spotlightCredits?: number;
    smartAlertSlots?: number;
}

export type CreditType = keyof WalletAmount;

export const buildWalletIncrement = (tx: ITransaction): WalletAmount => {
    const limits = tx.planSnapshot?.limits as Record<string, number> | undefined;
    const kind = tx.planSnapshot?.type;
    const primaryCredits = getPrimaryPlanCreditCount(tx.planSnapshot);
    const amount: WalletAmount = {};

    if (limits?.maxAds && limits.maxAds > 0) {
        amount.adCredits = limits.maxAds;
    }
    if (limits?.spotlightCredits && limits.spotlightCredits > 0) {
        amount.spotlightCredits = limits.spotlightCredits;
    }
    if (limits?.smartAlerts && limits.smartAlerts > 0) {
        amount.smartAlertSlots = limits.smartAlerts;
    }

    if (kind === 'AD_PACK' && !amount.adCredits) amount.adCredits = primaryCredits;
    if (kind === 'BOOST_AD' && !amount.boostCredits) amount.boostCredits = primaryCredits;
    if (kind === 'SPOTLIGHT' && !amount.spotlightCredits) amount.spotlightCredits = primaryCredits;
    if (kind === 'SMART_ALERT' && !amount.smartAlertSlots) amount.smartAlertSlots = primaryCredits;

    return amount;
};

export const hasWalletIncrement = (amount: WalletAmount) => Object.values(amount).some((value) => Number(value || 0) > 0);


interface WalletOperationParams {
    userId: string;
    amount: WalletAmount;
    reason: string;
    metadata?: Record<string, unknown>;
    session?: ClientSession;
}

interface RecordTransactionParams {
    userId: string;
    amount: WalletAmount | number;
    type: 'credit' | 'debit';
    reason: string;
    metadata?: Record<string, unknown>;
    session?: ClientSession;
}

/**
 * Ensures wallet mutation runs inside a secure transaction.
 */
async function withTransaction<T>(
    existingSession: ClientSession | undefined,
    operation: (session: ClientSession | undefined) => Promise<T>
): Promise<T> {
    if (existingSession) {
        return operation(existingSession);
    }

    let session: ClientSession | undefined;
    try {
        const s = await getUserConnection().startSession();
        s.startTransaction();
        session = s;
    } catch {
        session = undefined;
    }

    if (!session) {
        return operation(undefined);
    }

    try {
        const result = await operation(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        try {
            await session.abortTransaction();
        } catch {
            // ignore abort failure
        }
        throw error;
    } finally {
        try {
            void session.endSession();
        } catch {
            // ignore endSession failure
        }
    }
}

/**
 * 1. Fetch wallet by userId
 */
export const getWallet = async (userId: string) => {
    let wallet = await UserWallet.findOne({ userId });
    if (!wallet) {
        wallet = await UserWallet.create({ userId });
    }
    return wallet;
};

/**
 * 4. Record a Transaction
 */
export const recordTransaction = async ({
    userId,
    amount,
    type,
    reason,
    metadata,
    session
}: RecordTransactionParams) => {
    // If credit/debit amount object is passed, build description string.
    const isAmountObj = typeof amount === 'object' && amount !== undefined;
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

    const records = await Transaction.create([transactionPayload] as unknown as Record<string, unknown>[], { session });
    return records[0];
};

/**
 * 2. Credit Wallet & Grant Entitlements (SSOT)
 */
export const credit = async ({
    userId,
    amount,
    reason,
    metadata,
    session
}: WalletOperationParams) => {
    return withTransaction(session, async (activeSession) => {
        const incrementPayload: Record<string, number> = {};
        const userObjId = new Types.ObjectId(userId);
        const sourceId = metadata?.transactionId ? new Types.ObjectId(String(metadata.transactionId)) : new Types.ObjectId();

        if (amount.adCredits && amount.adCredits > 0) {
            incrementPayload.adCredits = amount.adCredits;
            await Entitlement.create([{
                userId: userObjId,
                type: 'AD_POSTING',
                sourceType: 'PURCHASED_PACK',
                sourceId,
                quantity: amount.adCredits,
                consumed: 0,
                remaining: amount.adCredits,
                status: 'ACTIVE',
            }], ...(activeSession ? [{ session: activeSession }] : []));
        }

        if (amount.spotlightCredits && amount.spotlightCredits > 0) {
            incrementPayload.spotlightCredits = amount.spotlightCredits;
            await Entitlement.create([{
                userId: userObjId,
                type: 'SPOTLIGHT_CAT',
                sourceType: 'PURCHASED_PACK',
                sourceId,
                quantity: amount.spotlightCredits,
                consumed: 0,
                remaining: amount.spotlightCredits,
                status: 'ACTIVE',
            }], ...(activeSession ? [{ session: activeSession }] : []));
        }

        if (amount.boostCredits && amount.boostCredits > 0) {
            incrementPayload.boostCredits = amount.boostCredits;
            await Entitlement.create([{
                userId: userObjId,
                type: 'PUSH_TO_TOP',
                sourceType: 'PURCHASED_PACK',
                sourceId,
                quantity: amount.boostCredits,
                consumed: 0,
                remaining: amount.boostCredits,
                status: 'ACTIVE',
            }], ...(activeSession ? [{ session: activeSession }] : []));
        }

        if (amount.smartAlertSlots && amount.smartAlertSlots > 0) {
            incrementPayload.smartAlertSlots = amount.smartAlertSlots;
            await Entitlement.create([{
                userId: userObjId,
                type: 'SMART_ALERT_SLOT',
                sourceType: 'PURCHASED_PACK',
                sourceId,
                quantity: amount.smartAlertSlots,
                consumed: 0,
                remaining: amount.smartAlertSlots,
                status: 'ACTIVE',
            }], ...(activeSession ? [{ session: activeSession }] : []));
        }

        if (Object.keys(incrementPayload).length === 0) {
            throw new AppError('No valid credit amounts provided.', 400, 'INVALID_WALLET_OPERATION');
        }

        // Update UserWallet derived read snapshot
        const updatedWallet = await UserWallet.findOneAndUpdate(
            { userId },
            { $inc: incrementPayload },
            { upsert: true, new: true, ...(activeSession ? { session: activeSession } : {}) }
        );

        await recordTransaction({
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

/**
 * 3. Debit Wallet
 */
export const debit = async ({
    userId,
    amount,
    reason,
    metadata,
    session
}: WalletOperationParams) => {
    return withTransaction(session, async (activeSession) => {
        const query = UserWallet.findOne({ userId });
        if (activeSession) query.session(activeSession);
        const wallet = await query;
        if (!wallet) {
            throw new AppError('Wallet not found for deduction.', 404, 'WALLET_NOT_FOUND');
        }

        const decrementPayload: Record<string, number> = {};

        // Validation checks
        if (amount.adCredits) {
            if (wallet.adCredits < amount.adCredits) throw new AppError('Insufficient Ad Credits.', 422, 'INSUFFICIENT_CREDITS');
            decrementPayload.adCredits = -Math.abs(amount.adCredits);
        }
        if (amount.spotlightCredits) {
            if (wallet.spotlightCredits < amount.spotlightCredits) throw new AppError('Insufficient Spotlight Credits.', 422, 'INSUFFICIENT_CREDITS');
            decrementPayload.spotlightCredits = -Math.abs(amount.spotlightCredits);
        }
        if (amount.smartAlertSlots) {
            if (wallet.smartAlertSlots < amount.smartAlertSlots) throw new AppError('Insufficient Smart Alert Slots.', 422, 'INSUFFICIENT_CREDITS');
            decrementPayload.smartAlertSlots = -Math.abs(amount.smartAlertSlots);
        }

        if (Object.keys(decrementPayload).length === 0) {
            throw new AppError('No valid debit amounts provided.', 400, 'INVALID_WALLET_OPERATION');
        }

        const updatedWallet = await UserWallet.findOneAndUpdate(
            { userId },
            { $inc: decrementPayload },
            { new: true, ...(activeSession ? { session: activeSession } : {}) }
        );

        await recordTransaction({
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

/**
 * Canonical credit-consumption API.
 * Use this instead of duplicating wallet deduction logic in feature services.
 */
export const consumeCredit = async ({
    userId,
    creditType,
    amount = 1,
    reason,
    metadata,
    session
}: {
    userId: string;
    creditType: CreditType;
    amount?: number;
    reason: string;
    metadata?: Record<string, unknown>;
    session?: ClientSession;
}) => {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError('Credit consumption amount must be a positive number.', 400, 'INVALID_WALLET_OPERATION');
    }

    return debit({
        userId,
        amount: { [creditType]: amount },
        reason,
        metadata,
        session
    });
};

// ── Typed model wrappers for controller shared files ─────────────────────────
export const WalletModel = UserWallet as unknown as {
    findOne: (query: Record<string, unknown>) => {
        lean: () => Promise<Record<string, unknown> | null>;
    };
    create: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
    findOneAndUpdate: (
        query: Record<string, unknown>,
        update: Record<string, unknown>,
        options: { upsert: boolean; new: boolean }
    ) => Promise<Record<string, unknown> | null>;
};

export const TransactionModel = Transaction as unknown as {
    find: (query: Record<string, unknown>) => {
        sort: (sortBy: Record<string, 1 | -1>) => {
            limit: (limit: number) => {
                skip: (skip: number) => {
                    lean: () => Promise<Record<string, unknown>[]>;
                };
            };
        };
    };
    countDocuments: (query: Record<string, unknown>) => Promise<number>;
};
