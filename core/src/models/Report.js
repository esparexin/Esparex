"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPORT_TARGET_TYPE_VALUES = void 0;
const mongoose_1 = require("mongoose");
const reportStatus_1 = require("@core/constants/enums/reportStatus");
const reportReason_1 = require("@core/constants/enums/reportReason");
exports.REPORT_TARGET_TYPE_VALUES = ['ad', 'chat', 'user', 'business'];
const ReportSchema = new mongoose_1.Schema({
    targetType: { type: String, enum: exports.REPORT_TARGET_TYPE_VALUES, required: true },
    targetId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    reporterId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    adId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad' },
    adTitle: { type: String },
    reportedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    reason: {
        type: String,
        required: true,
        enum: reportReason_1.REPORT_REASON_VALUES
    },
    description: { type: String },
    additionalDetails: { type: String },
    status: {
        type: String,
        enum: reportStatus_1.REPORT_STATUS_VALUES,
        default: reportStatus_1.REPORT_STATUS.OPEN
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    resolution: { type: String }
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
ReportSchema.index({ status: 1 }, { name: 'idx_report_status_idx' });
ReportSchema.index({ adId: 1 }, { name: 'idx_report_adId_idx' });
ReportSchema.index({ reportedBy: 1 }, { name: 'idx_report_reportedBy_idx' });
ReportSchema.index({ targetType: 1, status: 1, createdAt: -1 }, { name: 'idx_report_targetType_status_createdAt_idx' });
ReportSchema.index({ targetId: 1, targetType: 1, status: 1 }, { name: 'idx_report_targetId_targetType_status_idx' });
ReportSchema.index({ resolvedBy: 1 }, { name: 'idx_report_resolvedBy_idx' });
ReportSchema.index({ status: 1, createdAt: -1 }, { name: 'idx_report_status_freshness_idx' });
ReportSchema.index({ adId: 1, status: 1, createdAt: -1 }, { name: 'idx_report_ad_status_freshness_idx' });
// 🔒 DEDUP CONSTRAINT: one active report per user per ad at DB level.
// Prevents race conditions where concurrent requests bypass the controller findOne check.
ReportSchema.index({ adId: 1, reportedBy: 1 }, {
    name: 'idx_report_adId_reporter_dedup_idx',
    unique: true,
    partialFilterExpression: {
        status: { $in: ['open', 'pending', 'reviewed'] },
        adId: { $exists: true },
        reportedBy: { $exists: true }
    }
});
ReportSchema.index({ targetType: 1, targetId: 1, reporterId: 1 }, {
    name: 'idx_report_target_reporter_dedup_idx',
    unique: true,
    partialFilterExpression: {
        status: { $in: ['open', 'pending', 'reviewed'] },
        targetType: { $exists: true },
        targetId: { $exists: true },
        reporterId: { $exists: true }
    }
});
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
(0, schemaOptions_1.applyToJSONTransform)(ReportSchema);
const Report = (0, db_1.getUserConnection)().models.Report || (0, db_1.getUserConnection)().model('Report', ReportSchema);
exports.default = Report;
//# sourceMappingURL=Report.js.map