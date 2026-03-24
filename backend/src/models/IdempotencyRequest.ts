import { Schema, Document, Types, Model } from 'mongoose';
import { getUserConnection } from '../config/db';

export type IdempotencyStatus = 'processing' | 'completed';

export interface IIdempotencyRequest extends Document {
    userId: Types.ObjectId | string;
    scope: string;
    key: string;
    requestHash: string;
    status: IdempotencyStatus;
    responseStatus?: number;
    responseBody?: unknown;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const IdempotencyRequestSchema = new Schema<IIdempotencyRequest>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        scope: { type: String, required: true },
        key: { type: String, required: true },
        requestHash: { type: String, required: true },
        status: { type: String, enum: ['processing', 'completed'], required: true, default: 'processing' },
        responseStatus: { type: Number },
        responseBody: { type: Schema.Types.Mixed },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

IdempotencyRequestSchema.index({ userId: 1, scope: 1, key: 1 }, { name: 'idx_idempotencyrequest_user_scope_key_unique_idx', unique: true });
IdempotencyRequestSchema.index({ expiresAt: 1 }, { name: 'idx_idempotencyrequest_expiresAt_ttl_idx', expireAfterSeconds: 0 });

const connection = getUserConnection();
const IdempotencyRequest: Model<IIdempotencyRequest> =
    (connection.models.IdempotencyRequest as Model<IIdempotencyRequest>) ||
    connection.model<IIdempotencyRequest>('IdempotencyRequest', IdempotencyRequestSchema);

export default IdempotencyRequest;
