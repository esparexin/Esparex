
import { Schema, Model, Types, Document } from "mongoose";
import { getUserConnection } from "../config/db";

export interface ILocationStats extends Document {
    locationId: Types.ObjectId;
    city: string;
    state: string;

    // Core metrics
    adsCount: number;
    usersCount: number;
    activeAdsCount: number;

    // Growth metrics (for analytics)
    lastUpdated: Date;
}

const LocationStatsSchema = new Schema<ILocationStats>(
    {
        locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },

        adsCount: { type: Number, default: 0 },
        usersCount: { type: Number, default: 0 },
        activeAdsCount: { type: Number, default: 0 },

        lastUpdated: { type: Date, default: Date.now }
    },
    {
        timestamps: true
    }
);

// Indexes for sorting/filtering
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

LocationStatsSchema.index({ locationId: 1 }, { name: 'locstats_locationId_unique_idx', unique: true });
LocationStatsSchema.index({ adsCount: -1 }, { name: 'locstats_adsCount_idx' });
LocationStatsSchema.index({ city: 1, state: 1 }, { name: 'locstats_city_state_idx' });

const LocationStats: Model<ILocationStats> =
    getUserConnection().models.LocationStats ||
    getUserConnection().model<ILocationStats>("LocationStats", LocationStatsSchema);

export default LocationStats;
