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
exports.reconcilePayments = reconcilePayments;
const logger_1 = __importStar(require("@core/utils/logger"));
const Transaction_1 = require("@core/models/Transaction");
const PaymentProcessingService_1 = require("@core/services/PaymentProcessingService");
/**
 * 🔄 PAYMENT RECONCILIATION JOB
 * 1. Repairs transactions already marked SUCCESS but not yet applied.
 * 2. Recovers INITIATED transactions older than 10 minutes in case the webhook was missed.
 */
async function reconcilePayments() {
    logger_1.default.info("Starting Payment Reconciliation");
    const unappliedTransactions = await Transaction_1.Transaction.find({
        status: "SUCCESS",
        applied: false
    });
    for (const tx of unappliedTransactions) {
        try {
            const result = await (0, PaymentProcessingService_1.processSuccessfulPayment)({
                source: "recovery",
                gatewayPaymentId: tx.gatewayPaymentId,
                gatewayOrderId: tx.gatewayOrderId
            });
            (0, logger_1.logBusiness)("payment_verified", {
                phase: "reconcile_success_status",
                transactionId: tx._id.toString(),
                result: result.result
            });
        }
        catch (error) {
            logger_1.default.error("Failed to reconcile successful unapplied transaction", {
                transactionId: tx._id.toString(),
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const staleInitiatedTransactions = await Transaction_1.Transaction.find({
        status: "INITIATED",
        applied: false,
        createdAt: { $lte: tenMinutesAgo }
    });
    for (const tx of staleInitiatedTransactions) {
        try {
            const result = await (0, PaymentProcessingService_1.recoverPendingPayment)(tx);
            (0, logger_1.logBusiness)("payment_verified", {
                phase: "recovery_pending_status",
                transactionId: tx._id.toString(),
                result: result.result,
                reason: result.reason
            });
        }
        catch (error) {
            logger_1.default.error("Failed to recover pending transaction", {
                transactionId: tx._id.toString(),
                gatewayOrderId: tx.gatewayOrderId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    logger_1.default.info("Payment Reconciliation completed", {
        unappliedTransactions: unappliedTransactions.length,
        staleInitiatedTransactions: staleInitiatedTransactions.length
    });
}
//# sourceMappingURL=reconcilePayments.js.map