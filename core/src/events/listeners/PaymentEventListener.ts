import logger from '../../utils/logger';
import { lifecycleEvents } from '../LifecycleEventDispatcher';
import type { PaymentCompletedEvent } from '../LifecycleEventDispatcher';
import { upgradePlan } from '../../services/business/BusinessSubscriptionService';

/**
 * 💳 Payment Event Listener
 * 
 * Subscribes to canonical 'payment.completed' domain events to handle post-payment
 * side effects (Business Plan upgrades, entitlement sync, notifications) cleanly 
 * outside MongoDB ACID transaction boundaries.
 */
export const registerPaymentEventListener = () => {
    lifecycleEvents.on('payment.completed', async (payload: PaymentCompletedEvent) => {
        const planTypeNorm = payload.planType?.toLowerCase() || '';

        logger.info(`[PaymentEventListener] Processing payment.completed for tx ${payload.transactionId}`, {
            transactionId: payload.transactionId,
            userId: payload.userId,
            planId: payload.planId,
            planType: payload.planType,
            gatewayOrderId: payload.gatewayOrderId,
            gatewayPaymentId: payload.gatewayPaymentId,
            amount: payload.amount,
            currency: payload.currency,
        });

        try {
            // 1. Business & Subscription Plan Activation Hook
            const isSubscriptionPlan =
                planTypeNorm === 'business' ||
                planTypeNorm === 'business_plan' ||
                planTypeNorm === 'subscription';

            if (isSubscriptionPlan) {
                const durationDays = 365;
                if (payload.planId) {
                    await upgradePlan(payload.userId, payload.planId, durationDays);
                    logger.info(`[PaymentEventListener] Business subscription plan processed cleanly for user ${payload.userId}`, {
                        transactionId: payload.transactionId,
                        userId: payload.userId,
                        planId: payload.planId,
                    });
                }
            }
        } catch (error) {
            logger.error(`[PaymentEventListener] Failed to process payment side-effects for tx ${payload.transactionId}`, {
                transactionId: payload.transactionId,
                userId: payload.userId,
                planId: payload.planId,
                error: error instanceof Error ? error.message : String(error),
                payload,
            });
        }
    }, 'Payment_Completed_SideEffects');

    logger.info('[PaymentEventListener] Registered successfully.');
};
