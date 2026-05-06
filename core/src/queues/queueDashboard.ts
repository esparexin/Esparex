import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { adQueue, notificationDeliveryQueue, notificationMatchQueue } from './adQueue';
import paymentQueue from './paymentQueue';
import { imageOptimizationQueue } from './imageQueue';
import schedulerQueue from './schedulerQueue';
import { deadLetterQueue } from './deadLetterQueue';

export const setupQueueDashboard = () => {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/api/v1/admin/queues');

    createBullBoard({
        queues: [
            new BullMQAdapter(adQueue),
            new BullMQAdapter(notificationDeliveryQueue),
            new BullMQAdapter(notificationMatchQueue),
            new BullMQAdapter(paymentQueue),
            new BullMQAdapter(imageOptimizationQueue),
            ...(schedulerQueue ? [new BullMQAdapter(schedulerQueue)] : []),
            new BullMQAdapter(deadLetterQueue),
        ],
        serverAdapter,
    });

    return serverAdapter.getRouter() as import('express').Router;
};
