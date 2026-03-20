import mongoose, { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';
import { AD_STATUS_VALUES } from '../../../shared/enums/adStatus';

export interface IAdStatusHistory extends Document {
    adId: mongoose.Types.ObjectId;
    fromStatus: (typeof AD_STATUS_VALUES)[number];
    toStatus: (typeof AD_STATUS_VALUES)[number];
    actorType: 'user' | 'admin' | 'system';
    actorId?: mongoose.Types.ObjectId;
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AdStatusHistorySchema = new Schema<IAdStatusHistory>(
    {
        adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true },
        fromStatus: { type: String, enum: AD_STATUS_VALUES, required: true },
        toStatus: { type: String, enum: AD_STATUS_VALUES, required: true },
        actorType: { type: String, enum: ['user', 'admin', 'system'], required: true },
        actorId: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, trim: true }
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

AdStatusHistorySchema.index({ adId: 1 }, { name: 'adstatushistory_adId_idx' });
AdStatusHistorySchema.index({ actorType: 1 }, { name: 'adstatushistory_actorType_idx' });
AdStatusHistorySchema.index({ adId: 1, createdAt: -1 }, { name: 'adstatushistory_ad_freshness_idx' });
AdStatusHistorySchema.index({ actorType: 1, createdAt: -1 }, { name: 'adstatushistory_actor_freshness_idx' });

const connection = getUserConnection();
const AdStatusHistory: Model<IAdStatusHistory> =
    (connection.models.AdStatusHistory as Model<IAdStatusHistory>) ||
    connection.model<IAdStatusHistory>('AdStatusHistory', AdStatusHistorySchema);

export default AdStatusHistory;
