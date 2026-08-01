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
        logger.info(`[PaymentEventListener] Processing payment.completed for tx ${payload.transactionId}`, {
            userId: payload.userId,
            planType: payload.planType,
            amount: payload.amount
        });

        try {
            // 1. Business Plan Upgrade Hook
            if (payload.planType === 'business' || payload.planType?.toUpperCase() === 'BUSINESS_PLAN') {
                const durationDays = 365;
                if (payload.planId) {
                    await upgradePlan(payload.userId, payload.planId, durationDays);
                    logger.info(`[PaymentEventListener] Business plan upgraded for user ${payload.userId}`);
                }
            }
        } catch (error) {
            logger.error(`[PaymentEventListener] Failed to process payment side-effects for tx ${payload.transactionId}`, {
                error: error instanceof Error ? error.message : String(error),
                payload
            });
        }
    }, 'Payment_Completed_SideEffects');

    logger.info('[PaymentEventListener] Registered successfully.');
};
