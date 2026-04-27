"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostingBalanceByUserId = exports.getTransactionHistoryByUserId = exports.getWalletSummaryByUserId = void 0;
const AdSlotService_1 = require("../AdSlotService");
const WalletService_1 = require("../WalletService");
const getWalletSummaryByUserId = async (userId) => {
    return (0, WalletService_1.getWallet)(userId);
};
exports.getWalletSummaryByUserId = getWalletSummaryByUserId;
const getTransactionHistoryByUserId = async (userId, pagination) => {
    const { limit, skip } = pagination;
    const transactions = await WalletService_1.TransactionModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
    const total = await WalletService_1.TransactionModel.countDocuments({ userId });
    return {
        transactions,
        pagination: {
            total,
            limit,
            skip,
        },
    };
};
exports.getTransactionHistoryByUserId = getTransactionHistoryByUserId;
const getPostingBalanceByUserId = async (userId) => {
    return (0, AdSlotService_1.getAdPostingBalance)(userId);
};
exports.getPostingBalanceByUserId = getPostingBalanceByUserId;
//# sourceMappingURL=WalletQueryService.js.map