import { jobRunner } from '../utils/jobRunner';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';
import { expireBusinesses } from '../services/business/BusinessLifecycleService';
import { cascadeExpireBusinessListings } from '../services/AdminBusinessService';
import { dispatchTemplatedNotification } from '../domains/notifications/application/NotificationService';
import { renderBusinessExpiredEmail } from '../domains/notifications/templates/EmailLayout';
import { getFrontendAppUrl } from '../utils/appUrl';
import { ACTOR_TYPE } from '@esparex/contracts';
import { BUSINESS_STATUS } from '@esparex/contracts';

export const runExpireBusinessesJob = async () => {
    await runWithDistributedJobLock(
        'expire_businesses_job',
        { ttlMs: 60 * 60 * 1000, failOpen: false },
        async () => {
            await jobRunner('ExpireBusinesses', async () => {
                logger.info('Running Automated Business Expiration Job');

                const expiredBusinesses = await expireBusinesses();

                if (expiredBusinesses.length > 0) {
                    logger.info(`Successfully expired ${expiredBusinesses.length} businesses.`);

                    const actor = { type: ACTOR_TYPE.SYSTEM, id: 'cron_expireBusinesses' };
                    const renewUrl = `${getFrontendAppUrl()}/account/business`;

                    for (const biz of expiredBusinesses) {
                        try {
                            // 1. Cascade expire their listings (which stops active promotions by changing status)
                            const cascadedCount = await cascadeExpireBusinessListings(
                                biz._id,
                                actor,
                                'Automatic expiration: Business subscription ended'
                            );
                            
                            logger.info('Cascaded expiry to listings', { businessId: biz._id, count: cascadedCount });

                            // 2. Render canonical email template
                            const businessEmail = typeof biz.email === 'string' && biz.email.includes('@') ? biz.email : undefined;
                            const emailHtml = renderBusinessExpiredEmail({
                                businessName: biz.name,
                                renewUrl,
                            });

                            // 3. Dispatch notification with email channel
                            await dispatchTemplatedNotification(
                                biz.userId.toString(),
                                'BUSINESS_STATUS',
                                'BUSINESS_EXPIRED',
                                { name: biz.name },
                                {
                                    businessId: biz._id.toString(),
                                    status: BUSINESS_STATUS.EXPIRED,
                                    channels: ['in-app', 'push', 'email'],
                                    email: businessEmail,
                                    emailHtml,
                                    emailSubject: 'Your Business Subscription Has Expired — Esparex',
                                }
                            );
                        } catch (err) {
                            logger.error('Error handling secondary effects for expired business', {
                                businessId: biz._id,
                                error: err instanceof Error ? err.message : String(err)
                            });
                        }
                    }
                }

                return { expiredCount: expiredBusinesses.length };
            });
        }
    );
};

