"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueAnalytics = void 0;
// core/src/models/RevenueAnalytics.ts
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const RevenueAnalyticsSchema = new mongoose_1.Schema({
    date: { type: String }, // YYYY-MM-DD
    totalRevenue: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    breakdown: {
        AD_PACK: {
            revenue: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },
        SPOTLIGHT: {
            revenue: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },
        SMART_ALERT: {
            revenue: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },
    },
    categoryBreakdown: {
        type: Map,
        of: new mongoose_1.Schema({
            revenue: { type: Number, default: 0 },
            count: { type: Number, default: 0 }
        }, { _id: false }),
        default: {}
    }
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
RevenueAnalyticsSchema.index({ date: 1 }, { name: 'idx_revenueanalytics_date_unique_idx', unique: true });
const connection = (0, db_1.getAdminConnection)();
exports.RevenueAnalytics = connection.models.RevenueAnalytics ||
    connection.model("RevenueAnalytics", RevenueAnalyticsSchema);
(0, schemaOptions_1.applyToJSONTransform)(RevenueAnalyticsSchema);
exports.default = exports.RevenueAnalytics;
//# sourceMappingURL=RevenueAnalytics.js.map