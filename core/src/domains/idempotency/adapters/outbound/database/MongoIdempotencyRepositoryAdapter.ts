/**
 * MongoIdempotencyRepositoryAdapter — Phase 3b (DECISION-GATE §5, areas/11 P-02).
 *
 * MongoDB implementation of IdempotencyRepositoryPort. This adapter layer is
 * the only place allowed to touch the IdempotencyRequest Mongoose model;
 * backend middleware goes through the port.
 */

import IdempotencyRequest from '../../../../../models/IdempotencyRequest';
import {
    IdempotencyRepositoryPort,
    type IdempotencyRecordData,
    type MarkProcessingInput
} from '../../../ports/IdempotencyRepositoryPort';

export class MongoIdempotencyRepositoryAdapter implements IdempotencyRepositoryPort {
    public async findRequest(userId: string, scope: string, key: string): Promise<IdempotencyRecordData | null> {
        return await IdempotencyRequest.findOne({ userId, scope, key }).lean<IdempotencyRecordData | null>();
    }

    public async markProcessing(input: MarkProcessingInput): Promise<IdempotencyRecordData | null> {
        const { userId, scope, key, requestHash, expiresAt } = input;
        return await IdempotencyRequest.findOneAndUpdate(
            { userId, scope, key },
            {
                $set: {
                    requestHash,
                    status: 'processing',
                    responseStatus: undefined,
                    responseBody: undefined,
                    expiresAt
                },
                $setOnInsert: {
                    userId,
                    scope,
                    key
                }
            },
            { upsert: true, new: true }
        ).lean<IdempotencyRecordData | null>();
    }

    public async markCompleted(recordId: string, responseStatus: number, responseBody: unknown): Promise<void> {
        await IdempotencyRequest.updateOne(
            { _id: recordId },
            {
                $set: {
                    status: 'completed',
                    responseStatus,
                    responseBody
                }
            }
        );
    }
}
