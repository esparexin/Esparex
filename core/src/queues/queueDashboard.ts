import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { adQueue } from './adQueue';

export const setupQueueDashboard = () => {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/api/v1/admin/queues');

    createBullBoard({
        queues: [new BullMQAdapter(adQueue)],
        serverAdapter,
    });

    return serverAdapter.getRouter() as import('express').Router;
};
