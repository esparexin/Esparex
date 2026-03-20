import ScheduledNotification from '../models/ScheduledNotification';
import NotificationLog from '../models/NotificationLog';
import User from '../models/User';
import { NotificationIntent } from '../domain/NotificationIntent';
import { NotificationDispatcher } from './notification/NotificationDispatcher';
import logger from '../utils/logger';
import { runWithDistributedJobLock } from '../utils/distributedJobLock';
import type { Types } from 'mongoose';

interface ScheduledJobLike {
    _id: unknown;
    title: string;
    body: string;
    targetType: 'topic' | 'all' | 'users';
    targetValue?: string;
    userIds?: Array<string | Types.ObjectId>;
    sentBy?: unknown;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    save: () => Promise<unknown>;
}

export const runScheduledNotificationPoll = async () => {
    await runWithDistributedJobLock(
        'notification_scheduler_poll',
        { ttlMs: 4 * 60 * 1000, failOpen: false },
        async () => {
            try {
                const now = new Date();
                const pendingJobs = await ScheduledNotification.find({
                    status: 'pending',
                    sendAt: { $lte: now }
                });

                if (pendingJobs.length > 0) {
                    logger.info('Processing scheduled notifications', { count: pendingJobs.length });

                    for (const job of pendingJobs) {
                        await processJob(job);
                    }
                }
            } catch (error) {
                logger.error('Scheduler error', { error: error instanceof Error ? error.message : String(error) });
            }
        }
    );
};

const processJob = async (job: ScheduledJobLike) => {
    try {
        let successCount = 0;
        let failureCount = 0;
        const messagingPayload: Record<string, unknown> = {
            notification: { title: job.title, body: job.body },
            data: { type: 'admin_broadcast' }
        };

        const jobIdStr = String(job._id);

        // 1. Topic / Broadcast
        if (job.targetType === 'topic' || job.targetType === 'all') {
            const cursor = User.find({}).select('_id').cursor();
            let batch: NotificationIntent[] = [];
            const BATCH_SIZE = 500;
            
            for await (const u of cursor) {
                batch.push(NotificationIntent.fromSchedulerJob(
                    u._id.toString(), jobIdStr, job.title, job.body, job.targetType
                ));
                
                if (batch.length >= BATCH_SIZE) {
                    await NotificationDispatcher.bulkDispatch(batch);
                    successCount += batch.length;
                    batch = [];
                }
            }
            if (batch.length > 0) {
                await NotificationDispatcher.bulkDispatch(batch);
                successCount += batch.length;
            }
        }
        // 2. Specific Users
        else if (job.targetType === 'users' && job.userIds && job.userIds.length > 0) {
            const intents = job.userIds.map(uid => NotificationIntent.fromSchedulerJob(
                String(uid), jobIdStr, job.title, job.body, job.targetType
            ));
            
            await NotificationDispatcher.bulkDispatch(intents);
            successCount += intents.length;
        }

        // Update Job Status
        job.status = 'sent';
        await job.save();

        // Create Log (for history consistency)
        await NotificationLog.create({
            title: job.title,
            body: job.body,
            type: 'admin_push_scheduled',
            targetType: job.targetType,
            targetValue: job.targetValue,
            userIds: job.userIds,
            sentBy: job.sentBy,
            successCount,
            failureCount,
            status: 'sent',
            createdAt: new Date() // Log time is actual send time
        });

    } catch (error) {
        logger.error('Job processing failed', { jobId: job._id, error: error instanceof Error ? error.message : String(error) });
        job.status = 'failed';
        await job.save();
    }
};
