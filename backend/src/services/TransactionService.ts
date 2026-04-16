import mongoose from 'mongoose';
import Transaction, { type ITransaction } from '../models/Transaction';
import User from '../models/User';
import { escapeRegExp } from '../utils/stringUtils';


export interface TransactionFilters {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}

/**
 * Service for transaction-related database operations and aggregations.
 */
export const getTransactions = async (filters: TransactionFilters = {}, pagination: { skip: number, limit: number }) => {
    const { status, search, startDate, endDate } = filters;
    const { skip, limit } = pagination;

    const query: Record<string, unknown> = {};

    if (status && status !== 'All' && typeof status === 'string') {
        if (['INITIATED', 'SUCCESS', 'FAILED'].includes(status)) {
            query.status = status;
        }
    }

    if (search) {
        const safeSearch = escapeRegExp(search);

        // Find users matching search term
        const users = await User.find({
            $or: [
                { firstName: { $regex: safeSearch, $options: 'i' } },
                { lastName: { $regex: safeSearch, $options: 'i' } },
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { mobile: { $regex: safeSearch, $options: 'i' } }
            ]
        }).select('_id');

        const userIds = users.map(u => u._id);

        const searchOr: Record<string, unknown>[] = [
            { gatewayPaymentId: { $regex: safeSearch, $options: 'i' } },
            { gatewayOrderId: { $regex: safeSearch, $options: 'i' } }
        ];

        if ((search).match(/^[0-9a-fA-F]{24}$/)) {
            searchOr.push({ _id: search });
        }

        if (userIds.length > 0) {
            searchOr.push({ userId: { $in: userIds } });
        }

        query.$or = searchOr;
    }

    if (startDate || endDate) {
        const createdAtFilter: Record<string, unknown> = {};
        if (startDate) createdAtFilter.$gte = new Date(startDate);
        if (endDate) createdAtFilter.$lte = new Date(endDate);
        query.createdAt = createdAtFilter;
    }

    const [data, total] = await Promise.all([
        Transaction.find(query)
            .populate('userId', 'firstName lastName email mobile')
            .populate('planId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Transaction.countDocuments(query)
    ]);

    return { data, total };
};

export const getTransactionStats = async () => {
    // Total Revenue (Only SUCCESS)
    const totalRevenueAgg = await Transaction.aggregate<{ total: number }>([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // Today's Revenue
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayRevenueAgg = await Transaction.aggregate<{ total: number }>([
        {
            $match: {
                status: 'SUCCESS',
                createdAt: { $gte: startOfDay }
            }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    const totalSales = await Transaction.countDocuments({ status: 'SUCCESS' });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthRevenueAgg = await Transaction.aggregate<{ total: number }>([
        {
            $match: {
                status: 'SUCCESS',
                createdAt: { $gte: startOfMonth }
            }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const thisMonthRevenue = thisMonthRevenueAgg[0]?.total || 0;

    return {
        totalRevenue,
        todayRevenue,
        totalSales,
        thisMonthRevenue
    };
};

export const resolveCategoryName = (tx: ITransaction) =>
    typeof tx.metadata?.categoryName === 'string' ? tx.metadata.categoryName : undefined;

export async function checkTransactionVelocity(

    userId: string | mongoose.Types.ObjectId,
    windowMs: number
): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    const filter = {
        userId,
        createdAt: { $gte: since },
    };
    return Transaction.countDocuments(filter);
}

export async function findPendingTransaction(
    userId: string | mongoose.Types.ObjectId,
    planId: string | mongoose.Types.ObjectId,
    windowMs: number
): Promise<ITransaction | null> {
    const since = new Date(Date.now() - windowMs);
    const filter = {
        userId,
        planId,
        status: 'INITIATED',
        applied: false,
        createdAt: { $gte: since },
    };
    return Transaction.findOne(filter).sort({ createdAt: -1 });
}

export async function createPaymentTransaction(
    payload: Record<string, unknown>
): Promise<ITransaction> {
    return Transaction.create(payload);
}

export async function getUserTransactions(userId: string | mongoose.Types.ObjectId) {
    return Transaction.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getTransactionWithUser(transactionId: string) {
    return Transaction.findById(transactionId).populate('userId', 'name email mobile address');
}

export async function findTransactionForUpdate(id: string) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Transaction.findById(id);
}

export async function saveTransaction(transaction: { save: () => Promise<unknown> }) {
    return transaction.save();
}

export async function getUserForPayment(userId: string | mongoose.Types.ObjectId) {
    return User.findById(userId).lean();
}


