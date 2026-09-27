import Business from '../models/Business';
import { emailService } from '../domains/notifications/application/EmailService';
import { renderBusinessExpiryAlertEmail } from '../domains/notifications/templates/EmailLayout';
import { jobRunner } from '../utils/jobRunner';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';
import { getFrontendAppUrl } from '../utils/appUrl';

export const runNotifyBusinessJob = async () => {
    await runWithDistributedJobLock(
        'notify_business_expiry',
        { ttlMs: 2 * 60 * 60 * 1000, failOpen: false },
        async () => {
            await jobRunner('NotifyBusinessExpiry', async () => {
                logger.info('Running Business Expiry Notification Job');

                const daysToNotify = [7, 3, 1];
                let totalNotified = 0;

                for (const days of daysToNotify) {
                    // Calculate the target date range (start of day to end of day)
                    const targetDateStart = new Date();
                    targetDateStart.setDate(targetDateStart.getDate() + days);
                    targetDateStart.setHours(0, 0, 0, 0);

                    const targetDateEnd = new Date(targetDateStart);
                    targetDateEnd.setHours(23, 59, 59, 999);

                    const expiringBusinesses = await Business.find({
                        status: 'live',
                        expiresAt: {
                            $gte: targetDateStart,
                            $lte: targetDateEnd
                        }
                    });

                    logger.info('Found businesses expiring soon', { count: expiringBusinesses.length, daysUntilExpiry: days });

                    for (const business of expiringBusinesses) {
                        if (!business.email) continue;

                        const expiryDateStr = new Date(business.expiresAt!).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        });
                        const daysText = days === 1 ? '1 Day' : `${days} Days`;
                        const subject = `Action Required: Your Esparex Business Plan Expires in ${daysText}`;
                        const html = renderBusinessExpiryAlertEmail({
                            businessName: business.name,
                            expiryDate: expiryDateStr,
                            daysLeft: days,
                            renewUrl: `${getFrontendAppUrl()}/account/business`,
                        });

                        await emailService.sendEmail(business.email, subject, html);
                        totalNotified++;
                    }
                }
                return { totalNotified, strategies: daysToNotify };
            });
        }
    );
};
