import logger, { logBusiness } from "../utils/logger";
import { Transaction } from "../models/Transaction";
import { processSuccessfulPayment, recoverPendingPayment } from "../services/PaymentProcessingService";

/**
 * 🔄 PAYMENT RECONCILIATION JOB
 * 1. Repairs transactions already marked SUCCESS but not yet applied.
 * 2. Recovers INITIATED transactions older than 10 minutes in case the webhook was missed.
 */
export async function reconcilePayments(): Promise<void> {
    logger.info("Starting Payment Reconciliation");

    const unappliedTransactions = await Transaction.find({
        status: "SUCCESS",
        applied: false
    });

    for (const tx of unappliedTransactions) {
        try {
            const result = await processSuccessfulPayment({
                source: "recovery",
                gatewayPaymentId: tx.gatewayPaymentId,
                gatewayOrderId: tx.gatewayOrderId
            });

            logBusiness("payment_verified", {
                phase: "reconcile_success_status",
                transactionId: tx._id.toString(),
                result: result.result
            });
        } catch (error) {
            logger.error("Failed to reconcile successful unapplied transaction", {
                transactionId: tx._id.toString(),
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const staleInitiatedTransactions = await Transaction.find({
        status: "INITIATED",
        applied: false,
        createdAt: { $lte: tenMinutesAgo }
    });

    for (const tx of staleInitiatedTransactions) {
        try {
            const result = await recoverPendingPayment(tx);
            logBusiness("payment_verified", {
                phase: "recovery_pending_status",
                transactionId: tx._id.toString(),
                result: result.result,
                reason: result.reason
            });
        } catch (error) {
            logger.error("Failed to recover pending transaction", {
                transactionId: tx._id.toString(),
                gatewayOrderId: tx.gatewayOrderId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    logger.info("Payment Reconciliation completed", {
        unappliedTransactions: unappliedTransactions.length,
        staleInitiatedTransactions: staleInitiatedTransactions.length
    });
}
