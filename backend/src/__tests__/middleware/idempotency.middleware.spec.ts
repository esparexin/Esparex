import type { Request, Response } from 'express';
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

type MockResponse = Response & {
    payload?: unknown;
};

const mockedIdempotencyModel = IdempotencyRequest as unknown as {
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    updateOne: jest.Mock;
};

const stableStringify = (value: unknown): string => {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
};

const payloadHash = (body: unknown): string => {
    const crypto = require('crypto') as typeof import('crypto');
    return crypto.createHash('sha256').update(stableStringify(body || {})).digest('hex');
};

const buildRequestHash = (body: unknown, userId: string): string => {
    const bodyHash = payloadHash(body);
    return payloadHash({
        method: 'POST',
        route: 'POST:/api/v1/ads',
        userId,
        bodyHash,
    });
};

const makeReq = (overrides: Partial<Request> = {}): Request => {
    const userId = new mongoose.Types.ObjectId();
    const headers: Record<string, string> = {};
    return {
        method: 'POST',
        body: { title: 'iPhone 13' },
        user: { _id: userId } as Request['user'],
        requestId: 'req-test-1',
        originalUrl: '/api/v1/ads',
        path: '/api/v1/ads',
        header: (name: string) => headers[name.toLowerCase()],
        ...overrides,
    } as Request;
};

const makeRes = (): MockResponse => {
    const res = {} as MockResponse;
    res.statusCode = 200;
    res.status = jest.fn((code: number) => {
        res.statusCode = code;
        return res;
    }) as unknown as Response['status'];
    res.json = jest.fn((payload: unknown) => {
        res.payload = payload;
        return res;
    }) as unknown as Response['json'];
    return res;
};

describe('enforceCreateAdIdempotency', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedIdempotencyModel.updateOne.mockResolvedValue({ acknowledged: true });
    });

    it('rejects invalid UUID idempotency keys', async () => {
        const req = makeReq({
            header: (name: string) => (name.toLowerCase() === 'idempotency-key' ? 'not-a-uuid' : undefined),
        });
        const res = makeRes();
        const next = jest.fn();

        await enforceCreateAdIdempotency(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res.payload).toMatchObject({
            code: 'INVALID_IDEMPOTENCY_KEY',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 409 only when same key is reused with a different payload hash', async () => {
        const req = makeReq({
            body: { title: 'Payload A' },
            header: (name: string) =>
                name.toLowerCase() === 'idempotency-key'
                    ? '37ecaf4d-f5cb-4ea4-a0f5-77fca57acff1'
                    : undefined,
        });
        const res = makeRes();
        const next = jest.fn();

        mockedIdempotencyModel.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                requestHash: 'different-hash',
                status: 'processing',
                updatedAt: new Date(),
            }),
        });

        await enforceCreateAdIdempotency(req, res, next);

        expect(res.statusCode).toBe(409);
        expect(res.payload).toMatchObject({
            code: 'IDEMPOTENCY_KEY_REUSED',
            conflictType: 'IDEMPOTENCY',
            idempotencyKey: '37ecaf4d-f5cb-4ea4-a0f5-77fca57acff1',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns non-conflict in-progress response for same key + same payload while lock is active', async () => {
        const idempotencyKey = '5c6e09cc-42d6-47ad-b270-c76d14fb5f0d';
        const req = makeReq({
            body: { title: 'Payload A' },
            header: (name: string) => (name.toLowerCase() === 'idempotency-key' ? idempotencyKey : undefined),
        });
        const userId = ((req.user as { _id: mongoose.Types.ObjectId })._id).toString();
        const res = makeRes();
        const next = jest.fn();

        mockedIdempotencyModel.findOne.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                requestHash: buildRequestHash(req.body, userId),
                status: 'processing',
                updatedAt: new Date(),
            }),
        });

        await enforceCreateAdIdempotency(req, res, next);

        expect(res.statusCode).toBe(429);
        expect(res.payload).toMatchObject({
            code: 'IDEMPOTENCY_IN_PROGRESS',
            conflictType: 'IDEMPOTENCY',
            idempotencyKey,
        });
        expect(next).not.toHaveBeenCalled();
    });
});
