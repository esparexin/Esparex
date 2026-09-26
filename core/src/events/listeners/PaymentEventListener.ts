import logger from '../../utils/logger';
import { lifecycleEvents } from '../LifecycleEventDispatcher';
import type { PaymentCompletedEvent } from '../LifecycleEventDispatcher';
import { upgradePlan } from '../../services/business/BusinessSubscriptionService';
import User from '../../models/User';
import { emailService } from '../../domains/notifications/application/EmailService';
import { renderPurchaseConfirmationEmail } from '../../domains/notifications/templates/EmailLayout';

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

            // 2. Transactional Purchase Confirmation Email
            if (payload.userId) {
                const user = await User.findById(payload.userId).select('name email').lean();
                if (user && typeof user.email === 'string' && user.email.includes('@')) {
                    const planName = payload.planId || 'Esparex Subscription';
                    const amountStr = `₹${(payload.amount / 100).toLocaleString('en-IN')}`;
                    const formattedDate = new Date().toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    });
                    const confirmHtml = renderPurchaseConfirmationEmail({
                        orderId: payload.gatewayPaymentId || payload.transactionId,
                        planName,
                        amount: amountStr,
                        formattedDate,
                        userName: typeof user.name === 'string' ? user.name : undefined,
                    });
                    await emailService.sendEmail(
                        user.email,
                        `Purchase Confirmation: ${planName}`,
                        confirmHtml
                    );
                    logger.info(`[PaymentEventListener] Sent purchase confirmation email to ${user.email} for tx ${payload.transactionId}`);
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
