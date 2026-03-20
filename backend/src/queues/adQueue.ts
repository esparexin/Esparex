import { Queue } from 'bullmq';
import { redisConnection } from './redisConnection';

const sharedJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential' as const,
        delay: 2000 // 2s → 4s → 8s
    },
    removeOnComplete: 200,
    removeOnFail: 500
};

export const adQueue = new Queue('ad-events', {
    connection: redisConnection,
    defaultJobOptions: sharedJobOptions
});

export const notificationDeliveryQueue = new Queue('notification.delivery.queue', {
    connection: redisConnection,
    defaultJobOptions: sharedJobOptions
});

export const notificationMatchQueue = new Queue('notification.match.queue', {
    connection: redisConnection,
    defaultJobOptions: sharedJobOptions
});
