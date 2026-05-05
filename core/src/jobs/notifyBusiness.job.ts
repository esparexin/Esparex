import Business from '../models/Business';
import { emailService } from '../services/EmailService';
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

                        const subject = `Action Required: Your Esparex Business Plan Expires in ${days} Day${days > 1 ? 's' : ''}`;
                        const html = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Business Plan Expiration Alert</h2>
                            <p>Hello <strong>${business.name}</strong>,</p>
                            <p>This is a reminder that your Esparex Business Subscription will expire on <strong>${new Date(business.expiresAt!).toLocaleDateString()}</strong>.</p>
                            <p>To ensure your business profile remains active and visible to customers, please renew your plan before it expires.</p>
                            <p>If your plan expires, your profile will be automatically suspended.</p>
                            <br/>
                            <a href="${getFrontendAppUrl()}/my-business" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renew Now</a>
                        </div>
                    `;

                        await emailService.sendEmail(business.email, subject, html);
                        totalNotified++;
                    }
                }
                return { totalNotified, strategies: daysToNotify };
            });
        }
    );
};
