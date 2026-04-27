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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSuccessfulPayment = processSuccessfulPayment;
exports.recoverPendingPayment = recoverPendingPayment;
const db_1 = require("@core/config/db");
const Invoice_1 = require("@core/models/Invoice");
const Transaction_1 = require("@core/models/Transaction");
const WalletService_1 = require("./WalletService");
const RevenueAnalytics_1 = require("./RevenueAnalytics");
const InvoiceService_1 = require("./InvoiceService");
const GatewayService_1 = require("./GatewayService");
const TransactionService_1 = require("./TransactionService");
const logger_1 = __importStar(require("@core/utils/logger"));
const AdminLog_1 = __importDefault(require("@core/models/AdminLog"));
/**
 * Orchestrator for successful payment flow.
 * Coordinates between Transaction, Wallet, and Invoice services.
 */
async function processSuccessfulPayment(params) {
    const { gatewayPaymentId, gatewayOrderId, gatewayAmountPaise, gatewayCurrency, source, event } = params;
    if (!gatewayPaymentId && !gatewayOrderId) {
        logger_1.default.warn('Payment processing skipped because no gateway identifiers were provided', {
            source,
            event
        });
        return { result: 'missing', reason: 'missing_gateway_identifiers' };
    }
    const session = await (0, db_1.getUserConnection)().startSession();
    let committedInvoiceId;
    let committedTransactionId;
    (0, logger_1.logBusiness)('payment_verified', {
        phase: 'start',
        source,
        event,
        gatewayPaymentId,
        gatewayOrderId
    });
    try {
        session.startTransaction();
        const tx = await Transaction_1.Transaction.findOneAndUpdate({
            $or: [
                ...(gatewayPaymentId ? [{ gatewayPaymentId }] : []),
                ...(gatewayOrderId ? [{ gatewayOrderId }] : [])
            ],
            applied: false
        }, {
            $set: {
                status: 'SUCCESS',
                ...(gatewayPaymentId ? { gatewayPaymentId } : {}),
                ...(gatewayOrderId ? { gatewayOrderId } : {}),
                updatedAt: new Date()
            }
        }, { new: true, session });
        if (!tx) {
            const existing = await Transaction_1.Transaction.findOne({
                $or: [
                    ...(gatewayPaymentId ? [{ gatewayPaymentId }] : []),
                    ...(gatewayOrderId ? [{ gatewayOrderId }] : [])
                ]
            }).session(session);
            await session.abortTransaction();
            if (existing?.applied || (existing?.status === 'SUCCESS' && existing?.applied !== false)) {
                (0, logger_1.logBusiness)('payment_verified', {
                    phase: 'duplicate',
                    source,
                    event,
                    transactionId: existing._id.toString(),
                    gatewayPaymentId,
                    gatewayOrderId
                });
                return { result: 'duplicate', transactionId: existing._id.toString() };
            }
            logger_1.default.warn('Payment event referenced unknown order', {
                source,
                event,
                gatewayPaymentId,
                gatewayOrderId
            });
            return { result: 'missing', reason: 'unknown_order' };
        }
        committedTransactionId = tx._id.toString();
        if (!(0, GatewayService_1.matchesGatewayAmount)(tx, gatewayAmountPaise)) {
            tx.status = 'FAILED';
            tx.metadata = {
                ...tx.metadata,
                paymentFailure: {
                    reason: 'amount_mismatch',
                    source,
                    gatewayAmountPaise,
                    expectedAmountPaise: Math.round(tx.amount * 100)
                }
            };
            await tx.save({ session });
            await session.commitTransaction();
            (0, logger_1.logSecurity)('payment_amount_mismatch', 'high', {
                transactionId: tx._id.toString(),
                gatewayPaymentId,
                gatewayOrderId,
                gatewayAmountPaise,
                expectedAmountPaise: Math.round(tx.amount * 100)
            });
            void AdminLog_1.default.create({
                action: 'PAYMENT_FAILED_AMOUNT_MISMATCH',
                targetType: 'Transaction',
                targetId: tx._id.toString(),
                metadata: {
                    gatewayPaymentId,
                    gatewayOrderId,
                    gatewayAmountPaise,
                    expectedAmountPaise: Math.round(tx.amount * 100)
                }
            }).catch(err => logger_1.default.error('Failed to create AdminLog for payment failure', err));
            return { result: 'failed', transactionId: tx._id.toString(), reason: 'amount_mismatch' };
        }
        const normGatewayCurrency = (0, GatewayService_1.normalizeGatewayCurrency)(gatewayCurrency);
        const normTransactionCurrency = (0, GatewayService_1.normalizeGatewayCurrency)(tx.currency);
        if (gatewayCurrency && normGatewayCurrency !== normTransactionCurrency) {
            tx.status = 'FAILED';
            tx.metadata = {
                ...tx.metadata,
                paymentFailure: {
                    reason: 'currency_mismatch',
                    source,
                    gatewayCurrency: normGatewayCurrency,
                    expectedCurrency: normTransactionCurrency
                }
            };
            await tx.save({ session });
            await session.commitTransaction();
            (0, logger_1.logSecurity)('payment_currency_mismatch', 'high', {
                transactionId: tx._id.toString(),
                gatewayPaymentId,
                gatewayOrderId,
                gatewayCurrency: normGatewayCurrency,
                expectedCurrency: normTransactionCurrency
            });
            void AdminLog_1.default.create({
                action: 'PAYMENT_FAILED_CURRENCY_MISMATCH',
                targetType: 'Transaction',
                targetId: tx._id.toString(),
                metadata: {
                    gatewayPaymentId,
                    gatewayOrderId,
                    gatewayCurrency: normGatewayCurrency,
                    expectedCurrency: normTransactionCurrency
                }
            }).catch(err => logger_1.default.error('Failed to create AdminLog for payment failure', err));
            return { result: 'failed', transactionId: tx._id.toString(), reason: 'currency_mismatch' };
        }
        const walletIncrement = (0, WalletService_1.buildWalletIncrement)(tx);
        if ((0, WalletService_1.hasWalletIncrement)(walletIncrement)) {
            await (0, WalletService_1.credit)({
                userId: tx.userId.toString(),
                amount: walletIncrement,
                reason: `Package Purchase: ${tx.planSnapshot?.name || tx.planSnapshot?.code}`,
                metadata: {
                    gatewayPaymentId,
                    gatewayOrderId,
                    source
                },
                session
            });
            (0, logger_1.logBusiness)('wallet_updated', {
                transactionId: tx._id.toString(),
                userId: tx.userId.toString(),
                walletIncrement
            });
        }
        let invoice = await Invoice_1.Invoice.findOne({ transactionId: tx._id }).session(session);
        if (!invoice) {
            const { invoiceData } = await (0, InvoiceService_1.buildInvoicePayload)(tx, session);
            const invoices = await Invoice_1.Invoice.create([invoiceData], { session });
            invoice = invoices[0] || null;
        }
        tx.applied = true;
        tx.status = 'SUCCESS';
        await tx.save({ session });
        committedInvoiceId = invoice?._id?.toString();
        await session.commitTransaction();
        (0, logger_1.logBusiness)('payment_verified', {
            phase: 'committed',
            source,
            event,
            transactionId: committedTransactionId,
            invoiceId: committedInvoiceId
        });
        // 🛡️ Administrative Audit Logging
        void AdminLog_1.default.create({
            action: 'PAYMENT_VERIFIED',
            targetType: 'Transaction',
            targetId: committedTransactionId,
            metadata: {
                source,
                event,
                gatewayPaymentId,
                gatewayOrderId,
                invoiceId: committedInvoiceId
            }
        }).catch(err => logger_1.default.error('Failed to create AdminLog for payment', err));
        // Background tasks post-commit
        try {
            await (0, RevenueAnalytics_1.recordRevenue)(tx, (0, TransactionService_1.resolveCategoryName)(tx));
        }
        catch (analyticsError) {
            logger_1.default.error('Revenue analytics recording failed after payment commit', {
                transactionId: committedTransactionId,
                error: analyticsError instanceof Error ? analyticsError.message : String(analyticsError)
            });
        }
        await (0, InvoiceService_1.ensureInvoicePdf)(committedInvoiceId);
        return {
            result: 'processed',
            transactionId: committedTransactionId,
            invoiceId: committedInvoiceId
        };
    }
    catch (error) {
        await session.abortTransaction();
        logger_1.default.error('Payment processing failed', {
            source,
            event,
            gatewayPaymentId,
            gatewayOrderId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
    finally {
        void session.endSession();
    }
}
/**
 * Orchestrator for payment recovery.
 */
async function recoverPendingPayment(tx) {
    const gatewayResult = await GatewayService_1.GatewayService.fetchRecoveryOutcome(tx);
    if (gatewayResult.status === 'success') {
        return processSuccessfulPayment({
            source: 'recovery',
            gatewayOrderId: gatewayResult.gatewayOrderId,
            gatewayPaymentId: gatewayResult.gatewayPaymentId,
            gatewayAmountPaise: gatewayResult.gatewayAmountPaise,
            gatewayCurrency: gatewayResult.gatewayCurrency
        });
    }
    if (gatewayResult.status === 'failed') {
        await Transaction_1.Transaction.updateOne({ _id: tx._id, applied: false }, {
            $set: {
                status: 'FAILED',
                updatedAt: new Date(),
                metadata: {
                    ...tx.metadata,
                    paymentFailure: {
                        reason: gatewayResult.reason,
                        source: 'recovery'
                    }
                }
            }
        });
        (0, logger_1.logBusiness)('payment_verified', {
            phase: 'recovery_failed',
            transactionId: tx._id.toString(),
            gatewayOrderId: tx.gatewayOrderId,
            reason: gatewayResult.reason
        });
        return { result: 'failed', transactionId: tx._id.toString(), reason: gatewayResult.reason };
    }
    logger_1.default.warn('Pending payment recovery unresolved', {
        transactionId: tx._id.toString(),
        gatewayOrderId: tx.gatewayOrderId,
        reason: gatewayResult.reason
    });
    return { result: 'missing', transactionId: tx._id.toString(), reason: gatewayResult.reason };
}
//# sourceMappingURL=PaymentProcessingService.js.map