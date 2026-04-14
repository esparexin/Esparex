import { Schema, Model, Types } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface ILocationAnalytics {
    locationId: Types.ObjectId;
    /** Total ads in this location (all statuses) */
    adsCount: number;
    /** Live ads only */
    activeAdsCount: number;
    /** Registered users with this locationId */
    usersCount: number;
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
        activeAdsCount: { type: Number, default: 0 },
        usersCount: { type: Number, default: 0 },
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

LocationAnalyticsSchema.index({ locationId: 1 }, { name: 'idx_locanalytics_locationId_unique_idx', unique: true });
LocationAnalyticsSchema.index({ isHotZone: 1 }, { name: 'idx_locanalytics_isHotZone_idx' });
LocationAnalyticsSchema.index({ popularityScore: -1 }, { name: 'idx_locanalytics_popularityScore_idx' });
LocationAnalyticsSchema.index({ isHotZone: 1, popularityScore: -1 }, { name: 'idx_locanalytics_hotzone_popularity_idx' });
LocationAnalyticsSchema.index({ popularityScore: -1, lastUpdated: -1 }, { name: 'idx_locanalytics_popularity_freshness_idx' });

const modelName = 'LocationAnalytics';
const connection = getUserConnection();
const LocationAnalytics: Model<ILocationAnalytics> =
    (connection.models[modelName] as Model<ILocationAnalytics>) ||
    connection.model<ILocationAnalytics>(modelName, LocationAnalyticsSchema);

export default LocationAnalytics;
