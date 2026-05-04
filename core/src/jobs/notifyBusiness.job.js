"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNotifyBusinessJob = void 0;
const Business_1 = __importDefault(require("@core/models/Business"));
const EmailService_1 = require("@core/services/EmailService");
const jobRunner_1 = require("@core/utils/jobRunner");
const logger_1 = __importDefault(require("@core/utils/logger"));
const distributedJobLock_1 = require("@core/utils/distributedJobLock");
const appUrl_1 = require("@core/utils/appUrl");
const runNotifyBusinessJob = async () => {
    await (0, distributedJobLock_1.runWithDistributedJobLock)('notify_business_expiry', { ttlMs: 2 * 60 * 60 * 1000, failOpen: false }, async () => {
        await (0, jobRunner_1.jobRunner)('NotifyBusinessExpiry', async () => {
            logger_1.default.info('Running Business Expiry Notification Job');
            const daysToNotify = [7, 3, 1];
            let totalNotified = 0;
            for (const days of daysToNotify) {
                // Calculate the target date range (start of day to end of day)
                const targetDateStart = new Date();
                targetDateStart.setDate(targetDateStart.getDate() + days);
                targetDateStart.setHours(0, 0, 0, 0);
                const targetDateEnd = new Date(targetDateStart);
                targetDateEnd.setHours(23, 59, 59, 999);
                const expiringBusinesses = await Business_1.default.find({
                    status: 'live',
                    expiresAt: {
                        $gte: targetDateStart,
                        $lte: targetDateEnd
                    }
                });
                logger_1.default.info('Found businesses expiring soon', { count: expiringBusinesses.length, daysUntilExpiry: days });
                for (const business of expiringBusinesses) {
                    if (!business.email)
                        continue;
                    const subject = `Action Required: Your Esparex Business Plan Expires in ${days} Day${days > 1 ? 's' : ''}`;
                    const html = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Business Plan Expiration Alert</h2>
                            <p>Hello <strong>${business.name}</strong>,</p>
                            <p>This is a reminder that your Esparex Business Subscription will expire on <strong>${new Date(business.expiresAt).toLocaleDateString()}</strong>.</p>
                            <p>To ensure your business profile remains active and visible to customers, please renew your plan before it expires.</p>
                            <p>If your plan expires, your profile will be automatically suspended.</p>
                            <br/>
                            <a href="${(0, appUrl_1.getFrontendAppUrl)()}/my-business" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renew Now</a>
                        </div>
                    `;
                    await EmailService_1.emailService.sendEmail(business.email, subject, html);
                    totalNotified++;
                }
            }
            return { totalNotified, strategies: daysToNotify };
        });
    });
};
exports.runNotifyBusinessJob = runNotifyBusinessJob;
//# sourceMappingURL=notifyBusiness.job.js.map