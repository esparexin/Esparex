"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionStats = exports.getAllTransactions = void 0;
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const transactionService = __importStar(require("@esparex/core/services/TransactionService"));
/**
 * Get all transactions with pagination and filtering
 */
const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { status, q, startDate, endDate } = req.query;
        const { data, total } = await transactionService.getTransactions({
            status: status,
            search: q,
            startDate: startDate,
            endDate: endDate
        }, { skip, limit });
        (0, adminBaseController_1.sendPaginatedResponse)(res, data, total, page, limit);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getAllTransactions = getAllTransactions;
/**
 * Get transaction statistics
 */
const getTransactionStats = async (req, res) => {
    try {
        const stats = await transactionService.getTransactionStats();
        (0, adminBaseController_1.sendSuccessResponse)(res, stats);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getTransactionStats = getTransactionStats;
//# sourceMappingURL=adminTransactionController.js.map