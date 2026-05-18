/**
 * NotificationQueue & Worker — Unit Tests
 */

import { Worker } from 'bullmq';
import { NotificationDispatcher } from '../../services/notification/NotificationDispatcher';
import { NotificationIntent } from '../../domain/NotificationIntent';
import { enqueueDeadLetter } from '../../queues/deadLetterQueue';
import { notificationDeliveryProcessor } from '../../workers/notificationDeliveryWorker';

jest.mock('bullmq');
jest.mock('../../services/notification/NotificationDispatcher');
jest.mock('../../queues/deadLetterQueue');
jest.mock('../../utils/logger');
jest.mock('../../utils/reliabilityContext');
jest.mock('../../config/sentry');
jest.mock('../../queues/redisConnection', () => ({
    shouldDisableQueueConnection: false,
    redisConnection: {},
    isQueueConnectionAvailable: () => true
}));

const mockedDispatcher = NotificationDispatcher as jest.Mocked<typeof NotificationDispatcher>;
const mockedEnqueueDeadLetter = enqueueDeadLetter as jest.Mock;

describe('NotificationDeliveryWorker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should process a valid notification job via the processor', async () => {
        const job = {
            id: 'job_123',
            name: 'user_notification',
            data: {
                intent: {
                    userId: 'user-1',
                    type: 'SYSTEM',
                    entityRef: { domain: 'test', id: '123' },
                    message: { title: 'T', body: 'B' }
                },
                options: {}
            }
        };

        mockedDispatcher.executeDispatch.mockResolvedValue({ success: true });

        await notificationDeliveryProcessor(job);

        expect(mockedDispatcher.executeDispatch).toHaveBeenCalledWith(
            expect.any(NotificationIntent),
            expect.any(Object)
        );
    });

    it('should throw error on dispatch failure to trigger BullMQ retry', async () => {
        const job = {
            id: 'job_123',
            name: 'user_notification',
            data: {
                intent: { userId: 'u1', type: 'SYSTEM', entityRef: { domain: 'd', id: 'i' }, message: { title: 'T', body: 'B' } },
                options: {}
            }
        };

        mockedDispatcher.executeDispatch.mockRejectedValue(new Error('FCM_ERROR'));

        await expect(notificationDeliveryProcessor(job)).rejects.toThrow('FCM_ERROR');
    });

    it('should enqueue to dead letter queue on permanent failure', () => {
        // We use isolateModules to ensure the worker file is re-evaluated 
        // with our mocks and captures the constructor call.
        jest.isolateModules(() => {
            const { Worker: IsolatedWorker } = require('bullmq');
            const IsolatedWorkerMock = IsolatedWorker as unknown as jest.Mock;
            
            const mockWorkerInstance = {
                on: jest.fn(),
                close: jest.fn(),
            };
            IsolatedWorkerMock.mockReturnValue(mockWorkerInstance);

            require('../../workers/notificationDeliveryWorker');

            const onFailedCallback = mockWorkerInstance.on.mock.calls.find(
                (call: any) => call[0] === 'failed'
            )?.[1];

            expect(onFailedCallback).toBeDefined();

            const job = { id: 'job_123', attemptsMade: 3, opts: { attempts: 3 }, message: 'failed' };
            const error = new Error('Permanent failure');

            onFailedCallback(job, error);

            expect(mockedEnqueueDeadLetter).toHaveBeenCalledWith(
                'notification.delivery.queue',
                job,
                error
            );
        });
    });
});
