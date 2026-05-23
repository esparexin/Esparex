import { Queue } from 'bullmq';
import { redisConnection, shouldDisableQueueConnection } from './redisConnection';
import { createNoopQueue, withQueueDefaults } from './queueDefaults';

const sharedJobOptions = withQueueDefaults();



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
