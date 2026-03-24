import mongoose, { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';
import { ACTOR_TYPE_VALUES } from '../../../shared/enums/actor';

export interface IStatusHistory extends Document {
    domain: 'ad' | 'user' | 'business' | 'service';
    entityId: mongoose.Types.ObjectId;
    fromStatus: string;
    toStatus: string;
    actorType: (typeof ACTOR_TYPE_VALUES)[number];
    actorId?: mongoose.Types.ObjectId;
    reason?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistory>(
    {
        domain: { type: String, enum: ['ad', 'user', 'business', 'service'], required: true },
        entityId: { type: Schema.Types.ObjectId, required: true },
        fromStatus: { type: String, required: true },
        toStatus: { type: String, required: true },
        actorType: { type: String, enum: ACTOR_TYPE_VALUES, required: true },
        actorId: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, trim: true },
        metadata: { type: Schema.Types.Mixed }
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

StatusHistorySchema.index({ domain: 1 }, { name: 'idx_statushistory_domain_idx' });
StatusHistorySchema.index({ entityId: 1 }, { name: 'idx_statushistory_entityId_idx' });
StatusHistorySchema.index({ actorType: 1 }, { name: 'idx_statushistory_actorType_idx' });
StatusHistorySchema.index({ actorId: 1 }, { name: 'idx_statushistory_actorId_idx' });
StatusHistorySchema.index({ entityId: 1, domain: 1, createdAt: -1 }, { name: 'idx_statushistory_entity_domain_freshness_idx' });
StatusHistorySchema.index({ domain: 1, toStatus: 1, createdAt: -1 }, { name: 'idx_statushistory_domain_status_freshness_idx' });
StatusHistorySchema.index({ actorId: 1, createdAt: -1 }, { name: 'idx_statushistory_actor_freshness_idx' });

const connection = getUserConnection();
const StatusHistory: Model<IStatusHistory> =
    (connection.models.StatusHistory as Model<IStatusHistory>) ||
    connection.model<IStatusHistory>('StatusHistory', StatusHistorySchema);

export default StatusHistory;
