"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_BASE_FIELDS = void 0;
const mongoose_1 = require("mongoose");
exports.NOTIFICATION_BASE_FIELDS = {
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, default: 'info' },
    targetType: { type: String, enum: ['all', 'users', 'topic'], required: true },
    targetValue: { type: String },
    userIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    actionUrl: { type: String },
};
const NotificationLogSchema = new mongoose_1.Schema({
    ...exports.NOTIFICATION_BASE_FIELDS,
    sentBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin', required: true },
    successCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    status: { type: String, enum: ['sent', 'failed', 'scheduled'], default: 'sent' },
    createdAt: { type: Date, default: Date.now },
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
NotificationLogSchema.index({ sentBy: 1, createdAt: -1 }, { name: 'idx_notificationlog_sender_freshness_idx' });
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
(0, schemaOptions_1.applyToJSONTransform)(NotificationLogSchema);
const connection = (0, db_1.getAdminConnection)();
const NotificationLog = connection.models.NotificationLog ||
    connection.model('NotificationLog', NotificationLogSchema);
exports.default = NotificationLog;
//# sourceMappingURL=NotificationLog.js.map