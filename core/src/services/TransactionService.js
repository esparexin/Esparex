"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCategoryName = exports.getTransactionStats = exports.getTransactions = void 0;
exports.checkTransactionVelocity = checkTransactionVelocity;
exports.findPendingTransaction = findPendingTransaction;
exports.createPaymentTransaction = createPaymentTransaction;
exports.getUserTransactions = getUserTransactions;
exports.getTransactionWithUser = getTransactionWithUser;
exports.findTransactionForUpdate = findTransactionForUpdate;
exports.saveTransaction = saveTransaction;
exports.getUserForPayment = getUserForPayment;
const mongoose_1 = __importDefault(require("mongoose"));
const Transaction_1 = __importDefault(require("@core/models/Transaction"));
const User_1 = __importDefault(require("@core/models/User"));
const stringUtils_1 = require("@core/utils/stringUtils");
/**
 * Service for transaction-related database operations and aggregations.
 */
const getTransactions = async (filters = {}, pagination) => {
    const { status, search, startDate, endDate } = filters;
    const { skip, limit } = pagination;
    const query = {};
    if (status && status !== 'All' && typeof status === 'string') {
        if (['INITIATED', 'SUCCESS', 'FAILED'].includes(status)) {
            query.status = status;
        }
    }
    if (search) {
        const safeSearch = (0, stringUtils_1.escapeRegExp)(search);
        // Find users matching search term
        const users = await User_1.default.find({
            $or: [
                { firstName: { $regex: safeSearch, $options: 'i' } },
                { lastName: { $regex: safeSearch, $options: 'i' } },
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { mobile: { $regex: safeSearch, $options: 'i' } }
            ]
        }).select('_id');
        const userIds = users.map(u => u._id);
        const searchOr = [
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
        const createdAtFilter = {};
        if (startDate)
            createdAtFilter.$gte = new Date(startDate);
        if (endDate)
            createdAtFilter.$lte = new Date(endDate);
        query.createdAt = createdAtFilter;
    }
    const [data, total] = await Promise.all([
        Transaction_1.default.find(query)
            .populate('userId', 'firstName lastName email mobile')
            .populate('planId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Transaction_1.default.countDocuments(query)
    ]);
    return { data, total };
};
exports.getTransactions = getTransactions;
const getTransactionStats = async () => {
    // Total Revenue (Only SUCCESS)
    const totalRevenueAgg = await Transaction_1.default.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    // Today's Revenue
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayRevenueAgg = await Transaction_1.default.aggregate([
        {
            $match: {
                status: 'SUCCESS',
                createdAt: { $gte: startOfDay }
            }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayRevenue = todayRevenueAgg[0]?.total || 0;
    const totalSales = await Transaction_1.default.countDocuments({ status: 'SUCCESS' });
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonthRevenueAgg = await Transaction_1.default.aggregate([
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
exports.getTransactionStats = getTransactionStats;
const resolveCategoryName = (tx) => typeof tx.metadata?.categoryName === 'string' ? tx.metadata.categoryName : undefined;
exports.resolveCategoryName = resolveCategoryName;
async function checkTransactionVelocity(userId, windowMs) {
    const since = new Date(Date.now() - windowMs);
    const filter = {
        userId,
        createdAt: { $gte: since },
    };
    return Transaction_1.default.countDocuments(filter);
}
async function findPendingTransaction(userId, planId, windowMs) {
    const since = new Date(Date.now() - windowMs);
    const filter = {
        userId,
        planId,
        status: 'INITIATED',
        applied: false,
        createdAt: { $gte: since },
    };
    return Transaction_1.default.findOne(filter).sort({ createdAt: -1 });
}
async function createPaymentTransaction(payload) {
    return Transaction_1.default.create(payload);
}
async function getUserTransactions(userId) {
    return Transaction_1.default.find({ userId }).sort({ createdAt: -1 }).lean();
}
async function getTransactionWithUser(transactionId) {
    return Transaction_1.default.findById(transactionId).populate('userId', 'name email mobile address');
}
async function findTransactionForUpdate(id) {
    if (!mongoose_1.default.isValidObjectId(id))
        return null;
    return Transaction_1.default.findById(id);
}
async function saveTransaction(transaction) {
    return transaction.save();
}
async function getUserForPayment(userId) {
    return User_1.default.findById(userId).lean();
}
//# sourceMappingURL=TransactionService.js.map