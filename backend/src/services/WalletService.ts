import { ClientSession } from 'mongoose';
import UserWallet from '../models/UserWallet';
import Transaction from '../models/Transaction';
import { getUserConnection } from '../config/db';

export interface WalletAmount {
    adCredits?: number;
    spotlightCredits?: number;
    smartAlertSlots?: number;
}

export type CreditType = keyof WalletAmount;

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
    operation: (session: ClientSession) => Promise<T>
): Promise<T> {
    if (existingSession) {
        return operation(existingSession);
    }

    const session = await getUserConnection().startSession();
    try {
        session.startTransaction();
        const result = await operation(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
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
    const isAmountObj = typeof amount === 'object' && amount !== null;
    const descPrefix = type === 'credit' ? 'Credit' : 'Debit';

    let descriptionStr = reason;
    if (isAmountObj) {
        const details = Object.entries(amount)
            .filter(([_, v]) => v && Number(v) > 0)
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

    const records = await Transaction.create([transactionPayload], { session });
    return records[0];
};

/**
 * 2. Credit Wallet
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
        if (amount.adCredits) incrementPayload.adCredits = amount.adCredits;
        if (amount.spotlightCredits) incrementPayload.spotlightCredits = amount.spotlightCredits;
        if (amount.smartAlertSlots) incrementPayload.smartAlertSlots = amount.smartAlertSlots;

        if (Object.keys(incrementPayload).length === 0) {
            throw new Error('No valid credit amounts provided.');
        }

        const updatedWallet = await UserWallet.findOneAndUpdate(
            { userId },
            { $inc: incrementPayload },
            { upsert: true, new: true, session: activeSession }
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
        const wallet = await UserWallet.findOne({ userId }).session(activeSession);
        if (!wallet) {
            throw new Error('Wallet not found for deduction.');
        }

        const decrementPayload: Record<string, number> = {};

        // Validation checks
        if (amount.adCredits) {
            if (wallet.adCredits < amount.adCredits) throw new Error('Insufficient Ad Credits.');
            decrementPayload.adCredits = -Math.abs(amount.adCredits);
        }
        if (amount.spotlightCredits) {
            if (wallet.spotlightCredits < amount.spotlightCredits) throw new Error('Insufficient Spotlight Credits.');
            decrementPayload.spotlightCredits = -Math.abs(amount.spotlightCredits);
        }
        if (amount.smartAlertSlots) {
            if (wallet.smartAlertSlots < amount.smartAlertSlots) throw new Error('Insufficient Smart Alert Slots.');
            decrementPayload.smartAlertSlots = -Math.abs(amount.smartAlertSlots);
        }

        if (Object.keys(decrementPayload).length === 0) {
            throw new Error('No valid debit amounts provided.');
        }

        const updatedWallet = await UserWallet.findOneAndUpdate(
            { userId },
            { $inc: decrementPayload },
            { new: true, session: activeSession }
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
        throw new Error('Credit consumption amount must be a positive number.');
    }

    return debit({
        userId,
        amount: { [creditType]: amount } as WalletAmount,
        reason,
        metadata,
        session
    });
};
