"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const AdminLogSchema = new mongoose_1.Schema({
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin', required: false },
    action: { type: String, required: true },
    targetType: { type: String, enum: ['User', 'Ad', 'Plan', 'Business', 'System', 'Category', 'Brand', 'Model', 'Service', 'SparePart', 'Location', 'ModerationRule', 'Config', 'Notification', 'ScheduledNotification', 'Report', 'Contact', 'Transaction', 'Invoice', 'ServiceType', 'ScreenSize', 'Admin', 'Keyword', 'Geofence', 'ApiKey'], required: true },
    targetId: { type: mongoose_1.Schema.Types.Mixed }, // Can be ObjectId or string ID
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
// TTL Index: Auto-delete logs after 1 year (365 days)
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
AdminLogSchema.index({ adminId: 1 }, { name: 'idx_adminlog_adminId_idx' });
AdminLogSchema.index({ action: 1 }, { name: 'idx_adminlog_action_idx' });
AdminLogSchema.index({ targetId: 1 }, { name: 'idx_adminlog_targetId_idx' });
AdminLogSchema.index({ createdAt: 1 }, { name: 'idx_adminlog_createdAt_ttl_idx', expireAfterSeconds: 31536000 });
// 🔒 IMMUTABILITY ENFORCEMENT
// Prevent document-level modifications
AdminLogSchema.pre('save', function () {
    if (!this.isNew) {
        throw new Error('AdminLog entries are strictly append-only and immutable.');
    }
});
// Prevent query-level modifications and deletions
AdminLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove'], function () {
    throw new Error('AdminLog entries are strictly append-only. Updates and deletions are blocked by middleware.');
});
// Ensure model compilation hygiene
const connection = (0, db_1.getAdminConnection)();
const AdminLog = connection.models.AdminLog ||
    connection.model('AdminLog', AdminLogSchema);
(0, schemaOptions_1.applyToJSONTransform)(AdminLogSchema);
exports.default = AdminLog;
//# sourceMappingURL=AdminLog.js.map