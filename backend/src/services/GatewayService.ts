import { getRazorpayClient } from '../controllers/payment/shared';
import { type ITransaction } from '../models/Transaction';
import logger from '../utils/logger';

export type RazorpayOrderLike = {
    amount?: number;
    currency?: string;
    status?: string;
};

export type RazorpayPaymentLike = {
    id?: string;
    amount?: number | string;
    currency?: string;
    status?: string;
};

export type RecoveryOutcome =
    | ({ status: 'success' } & { gatewayOrderId: string; gatewayPaymentId?: string; gatewayAmountPaise: number; gatewayCurrency: string })
    | { status: 'failed'; reason: string }
    | { status: 'unresolved'; reason: string };

export const toNumericAmount = (value: number | string | undefined) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

export const normalizeGatewayCurrency = (currency?: string) => (currency || 'INR').toUpperCase();

export const matchesGatewayAmount = (tx: ITransaction, gatewayAmountPaise?: number) => {
    if (!Number.isFinite(gatewayAmountPaise)) return true;
    return Math.round(tx.amount * 100) === gatewayAmountPaise;
};

export const findCapturedPaymentForOrder = async (gatewayOrderId: string): Promise<RazorpayPaymentLike | undefined> => {
    const razorpay = await getRazorpayClient();
    const ordersApi = razorpay.orders as typeof razorpay.orders & {
        fetchPayments?: (orderId: string) => Promise<{ items?: RazorpayPaymentLike[] }>;
    };

    if (!ordersApi.fetchPayments) return undefined;
    const paymentList = await ordersApi.fetchPayments(gatewayOrderId);
    const items = paymentList?.items || [];
    return items.find((item) => item.status === 'captured') || items[0];
};

export const fetchGatewayRecoveryOutcome = async (tx: ITransaction): Promise<RecoveryOutcome> => {
    if (tx.paymentGateway === 'mock') {
        return { status: 'failed', reason: 'mock_transaction_expired' };
    }

    if (!tx.gatewayOrderId) {
        return { status: 'unresolved', reason: 'missing_gateway_order_id' };
    }

    try {
        const razorpay = await getRazorpayClient();
        const order = await razorpay.orders.fetch(tx.gatewayOrderId) as RazorpayOrderLike;

        if (order.status === 'paid') {
            const payment = tx.gatewayPaymentId
                ? await razorpay.payments.fetch(tx.gatewayPaymentId)
                : await findCapturedPaymentForOrder(tx.gatewayOrderId);

            return {
                status: 'success',
                gatewayOrderId: tx.gatewayOrderId,
                gatewayPaymentId: payment?.id || tx.gatewayPaymentId,
                gatewayAmountPaise: toNumericAmount(payment?.amount) ?? (order.amount || 0),
                gatewayCurrency: payment?.currency || order.currency || 'INR'
            };
        }

        if (order.status === 'created' || order.status === 'attempted') {
            return { status: 'failed', reason: `gateway_order_${order.status}` };
        }

        return { status: 'unresolved', reason: `gateway_order_${order.status}` };
    } catch (error) {
        logger.error('Failed to fetch gateway recovery outcome', {
            transactionId: tx._id.toString(),
            gatewayOrderId: tx.gatewayOrderId,
            error: error instanceof Error ? error.message : String(error)
        });
        return { status: 'unresolved', reason: 'gateway_api_error' };
    }
};
