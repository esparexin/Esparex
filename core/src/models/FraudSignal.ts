import mongoose, { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface IFraudSignal extends Document {
    userId?: mongoose.Types.ObjectId;
    ip: string;
    deviceFingerprint?: string;
    adId?: mongoose.Types.ObjectId;
    signalType: string;
    score: number;
    createdAt: Date;
}

const FraudSignalSchema = new Schema<IFraudSignal>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    ip: { type: String, required: true },
    deviceFingerprint: { type: String },
    adId: { type: Schema.Types.ObjectId, ref: 'Ad' },
    signalType: { type: String, required: true },
    score: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: '90d' } // Auto-cleanup after 90 days
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

FraudSignalSchema.index({ ip: 1 }, { name: 'idx_fraudsignal_ip_idx' });
FraudSignalSchema.index({ userId: 1 }, { name: 'idx_fraudsignal_userId_idx' });
FraudSignalSchema.index({ deviceFingerprint: 1 }, { name: 'idx_fraudsignal_deviceFingerprint_idx' });
FraudSignalSchema.index({ adId: 1 }, { name: 'idx_fraudsignal_adId_idx' });
FraudSignalSchema.index({ createdAt: 1 }, { name: 'idx_fraudsignal_ttl_idx' }); // Existing expires

const userConnection = getUserConnection();
const FraudSignal: Model<IFraudSignal> =
    (userConnection.models.FraudSignal as Model<IFraudSignal>) ||
    userConnection.model<IFraudSignal>('FraudSignal', FraudSignalSchema);
export default FraudSignal;
