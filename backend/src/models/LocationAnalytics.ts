import { Schema, Model, Types } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface ILocationAnalytics {
    locationId: Types.ObjectId;
    adsCount: number;
    searchCount: number;
    viewCount: number;
    popularityScore: number;
    isHotZone: boolean;
    lastUpdated: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const LocationAnalyticsSchema = new Schema<ILocationAnalytics>(
    {
        locationId: {
            type: Schema.Types.ObjectId,
            ref: 'Location',
            required: true
        },
        adsCount: { type: Number, default: 0 },
        searchCount: { type: Number, default: 0 },
        viewCount: { type: Number, default: 0 },
        popularityScore: { type: Number, default: 0 },
        isHotZone: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

LocationAnalyticsSchema.index({ locationId: 1 }, { name: 'locanalytics_locationId_unique_idx', unique: true });
LocationAnalyticsSchema.index({ isHotZone: 1 }, { name: 'locanalytics_isHotZone_idx' });
LocationAnalyticsSchema.index({ popularityScore: -1 }, { name: 'locanalytics_popularityScore_idx' });
LocationAnalyticsSchema.index({ isHotZone: 1, popularityScore: -1 }, { name: 'locanalytics_hotzone_popularity_idx' });
LocationAnalyticsSchema.index({ popularityScore: -1, lastUpdated: -1 }, { name: 'locanalytics_popularity_freshness_idx' });

const LocationAnalytics: Model<ILocationAnalytics> =
    getUserConnection().models.LocationAnalytics ||
    getUserConnection().model<ILocationAnalytics>('LocationAnalytics', LocationAnalyticsSchema);

export default LocationAnalytics;
