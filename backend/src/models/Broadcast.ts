import { Schema, Document, Model, Types } from 'mongoose';
import { getAdminConnection } from '../config/db';

export type BroadcastType = 'GLOBAL' | 'SEGMENT' | 'USER';

export interface IBroadcast extends Document {
    type: BroadcastType;
    title: string;
    message: string;
    targetUsers: Types.ObjectId[];
    metadata?: Record<string, unknown>;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const BroadcastSchema = new Schema<IBroadcast>({
    type: { type: String, enum: ['GLOBAL', 'SEGMENT', 'USER'], required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    targetUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    metadata: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true }
}, {
    timestamps: true,
    collection: 'broadcasts'
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

BroadcastSchema.index({ type: 1 }, { name: 'idx_broadcast_type_idx' });
BroadcastSchema.index({ createdBy: 1 }, { name: 'idx_broadcast_createdBy_idx' });
BroadcastSchema.index({ type: 1, createdAt: -1 }, { name: 'idx_broadcast_type_freshness_idx' });

BroadcastSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as Record<string, unknown>;
        const rawId = json._id;
        if (typeof rawId === 'string' || (rawId && typeof (rawId as { toString?: () => string }).toString === 'function')) {
            json.id = rawId.toString();
        }
        delete json._id;
        return json;
    }
});

const connection = getAdminConnection();
const Broadcast: Model<IBroadcast> =
    (connection.models.Broadcast as Model<IBroadcast>) ||
    connection.model<IBroadcast>('Broadcast', BroadcastSchema);

export default Broadcast;
