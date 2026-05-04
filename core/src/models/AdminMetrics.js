"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminMetrics = void 0;
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const AdminMetricsSchema = new mongoose_1.Schema({
    metricModule: { type: String, required: true },
    aggregationDate: { type: Date, required: true },
    payload: { type: mongoose_1.Schema.Types.Mixed, required: true }
}, {
    timestamps: true
});
// Compound index for fast retrieval of the latest metrics per module
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
AdminMetricsSchema.index({ metricModule: 1 }, { name: 'idx_adminmetrics_module_idx' });
AdminMetricsSchema.index({ aggregationDate: 1 }, { name: 'idx_adminmetrics_date_idx' });
AdminMetricsSchema.index({ metricModule: 1, aggregationDate: -1 }, { name: 'idx_adminmetrics_module_date_idx' });
exports.AdminMetrics = (0, db_1.getAdminConnection)().model('AdminMetrics', AdminMetricsSchema);
exports.default = exports.AdminMetrics;
//# sourceMappingURL=AdminMetrics.js.map