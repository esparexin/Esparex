import mongoose, { Schema, Model, type Document } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface ISellerReputation extends Document {
    userId: mongoose.Types.ObjectId;
    adsPosted: number;
    responseRate: number;
    averageResponseTime: number;
    score: number;
    createdAt: Date;
    updatedAt: Date;
}

const SellerReputationSchema = new Schema<ISellerReputation>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        adsPosted: { type: Number, default: 0, min: 0 },
        responseRate: { type: Number, default: 0, min: 0, max: 1 },
        averageResponseTime: { type: Number, default: 0, min: 0 }, // milliseconds
        score: { type: Number, default: 0, min: 0, max: 5 },
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

SellerReputationSchema.index({ userId: 1 }, { name: 'idx_sellerreputation_userId_unique_idx', unique: true });
SellerReputationSchema.index({ score: -1 }, { name: 'idx_sellerreputation_score_idx' });

const connection = getUserConnection();
const SellerReputation: Model<ISellerReputation> =
    (connection.models.SellerReputation as Model<ISellerReputation>) ||
    connection.model<ISellerReputation>('SellerReputation', SellerReputationSchema);

export default SellerReputation;

