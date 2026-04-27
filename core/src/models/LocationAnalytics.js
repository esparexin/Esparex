"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const LocationAnalyticsSchema = new mongoose_1.Schema({
    locationId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
LocationAnalyticsSchema.index({ locationId: 1 }, { name: 'idx_locanalytics_locationId_unique_idx', unique: true });
LocationAnalyticsSchema.index({ isHotZone: 1 }, { name: 'idx_locanalytics_isHotZone_idx' });
LocationAnalyticsSchema.index({ popularityScore: -1 }, { name: 'idx_locanalytics_popularityScore_idx' });
LocationAnalyticsSchema.index({ isHotZone: 1, popularityScore: -1 }, { name: 'idx_locanalytics_hotzone_popularity_idx' });
LocationAnalyticsSchema.index({ popularityScore: -1, lastUpdated: -1 }, { name: 'idx_locanalytics_popularity_freshness_idx' });
const modelName = 'LocationAnalytics';
const connection = (0, db_1.getAdminConnection)();
const LocationAnalytics = connection.models[modelName] ||
    connection.model(modelName, LocationAnalyticsSchema);
exports.default = LocationAnalytics;
//# sourceMappingURL=LocationAnalytics.js.map