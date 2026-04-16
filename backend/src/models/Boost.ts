import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBoost extends Document {
    entityId: mongoose.Types.ObjectId;
    entityType: 'ad' | 'service' | 'part';
    boostType: 'spotlight_hp' | 'spotlight_cat' | 'push_to_top';
    startsAt: Date;
    endsAt: Date;
    transactionId?: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BoostSchema: Schema = new Schema({
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityType: { type: String, enum: ['ad', 'service', 'part'], required: true },
    boostType: {
        type: String,
        enum: ['spotlight_hp', 'spotlight_cat', 'push_to_top'],
        required: true
    },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// TTL Index to automatically mark as inactive or handle cleanup if needed
// However, visibility logic should just check current date vs startsAt/endsAt
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

BoostSchema.index({ entityId: 1 }, { name: 'idx_boost_entityId_idx' });
BoostSchema.index({ startsAt: 1 }, { name: 'idx_boost_startsAt_idx' });
BoostSchema.index({ isActive: 1 }, { name: 'idx_boost_isActive_idx' });
BoostSchema.index({ endsAt: 1 }, { name: 'idx_boost_endsAt_idx', expireAfterSeconds: 0 });
BoostSchema.index({ transactionId: 1 }, { name: 'idx_boost_transactionId_idx' });

import { getUserConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

const Boost: Model<IBoost> = (getUserConnection().models.Boost as Model<IBoost> | undefined) || getUserConnection().model<IBoost>('Boost', BoostSchema);

applyToJSONTransform(BoostSchema);

export default Boost;
