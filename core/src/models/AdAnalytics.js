"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AdAnalyticsSchema = new mongoose_1.Schema({
    adId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad', required: true },
    views: { type: Number, default: 0, min: 0 },
    favorites: { type: Number, default: 0, min: 0 },
    score: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
AdAnalyticsSchema.index({ adId: 1 }, { name: 'idx_adanalytics_adId_unique_idx', unique: true });
AdAnalyticsSchema.index({ score: -1 }, { name: 'idx_adanalytics_score_idx' });
const db_1 = require("@core/config/db");
const connection = (0, db_1.getAdminConnection)();
const AdAnalytics = connection.models.AdAnalytics ||
    connection.model('AdAnalytics', AdAnalyticsSchema);
exports.default = AdAnalytics;
//# sourceMappingURL=AdAnalytics.js.map