import mongoose, { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface IPhoneRevealLog extends Document {
    buyerId: mongoose.Types.ObjectId;
    sellerId: mongoose.Types.ObjectId;
    entityId: mongoose.Types.ObjectId;
    entityType: 'ad' | 'service' | 'spare_part';
    ipAddress?: string;
    device?: string;
    revealedAt: Date;
}

const PhoneRevealLogSchema: Schema = new Schema({
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityType: { type: String, enum: ['ad', 'service', 'spare_part'], required: true },
    ipAddress: { type: String },
    device: { type: String },
    revealedAt: { type: Date, default: Date.now, required: true }
}, {
    timestamps: false // We use revealedAt as the primary timestamp
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

PhoneRevealLogSchema.index({ buyerId: 1 }, { name: 'idx_phonereveal_buyerId_idx' });
PhoneRevealLogSchema.index({ sellerId: 1 }, { name: 'idx_phonereveal_sellerId_idx' });
PhoneRevealLogSchema.index({ entityId: 1 }, { name: 'idx_phonereveal_entityId_idx' });
PhoneRevealLogSchema.index({ revealedAt: -1 }, { name: 'idx_phonereveal_revealedAt_idx' });

const PhoneRevealLog: Model<IPhoneRevealLog> =
    getUserConnection().models.PhoneRevealLog ||
    getUserConnection().model<IPhoneRevealLog>('PhoneRevealLog', PhoneRevealLogSchema, 'phone_reveal_logs');

export default PhoneRevealLog;
