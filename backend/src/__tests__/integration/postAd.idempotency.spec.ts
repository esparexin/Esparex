import express, { Request, Response } from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { enforceCreateAdIdempotency } from '../../middleware/idempotency';
import IdempotencyRequest from '../../models/IdempotencyRequest';

jest.mock('../../models/IdempotencyRequest', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        updateOne: jest.fn(),
    },
}));

type StoredIdempotency = {
    _id: mongoose.Types.ObjectId;
    userId: string;
    scope: string;
    key: string;
    requestHash: string;
    status: 'processing' | 'completed';
    responseStatus?: number;
    responseBody?: unknown;
    updatedAt: Date;
    createdAt: Date;
    expiresAt: Date;
};

const mockedIdempotencyModel = IdempotencyRequest as unknown as {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    updateOne: jest.Mock;
};

describe('POST /api/v1/ads idempotency integration', () => {
    const userId = new mongoose.Types.ObjectId();
    const store = new Map<string, StoredIdempotency>();

    const makeStoreKey = (query: { userId: string; scope: string; key: string }) =>
        `${query.userId}:${query.scope}:${query.key}`;

    beforeEach(() => {
        store.clear();
        jest.clearAllMocks();

        mockedIdempotencyModel.findOne.mockImplementation((query: { userId: string; scope: string; key: string }) => ({
            lean: jest.fn().mockResolvedValue(store.get(makeStoreKey(query)) || null),
        }));

        mockedIdempotencyModel.findOneAndUpdate.mockImplementation(
            (
                query: { userId: string; scope: string; key: string },
                update: { $set: Record<string, unknown>; $setOnInsert: Record<string, unknown> }
            ) => ({
                lean: jest.fn().mockImplementation(async () => {
                    const key = makeStoreKey(query);
                    const existing = store.get(key);
                    const now = new Date();
                    const merged: StoredIdempotency = {
                        _id: existing?._id || new mongoose.Types.ObjectId(),
                        userId: query.userId,
                        scope: query.scope,
                        key: query.key,
                        requestHash: String(update.$set.requestHash),
                        status: 'processing',
                        responseStatus: undefined,
                        responseBody: undefined,
                        createdAt: existing?.createdAt || now,
                        updatedAt: now,
                        expiresAt: new Date(update.$set.expiresAt as string),
                    };
                    store.set(key, merged);
                    return merged;
                }),
            })
        );

        mockedIdempotencyModel.updateOne.mockImplementation(
            async (
                query: { _id: mongoose.Types.ObjectId },
                update: { $set: Record<string, unknown> }
            ) => {
                for (const [key, record] of store.entries()) {
                    if (record._id.toString() === query._id.toString()) {
                        store.set(key, {
                            ...record,
                            status: 'completed',
                            responseStatus: update.$set.responseStatus as number,
                            responseBody: update.$set.responseBody,
                            updatedAt: new Date(),
                        });
                    }
                }
                return { acknowledged: true };
            }
        );
    });

    it('replays same response for duplicate body and blocks key reuse on different body', async () => {
        const app = express();
        app.use(express.json());
        app.use((req: Request, _res: Response, next) => {
            req.user = { _id: userId } as Request['user'];
            next();
        });
        app.post('/api/v1/ads', enforceCreateAdIdempotency, (req: Request, res: Response) => {
            return res.status(201).json({
                success: true,
                data: { id: 'ad-123', title: req.body.title },
            });
        });

        const key = '8ba69444-0188-49df-b4b7-3af2e82eb296';

        const firstResponse = await request(app)
            .post('/api/v1/ads')
            .set('Idempotency-Key', key)
            .send({ title: 'MacBook Pro 16' });
        expect(firstResponse.status).toBe(201);
        expect(firstResponse.body).toMatchObject({
            success: true,
            data: { id: 'ad-123', title: 'MacBook Pro 16' },
        });

        await new Promise((resolve) => setImmediate(resolve));

        const secondResponse = await request(app)
            .post('/api/v1/ads')
            .set('Idempotency-Key', key)
            .send({ title: 'MacBook Pro 16' });
        expect(secondResponse.status).toBe(201);
        expect(secondResponse.body).toEqual(firstResponse.body);

        const conflictResponse = await request(app)
            .post('/api/v1/ads')
            .set('Idempotency-Key', key)
            .send({ title: 'Different payload' });
        expect(conflictResponse.status).toBe(409);
        expect(conflictResponse.body).toMatchObject({
            success: false,
            code: 'IDEMPOTENCY_KEY_REUSED',
            conflictType: 'IDEMPOTENCY',
            idempotencyKey: key,
        });
    });
});
