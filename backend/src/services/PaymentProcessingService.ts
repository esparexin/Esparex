import type { ClientSession } from "mongoose";
import { getUserConnection } from "../config/db";
import { Invoice, type IInvoice } from "../models/Invoice";
import { Transaction, type ITransaction } from "../models/Transaction";
import User from "../models/User";
import Business from "../models/Business";
import { credit, type WalletAmount } from "./WalletService";
import { recordRevenue } from "./RevenueAnalytics";
import { generateInvoiceNumber } from "../utils/invoiceNumber";
import { generateInvoicePdf } from "./InvoicePdfService";
import { razorpay } from "../controllers/payment/shared";
import logger, { logBusiness, logSecurity } from "../utils/logger";

export type PaymentProcessingSource = "webhook" | "recovery";

export type PaymentProcessResult =
    | "processed"
    | "duplicate"
    | "missing"
    | "failed";

type PaymentGatewayVerification = {
    gatewayPaymentId?: string;
    gatewayOrderId?: string;
    gatewayAmountPaise?: number;
    gatewayCurrency?: string;
};

type ProcessPaymentParams = PaymentGatewayVerification & {
    source: PaymentProcessingSource;
    event?: string;
};

type ProcessPaymentResponse = {
    result: PaymentProcessResult;
    transactionId?: string;
    invoiceId?: string;
    reason?: string;
};

type RecoveryOutcome =
    | ({ status: "success" } & Required<Pick<PaymentGatewayVerification, "gatewayOrderId">> & PaymentGatewayVerification)
    | { status: "failed"; reason: string }
    | { status: "unresolved"; reason: string };

const PAYMENT_SAC_CODE = "998599";

type RazorpayOrderLike = {
    amount?: number;
    currency?: string;
    status?: string;
};

type RazorpayPaymentLike = {
    id?: string;
    amount?: number | string;
    currency?: string;
    status?: string;
};

const toNumericAmount = (value: number | string | undefined) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

const buildWalletIncrement = (tx: ITransaction): WalletAmount => {
    const kind = tx.planSnapshot?.type;
    const credits = tx.planSnapshot?.credits || 0;
    const amount: WalletAmount = {};

    if (kind === "AD_PACK") amount.adCredits = credits;
    if (kind === "SPOTLIGHT") amount.spotlightCredits = credits;
    if (kind === "SMART_ALERT") amount.smartAlertSlots = credits;

    return amount;
};

const hasWalletIncrement = (amount: WalletAmount) => Object.values(amount).some((value) => Number(value || 0) > 0);

const resolveCategoryName = (tx: ITransaction) =>
    typeof tx.metadata?.categoryName === "string" ? tx.metadata.categoryName : undefined;

const matchesGatewayAmount = (tx: ITransaction, gatewayAmountPaise?: number) => {
    if (!Number.isFinite(gatewayAmountPaise)) return true;
    return Math.round(tx.amount * 100) === gatewayAmountPaise;
};

const normalizeGatewayCurrency = (currency?: string) => (currency || "INR").toUpperCase();

const buildInvoicePayload = async (
    tx: ITransaction,
    session: ClientSession
): Promise<{ invoiceData: Partial<IInvoice>; user: Awaited<ReturnType<typeof User.findById>> | null; business?: any }> => {
    const user = await User.findById(tx.userId)
        .select("name email mobile address businessId")
        .session(session)
        .lean();

    let business: any = null;
    if (user?.businessId) {
        business = await Business.findById(user.businessId).session(session).lean();
    }

    const subtotal = Number((tx.amount / 1.18).toFixed(2));
    const gstAmount = Number((tx.amount - subtotal).toFixed(2));
    const halfTax = Number((gstAmount / 2).toFixed(2));
    const issuedAt = new Date();

    const gstin = typeof business?.gstNumber === "string" ? business.gstNumber : undefined;

    return {
        user,
        business,
        invoiceData: {
            invoiceNumber: await generateInvoiceNumber(session),
            userId: tx.userId,
            transactionId: tx._id,
            planSnapshot: tx.planSnapshot,
            items: [{
                description: tx.planSnapshot?.name || tx.description || "Esparex purchase",
                quantity: 1,
                unitPrice: subtotal,
                total: subtotal
            }],
            isGstInvoice: true,
            gstin,
            sacCode: PAYMENT_SAC_CODE,
            billingAddress: {
                line1: typeof business?.name === "string" ? business.name : (typeof user?.name === "string" ? user.name : undefined),
                line2: business?.location?.address || undefined,
                city: business?.location?.city || user?.location?.city,
                country: "India"
            },
            subtotal,
            cgst: halfTax,
            sgst: halfTax,
            igst: 0,
            total: tx.amount,
            amount: tx.amount,
            currency: tx.currency,
            status: "SUCCESS",
            tax: {
                gst: gstAmount,
                total: tx.amount
            },
            issuedAt
        }
    };
};

const ensureInvoicePdf = async (invoiceId?: string) => {
    if (!invoiceId) return;

    const invoice = await Invoice.findById(invoiceId).lean();
    if (!invoice || invoice.pdfUrl) return;

    const user = await User.findById(invoice.userId).select("name email mobile address businessId").lean();
    let business: any = null;
    if (user?.businessId) {
        business = await Business.findById(user.businessId).lean();
    }

    try {
        const pdfUrl = await generateInvoicePdf({
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            currency: invoice.currency,
            issuedAt: invoice.issuedAt,
            subtotal: invoice.subtotal,
            cgst: invoice.cgst,
            sgst: invoice.sgst,
            igst: invoice.igst,
            total: invoice.total,
            gstin: invoice.gstin,
            sacCode: invoice.sacCode,
            user: (business ? { 
                name: business.name, 
                email: business.email, 
                mobile: business.mobile 
            } : user) || null
        });

        if (!pdfUrl) return;

        await Invoice.updateOne(
            { _id: invoice._id, pdfUrl: { $exists: false } },
            { $set: { pdfUrl } }
        );

        logBusiness("invoice_generated", {
            invoiceId: invoice._id.toString(),
            invoiceNumber: invoice.invoiceNumber,
            pdfUrl
        });
    } catch (error) {
        logger.error("Failed to generate invoice PDF after payment commit", {
            invoiceId: invoice._id.toString(),
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export async function processSuccessfulPayment(
    params: ProcessPaymentParams
): Promise<ProcessPaymentResponse> {
    const { gatewayPaymentId, gatewayOrderId, gatewayAmountPaise, gatewayCurrency, source, event } = params;
    if (!gatewayPaymentId && !gatewayOrderId) {
        logger.warn("Payment processing skipped because no gateway identifiers were provided", {
            source,
            event
        });
        return { result: "missing", reason: "missing_gateway_identifiers" };
    }

    const session = await getUserConnection().startSession();
    let committedInvoiceId: string | undefined;
    let committedTransactionId: string | undefined;

    logBusiness("payment_verified", {
        phase: "start",
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
                    status: "SUCCESS",
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

            if (existing?.applied || (existing?.status === "SUCCESS" && existing?.applied !== false)) {
                logBusiness("payment_verified", {
                    phase: "duplicate",
                    source,
                    event,
                    transactionId: existing._id.toString(),
                    gatewayPaymentId,
                    gatewayOrderId
                });
                return { result: "duplicate", transactionId: existing._id.toString() };
            }

            logger.warn("Payment event referenced unknown order", {
                source,
                event,
                gatewayPaymentId,
                gatewayOrderId
            });
            return { result: "missing", reason: "unknown_order" };
        }

        committedTransactionId = tx._id.toString();

        if (!matchesGatewayAmount(tx, gatewayAmountPaise)) {
            tx.status = "FAILED";
            tx.metadata = {
                ...tx.metadata,
                paymentFailure: {
                    reason: "amount_mismatch",
                    source,
                    gatewayAmountPaise,
                    expectedAmountPaise: Math.round(tx.amount * 100)
                }
            };
            await tx.save({ session });
            await session.commitTransaction();

            logSecurity("payment_amount_mismatch", "high", {
                transactionId: tx._id.toString(),
                gatewayPaymentId,
                gatewayOrderId,
                gatewayAmountPaise,
                expectedAmountPaise: Math.round(tx.amount * 100)
            });

            return { result: "failed", transactionId: tx._id.toString(), reason: "amount_mismatch" };
        }

        const normalizedGatewayCurrency = normalizeGatewayCurrency(gatewayCurrency);
        const normalizedTransactionCurrency = normalizeGatewayCurrency(tx.currency);
        if (gatewayCurrency && normalizedGatewayCurrency !== normalizedTransactionCurrency) {
            tx.status = "FAILED";
            tx.metadata = {
                ...tx.metadata,
                paymentFailure: {
                    reason: "currency_mismatch",
                    source,
                    gatewayCurrency: normalizedGatewayCurrency,
                    expectedCurrency: normalizedTransactionCurrency
                }
            };
            await tx.save({ session });
            await session.commitTransaction();

            logSecurity("payment_currency_mismatch", "high", {
                transactionId: tx._id.toString(),
                gatewayPaymentId,
                gatewayOrderId,
                gatewayCurrency: normalizedGatewayCurrency,
                expectedCurrency: normalizedTransactionCurrency
            });

            return { result: "failed", transactionId: tx._id.toString(), reason: "currency_mismatch" };
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

            logBusiness("wallet_updated", {
                transactionId: tx._id.toString(),
                userId: tx.userId.toString(),
                walletIncrement
            });
        }

        await recordRevenue(tx, resolveCategoryName(tx), session);

            let invoice: IInvoice | null = await Invoice.findOne({ transactionId: tx._id }).session(session);
            if (!invoice) {
                const { invoiceData } = await buildInvoicePayload(tx, session);
                const invoices = await Invoice.create([invoiceData], { session });
                invoice = invoices[0] || null;
            }

        tx.applied = true;
        tx.status = "SUCCESS";
        await tx.save({ session });

        committedInvoiceId = invoice?._id?.toString();

        await session.commitTransaction();

        logBusiness("payment_verified", {
            phase: "committed",
            source,
            event,
            transactionId: committedTransactionId,
            invoiceId: committedInvoiceId
        });

        await ensureInvoicePdf(committedInvoiceId);

        return {
            result: "processed",
            transactionId: committedTransactionId,
            invoiceId: committedInvoiceId
        };
    } catch (error) {
        await session.abortTransaction();
        logger.error("Payment processing failed", {
            source,
            event,
            gatewayPaymentId,
            gatewayOrderId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    } finally {
        session.endSession();
    }
}

const findCapturedPaymentForOrder = async (gatewayOrderId: string): Promise<RazorpayPaymentLike | undefined> => {
    const ordersApi = razorpay.orders as typeof razorpay.orders & {
        fetchPayments?: (orderId: string) => Promise<{ items?: RazorpayPaymentLike[] }>;
    };

    if (!ordersApi.fetchPayments) return undefined;
    const paymentList = await ordersApi.fetchPayments(gatewayOrderId);
    const items = paymentList?.items || [];
    return items.find((item) => item.status === "captured") || items[0];
};

const fetchGatewayRecoveryOutcome = async (tx: ITransaction): Promise<RecoveryOutcome> => {
    if (tx.paymentGateway === "mock") {
        return { status: "failed", reason: "mock_transaction_expired" };
    }

    if (!tx.gatewayOrderId) {
        return { status: "unresolved", reason: "missing_gateway_order_id" };
    }

    const order = await razorpay.orders.fetch(tx.gatewayOrderId) as RazorpayOrderLike;

    if (order.status === "paid") {
        const payment = tx.gatewayPaymentId
            ? await razorpay.payments.fetch(tx.gatewayPaymentId)
            : await findCapturedPaymentForOrder(tx.gatewayOrderId);

        return {
            status: "success",
            gatewayOrderId: tx.gatewayOrderId,
            gatewayPaymentId: payment?.id || tx.gatewayPaymentId,
            gatewayAmountPaise: toNumericAmount(payment?.amount) ?? order.amount,
            gatewayCurrency: payment?.currency || order.currency
        };
    }

    if (order.status === "created" || order.status === "attempted") {
        return { status: "failed", reason: `gateway_order_${order.status}` };
    }

    return { status: "unresolved", reason: `gateway_order_${order.status}` };
};

export async function recoverPendingPayment(tx: ITransaction): Promise<ProcessPaymentResponse> {
    const gatewayResult = await fetchGatewayRecoveryOutcome(tx);

    if (gatewayResult.status === "success") {
        return processSuccessfulPayment({
            source: "recovery",
            gatewayOrderId: gatewayResult.gatewayOrderId,
            gatewayPaymentId: gatewayResult.gatewayPaymentId,
            gatewayAmountPaise: gatewayResult.gatewayAmountPaise,
            gatewayCurrency: gatewayResult.gatewayCurrency
        });
    }

    if (gatewayResult.status === "failed") {
        await Transaction.updateOne(
            { _id: tx._id, applied: false },
            {
                $set: {
                    status: "FAILED",
                    updatedAt: new Date(),
                    metadata: {
                        ...tx.metadata,
                        paymentFailure: {
                            reason: gatewayResult.reason,
                            source: "recovery"
                        }
                    }
                }
            }
        );

        logBusiness("payment_verified", {
            phase: "recovery_failed",
            transactionId: tx._id.toString(),
            gatewayOrderId: tx.gatewayOrderId,
            reason: gatewayResult.reason
        });

        return { result: "failed", transactionId: tx._id.toString(), reason: gatewayResult.reason };
    }

    logger.warn("Pending payment recovery unresolved", {
        transactionId: tx._id.toString(),
        gatewayOrderId: tx.gatewayOrderId,
        reason: gatewayResult.reason
    });

    return { result: "missing", transactionId: tx._id.toString(), reason: gatewayResult.reason };
}
