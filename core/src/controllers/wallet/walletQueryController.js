"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostingBalance = exports.getTransactionHistory = exports.getWalletSummary = void 0;
const respond_1 = require("@core/utils/respond");
const errorResponse_1 = require("@core/utils/errorResponse");
const WalletQueryService_1 = require("@core/services/wallet/WalletQueryService");
const getErrorMessage = (error) => error instanceof Error ? error.message : 'Unexpected error';
const getWalletSummary = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId)
            return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
        const wallet = await (0, WalletQueryService_1.getWalletSummaryByUserId)(userId.toString());
        res.json((0, respond_1.respond)({ success: true, data: wallet }));
    }
    catch (error) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, getErrorMessage(error));
    }
};
exports.getWalletSummary = getWalletSummary;
const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId)
            return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
        const limit = Number(req.query.limit) || 10;
        const skip = Number(req.query.skip) || 0;
        const history = await (0, WalletQueryService_1.getTransactionHistoryByUserId)(userId.toString(), { limit, skip });
        res.json((0, respond_1.respond)({ success: true, data: history }));
    }
    catch (error) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, getErrorMessage(error));
    }
};
exports.getTransactionHistory = getTransactionHistory;
const getPostingBalance = async (req, res) => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId)
            return (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
        const balance = await (0, WalletQueryService_1.getPostingBalanceByUserId)(userId);
        res.json((0, respond_1.respond)({ success: true, data: balance }));
    }
    catch (error) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, getErrorMessage(error));
    }
};
exports.getPostingBalance = getPostingBalance;
//# sourceMappingURL=walletQueryController.js.map