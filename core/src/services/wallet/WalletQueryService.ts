import { getAdPostingBalance } from '../AdSlotService';
import { getWallet, TransactionModel } from './WalletService';

export type WalletTransactionHistory = {
    transactions: Record<string, unknown>[];
    pagination: {
        total: number;
        limit: number;
        skip: number;
    };
};

export const getWalletSummaryByUserId = async (userId: string) => {
    return getWallet(userId);
};

export const getTransactionHistoryByUserId = async (
    userId: string,
    pagination: { limit: number; skip: number }
): Promise<WalletTransactionHistory> => {
    const { limit, skip } = pagination;

    const transactions = await TransactionModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

    const total = await TransactionModel.countDocuments({ userId });

    return {
        transactions,
        pagination: {
            total,
            limit,
            skip,
        },
    };
};

export const getPostingBalanceByUserId = async (userId: string) => {
    return getAdPostingBalance(userId);
};
