import { logger } from '@esparex/core';
import { env } from '@esparex/core';
import { Request, Response } from 'express';
import crypto from 'crypto';
import {
    checkTransactionVelocity,
    findPendingTransaction,
    createPaymentTransaction,
    getUserForPayment,
} from '@esparex/core/domains/payments';
import { getPlanById } from '@esparex/core/domains/payments';
import { processSuccessfulPayment } from '@esparex/core/domains/payments';
import { respond } from "../../utils/respond";
import { ApiResponse } from "@esparex/contracts";
import { getPrimaryPlanCreditCount } from "@esparex/shared";
import { sendErrorResponse } from "../../utils/errorResponse";
import { buildMockOrder, getRazorpayClient, getRazorpayRuntimeConfig } from '@esparex/core';
import { logBusiness, logSecurity } from '@esparex/core';

const formatErrorDetails = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null) {
        const obj = err as Record<string, unknown>;
        if (typeof obj.description === 'string') return obj.description;
        if (typeof obj.message === 'string') return obj.message;
        if (typeof obj.error === 'object' && obj.error !== null) {
            const inner = obj.error as Record<string, unknown>;
            if (typeof inner.description === 'string') return inner.description;
            if (typeof inner.message === 'string') return inner.message;
        }
        try {
            return JSON.stringify(err);
        } catch {
            return String(err);
        }
    }
    return String(err);
};

/**
 * 1. CREATE ORDER
 * Initiates valid transaction sequence using Razorpay SDK.
 */
export const createPaymentOrder = async (req: Request, res: Response) => {
    try {
        if (!req.user) return sendErrorResponse(req, res, 401, 'Unauthorized');

        // Receive as unknown — never trust client shape
        const { planId } = req.body as { planId?: unknown };

        if (typeof planId !== 'string') {
            return sendErrorResponse(req, res, 400, 'Plan ID required');
        }

        const normalizedPlanId = planId.trim();

        if (!normalizedPlanId) {
            return sendErrorResponse(req, res, 400, 'Plan ID required');
        }

        const user = await getUserForPayment((req.user)._id);
        if (!user) return sendErrorResponse(req, res, 404, 'User not found');

        const plan = await getPlanById(normalizedPlanId);
        if (!plan || !plan.active) return sendErrorResponse(req, res, 404, 'Invalid or inactive plan');
        const isZeroCost = plan.price === 0;
        const razorpayConfig = await getRazorpayRuntimeConfig();
        // P1-F22: mock from plan cost + server flag only (header bypass removed).
        const isMock = isZeroCost || env.MOCK_PAYMENTS;

        if (!isMock && !razorpayConfig.enabled) {
            return sendErrorResponse(req, res, 503, 'Payments are currently unavailable');
        }

        const velocityCount = await checkTransactionVelocity(user._id, 60 * 60 * 1000);

        if (velocityCount >= 5) {
            logSecurity('payment_purchase_velocity_limit_exceeded', 'high', {
                userId: user._id.toString(),
                velocityCount
            });
            return sendErrorResponse(req, res, 429, 'Purchase rate limit exceeded. Please try again later.');
        }

        const existingPendingTransaction = await findPendingTransaction(user._id, plan._id, 10 * 60 * 1000);

        if (existingPendingTransaction?.gatewayOrderId) {
            logBusiness('order_created', {
                phase: 'reuse_existing',
                userId: user._id.toString(),
                transactionId: existingPendingTransaction._id.toString(),
                gatewayOrderId: existingPendingTransaction.gatewayOrderId
            });
            return res.json(respond<ApiResponse<unknown>>({
                success: true,
                data: {
                    orderId: existingPendingTransaction.gatewayOrderId,
                    transactionId: existingPendingTransaction._id,
                    amount: existingPendingTransaction.amount,
                    currency: existingPendingTransaction.currency || plan.currency || 'INR',
                    keyId: razorpayConfig.keyId,
                    userName: user.name || 'User',
                    userEmail: user.email || '',
                    userPhone: user.mobile || ''
                }
            }));
        }

        let rzpOrder;
        if (isMock) {
            rzpOrder = buildMockOrder(plan.price * 100, plan.currency || 'INR');
        } else {
            try {
                const razorpay = await getRazorpayClient();
                rzpOrder = await razorpay.orders.create({
                    amount: Math.round(plan.price * 100),
                    currency: plan.currency || 'INR',
                    receipt: `rcpt_${crypto.randomBytes(8).toString('hex')}`
                });
            } catch (rzpErr) {
                // P1-F29: paid orders never degrade to mock (zero-cost never
                // reaches here); outages surface as 502/503 with dev diagnostics.
                const errDetail = formatErrorDetails(rzpErr);
                logger.error('[PAYMENT] Razorpay order creation failed:', {
                    error: errDetail
                });
                throw new Error(`Razorpay API Error: ${errDetail}`);
            }
        }

        const transaction = await createPaymentTransaction({
            userId: user._id,
            planId: plan._id,
            planSnapshot: {
                code: plan.code,
                name: plan.name,
                type: plan.type,
                credits: getPrimaryPlanCreditCount(plan),
                durationDays: plan.durationDays,
                limits: plan.limits,
                price: plan.price,
                currency: plan.currency || 'INR'
            },
            paymentGateway: isMock ? 'mock' : 'razorpay',
            gatewayOrderId: rzpOrder.id,
            amount: plan.price,
            currency: plan.currency || 'INR',
            status: 'INITIATED',
            applied: false
        });

        logBusiness('order_created', {
            phase: isZeroCost ? 'zero_cost_auto_fulfilled' : 'created',
            userId: user._id.toString(),
            transactionId: transaction._id.toString(),
            gatewayOrderId: rzpOrder.id,
            planId: plan._id.toString(),
            amount: plan.price
        });

        if (isZeroCost) {
            await processSuccessfulPayment({
                source: 'webhook',
                event: 'order.paid',
                gatewayOrderId: rzpOrder.id,
                gatewayAmountPaise: 0,
                gatewayCurrency: plan.currency || 'INR'
            });
        }

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: {
                orderId: rzpOrder.id,
                transactionId: transaction._id,
                amount: plan.price,
                status: isZeroCost ? 'SUCCESS' : 'INITIATED',
                currency: plan.currency || 'INR',
                keyId: razorpayConfig.keyId,
                userName: user.name || 'User',
                userEmail: user.email || '',
                userPhone: user.mobile || ''
            }
        }));

    } catch (error: unknown) {
        const errDetail = formatErrorDetails(error);
        logger.error('[Payment Order Error]', {
            detail: errDetail,
            planId: req.body?.planId,
            userId: req.user ? (req.user as { _id?: unknown })._id : undefined
        });
        const errorMessage = env.NODE_ENV === 'development' && errDetail
            ? `Failed to initiate payment: ${errDetail}`
            : 'Failed to initiate payment';
        sendErrorResponse(req, res, 500, errorMessage);
    }
};

