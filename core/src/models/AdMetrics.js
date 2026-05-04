"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdMetrics = void 0;
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const AdMetricsSchema = new mongoose_1.Schema({
    adId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad', required: true, unique: true },
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
exports.AdMetrics = (0, db_1.getUserConnection)().models.AdMetrics || (0, db_1.getUserConnection)().model('AdMetrics', AdMetricsSchema);
exports.default = exports.AdMetrics;
//# sourceMappingURL=AdMetrics.js.map