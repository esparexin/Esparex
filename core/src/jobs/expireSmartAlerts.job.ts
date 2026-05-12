import { jobRunner } from '../utils/jobRunner';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';
import { expireSmartAlerts } from '../services/SmartAlertService';
import { dispatchTemplatedNotification } from '../services/NotificationService';

/**
 * Job to scan and deactivate Smart Alerts that have passed their expiresAt date.
 * Runs once a day to retire outdated search criteria and prevent stale matches.
 */
export const runExpireSmartAlertsJob = async () => {
    await runWithDistributedJobLock(
        'expire_smart_alerts_job',
        { ttlMs: 30 * 60 * 1000, failOpen: false },
        async () => {
            await jobRunner('ExpireSmartAlerts', async () => {
                logger.info('Running Automated Smart Alert Expiration Job');

                const expiredAlerts = await expireSmartAlerts();

                if (expiredAlerts.length > 0) {
                    logger.info(`Successfully expired ${expiredAlerts.length} smart alerts.`);

                    for (const alert of expiredAlerts) {
                        try {
                            // Dispatch notification to user
                            await dispatchTemplatedNotification(
                                alert.userId.toString(),
                                'SMART_ALERT',
                                'SMART_ALERT_EXPIRED',
                                { name: alert.name || 'Your search alert' },
                                { 
                                    alertId: alert._id.toString(), 
                                    status: 'expired',
                                    action: 'renew'
                                }
                            );
                        } catch (err) {
                            logger.error('Error sending expiry notification for smart alert', {
                                alertId: alert._id,
                                error: err instanceof Error ? err.message : String(err)
                            });
                        }
                    }
                }

                return { expiredCount: expiredAlerts.length };
            });
        }
    );
};
