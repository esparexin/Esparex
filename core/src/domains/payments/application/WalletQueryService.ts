import mongoose from 'mongoose';
import type { CreditLedgerDTO } from '@esparex/contracts';
import { getAdPostingBalance } from '../../boosts/application/services/AdSlotService';
import { getWallet, TransactionModel } from './WalletService';
import CreditTransaction from '../../../models/CreditTransaction';
import Ad from '../../../models/Ad';
import { PlansWalletMapper, type RawAdMetadata } from '../mappers/PlansWalletMapper';

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

export const getCreditLedgerHistoryByUserId = async (
    userId: string,
    pagination: { limit: number; skip: number }
): Promise<{ items: CreditLedgerDTO[]; total: number }> => {
    const { limit, skip } = pagination;
    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const idFilter = { $in: [userId, userObjId] };

    const [items, total] = await Promise.all([
        CreditTransaction.find({ userId: idFilter })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        CreditTransaction.countDocuments({ userId: idFilter }),
    ]);

    const listingIds = Array.from(
        new Set(
            items
                .map((tx) => tx.listingId?.toString())
                .filter((id): id is string => Boolean(id))
        )
    );

    const ads = listingIds.length > 0
        ? await Ad.find({ _id: { $in: listingIds } }).select('_id title slug seoSlug status expiresAt').lean()
        : [];

    const adMap = new Map<string, RawAdMetadata>(
        ads.map((a) => [
            String(a._id),
            {
                _id: a._id,
                title: typeof a.title === 'string' ? a.title : undefined,
                slug: typeof a.slug === 'string' ? a.slug : undefined,
                seoSlug: typeof a.seoSlug === 'string' ? a.seoSlug : undefined,
                status: typeof a.status === 'string' ? a.status : undefined,
                expiresAt: a.expiresAt as Date | string | undefined,
            },
        ])
    );

    const mappedItems = PlansWalletMapper.mapCreditTransactions(
        items as Record<string, unknown>[],
        adMap
    );

    return {
        items: mappedItems,
        total,
    };
};

export const getPostingBalanceByUserId = async (userId: string) => {
    return getAdPostingBalance(userId);
};
