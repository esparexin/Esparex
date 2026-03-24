import mongoose, { Schema, Model, type Document } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface IAdAnalytics extends Document {
    adId: mongoose.Types.ObjectId;
    views: number;
    favorites: number;
    score: number;
    createdAt: Date;
    updatedAt: Date;
}

const AdAnalyticsSchema = new Schema<IAdAnalytics>(
    {
        adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true },
        views: { type: Number, default: 0, min: 0 },
        favorites: { type: Number, default: 0, min: 0 },
        score: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

AdAnalyticsSchema.index({ adId: 1 }, { name: 'idx_adanalytics_adId_unique_idx', unique: true });
AdAnalyticsSchema.index({ score: -1 }, { name: 'idx_adanalytics_score_idx' });

const connection = getUserConnection();
const AdAnalytics: Model<IAdAnalytics> =
    (connection.models.AdAnalytics as Model<IAdAnalytics>) ||
    connection.model<IAdAnalytics>('AdAnalytics', AdAnalyticsSchema);

export default AdAnalytics;

