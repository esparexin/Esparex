import { Schema, Model, Document, Types } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface IAdMetrics extends Document {
    adId: Types.ObjectId;
    views: {
        total: number;
        unique: number;
        lastViewedAt?: Date;
    };
    favorites: number;
    chats: number;
    impressions: number;
    updatedAt: Date;
}

const AdMetricsSchema: Schema = new Schema({
    adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true, unique: true },
    views: {
        total: { type: Number, default: 0 },
        unique: { type: Number, default: 0 },
        lastViewedAt: { type: Date }
    },
    favorites: { type: Number, default: 0 },
    chats: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Optimized for high-frequency updates and lookups by adId
AdMetricsSchema.index({ adId: 1 }, { unique: true, name: 'idx_metrics_adId_unique' });

// Compound index for engagement reports
AdMetricsSchema.index({ views: -1, favorites: -1 }, { name: 'idx_metrics_engagement' });

export const AdMetrics: Model<IAdMetrics> = (getUserConnection().models.AdMetrics as Model<IAdMetrics> | undefined) || getUserConnection().model<IAdMetrics>('AdMetrics', AdMetricsSchema);

export default AdMetrics;
