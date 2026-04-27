"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const JobLogSchema = new mongoose_1.Schema({
    jobName: { type: String, required: true },
    status: { type: String, enum: ['started', 'success', 'failed'], required: true },
    result: { type: mongoose_1.Schema.Types.Mixed },
    error: { type: String },
    durationMs: { type: Number },
    triggeredBy: { type: String, default: 'cron' },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date }
}, {
    expireAfterSeconds: 60 * 60 * 24 * 30 // Auto-delete logs after 30 days
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
JobLogSchema.index({ jobName: 1 }, { name: 'idx_joblog_name_idx' });
JobLogSchema.index({ status: 1 }, { name: 'idx_joblog_status_idx' });
JobLogSchema.index({ startedAt: -1 }, { name: 'idx_joblog_startedAt_idx' });
(0, schemaOptions_1.applyToJSONTransform)(JobLogSchema);
exports.default = (0, db_1.getAdminConnection)().models.JobLog || (0, db_1.getAdminConnection)().model('JobLog', JobLogSchema);
//# sourceMappingURL=JobLog.js.map