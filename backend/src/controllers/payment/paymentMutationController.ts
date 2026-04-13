import logger from '../../utils/logger';
import { env } from '../../config/env';
import { Request, Response } from 'express';
import crypto from 'crypto';
import {
    checkTransactionVelocity,
    findPendingTransaction,
    createPaymentTransaction,
} from '../../services/PaymentProcessingService';
import Plan from '../../models/Plan';
import User from '../../models/User';
import { respond } from '../../utils/respond';
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from '../../utils/errorResponse';
import { buildMockOrder, getRazorpayClient, getRazorpayRuntimeConfig } from './shared';
import { logBusiness, logSecurity } from '../../utils/logger';
import { getPrimaryPlanCreditCount } from '@shared/utils/planEntitlements';

/**
 * 1. CREATE ORDER
 * Initiates valid transaction sequence using Razorpay SDK.
 */
export const createPaymentOrder = async (req: Request, res: Response) => {
    try {
        if (!req.user) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const { planId } = req.body;

        if (!planId) return sendErrorResponse(req, res, 400, 'Plan ID required');

        const user = await User.findById(req.user._id);
        if (!user) return sendErrorResponse(req, res, 404, 'User not found');

        const plan = await Plan.findById(planId);
        if (!plan || !plan.active) return sendErrorResponse(req, res, 404, 'Invalid or inactive plan');
        const razorpayConfig = await getRazorpayRuntimeConfig();
        if (!razorpayConfig.enabled) {
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

        const isMock = env.NODE_ENV === 'development'
            && (razorpayConfig.keyId === 'rzp_test_placeholder' || req.headers['x-mock-payment'] === 'true');

        let rzpOrder;
        if (isMock) {
            rzpOrder = buildMockOrder(plan.price * 100, plan.currency || 'INR');
        } else {
            const razorpay = await getRazorpayClient();
            rzpOrder = await razorpay.orders.create({
                amount: plan.price * 100,
                currency: plan.currency || 'INR',
                receipt: `rcpt_${crypto.randomBytes(12).toString('hex')}`
            });
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
            phase: 'created',
            userId: user._id.toString(),
            transactionId: transaction._id.toString(),
            gatewayOrderId: rzpOrder.id,
            planId: plan._id.toString(),
            amount: plan.price
        });

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            data: {
                orderId: rzpOrder.id,
                transactionId: transaction._id,
                amount: plan.price,
                currency: plan.currency || 'INR',
                keyId: razorpayConfig.keyId,
                userName: user.name || 'User',
                userEmail: user.email || '',
                userPhone: user.mobile || ''
            }
        }));

    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Payment Order Error:', err);
        sendErrorResponse(req, res, 500, 'Failed to initiate payment');
    }
};
