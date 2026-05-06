import { Queue } from 'bullmq';
import { redisConnection, shouldDisableQueueConnection } from './redisConnection';
import { withQueueDefaults } from './queueDefaults';

const sharedJobOptions = withQueueDefaults();

const createNoopQueue = <T>() => ({
    add: async () => null,
    close: async () => undefined,
    on: () => undefined,
    getJobCounts: async () => ({
        waiting: 0,
        active: 0,
        delayed: 0,
        failed: 0,
        completed: 0,
    }),
} as unknown as Queue<T>);

export const adQueue = shouldDisableQueueConnection
    ? createNoopQueue()
    : new Queue('ad-events', {
        connection: redisConnection,
        defaultJobOptions: sharedJobOptions
    });

export const notificationDeliveryQueue = shouldDisableQueueConnection
    ? createNoopQueue()
    : new Queue('notification.delivery.queue', {
        connection: redisConnection,
        defaultJobOptions: sharedJobOptions
    });

export const notificationMatchQueue = shouldDisableQueueConnection
    ? createNoopQueue()
    : new Queue('notification.match.queue', {
        connection: redisConnection,
        defaultJobOptions: sharedJobOptions
    });
