import { type ClientSession } from 'mongoose';
import { getUserConnection } from '../config/db';
import { Invoice } from '../models/Invoice';
import { Transaction, type ITransaction } from '../models/Transaction';
import { 
    credit, 
    buildWalletIncrement, 
    hasWalletIncrement 
} from './WalletService';
import { recordRevenue } from './RevenueAnalytics';
import { 
    buildInvoicePayload, 
    ensureInvoicePdf 
} from './InvoiceService';
import { 
    matchesGatewayAmount, 
    normalizeGatewayCurrency, 
    fetchGatewayRecoveryOutcome 
} from './GatewayService';
import { resolveCategoryName } from './TransactionService';
import logger, { logBusiness, logSecurity } from '../utils/logger';

export type PaymentProcessingSource = 'webhook' | 'recovery';

export type PaymentProcessResult =
    | 'processed'
    | 'duplicate'
    | 'missing'
    | 'failed';

export type ProcessPaymentParams = {
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
    gatewayAmountPaise?: number;
    gatewayCurrency?: string;
    source: PaymentProcessingSource;
    event?: string;
};

export type ProcessPaymentResponse = {
    result: PaymentProcessResult;
    transactionId?: string;
    invoiceId?: string;
    reason?: string;
};

/**
 * Orchestrator for successful payment flow.
 * Coordinates between Transaction, Wallet, and Invoice services.
 */
export async function processSuccessfulPayment(
    params: ProcessPaymentParams
): Promise<ProcessPaymentResponse> {
    const { gatewayPaymentId, gatewayOrderId, gatewayAmountPaise, gatewayCurrency, source, event } = params;
    if (!gatewayPaymentId && !gatewayOrderId) {
        logger.warn('Payment processing skipped because no gateway identifiers were provided', {
            source,
            event
        });
        return { result: 'missing', reason: 'missing_gateway_identifiers' };
    }

    const session = await getUserConnection().startSession();
    let committedInvoiceId: string | undefined;
    let committedTransactionId: string | undefined;

    logBusiness('payment_verified', {
        phase: 'start',
        source,
        event,
        gatewayPaymentId,
        gatewayOrderId
    });

    try {
        session.startTransaction();

        const tx = await Transaction.findOneAndUpdate(
            {
                $or: [
                    ...(gatewayPaymentId ? [{ gatewayPaymentId }] : []),
                    ...(gatewayOrderId ? [{ gatewayOrderId }] : [])
                ],
                applied: false
            },
            {
                $set: {
                    status: 'SUCCESS',
                    ...(gatewayPaymentId ? { gatewayPaymentId } : {}),
                    ...(gatewayOrderId ? { gatewayOrderId } : {}),
                    updatedAt: new Date()
                }
            },
            { new: true, session }
        );

        if (!tx) {
            const existing = await Transaction.findOne({
                $or: [
                    ...(gatewayPaymentId ? [{ gatewayPaymentId }] : []),
                    ...(gatewayOrderId ? [{ gatewayOrderId }] : [])
                ]
            }).session(session);

            await session.abortTransaction();

            if (existing?.applied || (existing?.status === 'SUCCESS' && existing?.applied !== false)) {
                logBusiness('payment_verified', {
                    phase: 'duplicate',
                    source,
                    event,
                    transactionId: existing._id.toString(),
                    gatewayPaymentId,
                    gatewayOrderId
                });
                return { result: 'duplicate', transactionId: existing._id.toString() };
            }

            logger.warn('Payment event referenced unknown order', {
                source,
                event,
                gatewayPaymentId,
                gatewayOrderId
            });
            return { result: 'missing', reason: 'unknown_order' };
        }

        committedTransactionId = tx._id.toString();

        if (!matchesGatewayAmount(tx, gatewayAmountPaise)) {
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

            logSecurity('payment_amount_mismatch', 'high', {
                transactionId: tx._id.toString(),
                gatewayPaymentId,
                gatewayOrderId,
                gatewayAmountPaise,
                expectedAmountPaise: Math.round(tx.amount * 100)
            });

            return { result: 'failed', transactionId: tx._id.toString(), reason: 'amount_mismatch' };
        }

        const normGatewayCurrency = normalizeGatewayCurrency(gatewayCurrency);
        const normTransactionCurrency = normalizeGatewayCurrency(tx.currency);
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

            logSecurity('payment_currency_mismatch', 'high', {
                transactionId: tx._id.toString(),
                gatewayPaymentId,
                gatewayOrderId,
                gatewayCurrency: normGatewayCurrency,
                expectedCurrency: normTransactionCurrency
            });

            return { result: 'failed', transactionId: tx._id.toString(), reason: 'currency_mismatch' };
        }

        const walletIncrement = buildWalletIncrement(tx);
        if (hasWalletIncrement(walletIncrement)) {
            await credit({
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

            logBusiness('wallet_updated', {
                transactionId: tx._id.toString(),
                userId: tx.userId.toString(),
                walletIncrement
            });
        }

        let invoice = await Invoice.findOne({ transactionId: tx._id }).session(session);
        if (!invoice) {
            const { invoiceData } = await buildInvoicePayload(tx, session);
            const invoices = await Invoice.create([invoiceData], { session });
            invoice = invoices[0] || null;
        }

        tx.applied = true;
        tx.status = 'SUCCESS';
        await tx.save({ session });

        committedInvoiceId = invoice?._id?.toString();

        await session.commitTransaction();

        logBusiness('payment_verified', {
            phase: 'committed',
            source,
            event,
            transactionId: committedTransactionId,
            invoiceId: committedInvoiceId
        });

        // Background tasks post-commit
        try {
            await recordRevenue(tx, resolveCategoryName(tx));
        } catch (analyticsError) {
            logger.error('Revenue analytics recording failed after payment commit', {
                transactionId: committedTransactionId,
                error: analyticsError instanceof Error ? analyticsError.message : String(analyticsError)
            });
        }

        await ensureInvoicePdf(committedInvoiceId);

        return {
            result: 'processed',
            transactionId: committedTransactionId,
            invoiceId: committedInvoiceId
        };
    } catch (error) {
        await session.abortTransaction();
        logger.error('Payment processing failed', {
            source,
            event,
            gatewayPaymentId,
            gatewayOrderId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    } finally {
        void session.endSession();
    }
}

/**
 * Orchestrator for payment recovery.
 */
export async function recoverPendingPayment(tx: ITransaction): Promise<ProcessPaymentResponse> {
    const gatewayResult = await fetchGatewayRecoveryOutcome(tx);

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
        await Transaction.updateOne(
            { _id: tx._id, applied: false },
            {
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
            }
        );

        logBusiness('payment_verified', {
            phase: 'recovery_failed',
            transactionId: tx._id.toString(),
            gatewayOrderId: tx.gatewayOrderId,
            reason: gatewayResult.reason
        });

        return { result: 'failed', transactionId: tx._id.toString(), reason: gatewayResult.reason };
    }

    logger.warn('Pending payment recovery unresolved', {
        transactionId: tx._id.toString(),
        gatewayOrderId: tx.gatewayOrderId,
        reason: gatewayResult.reason
    });

    return { result: 'missing', transactionId: tx._id.toString(), reason: gatewayResult.reason };
}

// Re-exports for backward compatibility (Will be removed in final cleanup Phase 2)
export { 
    checkTransactionVelocity, 
    findPendingTransaction, 
    createPaymentTransaction, 
    getUserTransactions, 
    getTransactionWithUser, 
    findTransactionForUpdate, 
    saveTransaction,
    resolveCategoryName
} from './TransactionService';
export { 
    getActivePlans, 
    getPlanById, 
    findPlanByIdOrCode, 
    upsertUserPlan 
} from './PlanService';
export { 
    getInvoiceByIdOrTransaction 
} from './InvoiceService';
export {
    getUserForPayment
} from './TransactionService'; // Assuming we moved or will move it
