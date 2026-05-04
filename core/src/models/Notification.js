"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const notificationType_1 = require("@core/constants/enums/notificationType");
const NotificationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: notificationType_1.NOTIFICATION_TYPE_VALUES,
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: mongoose_1.Schema.Types.Mixed }, // Store related IDs or metadata
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    actionUrl: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    channels: [{ type: String, enum: ['push', 'email', 'sms', 'in-app'] }],
    dedupKey: { type: String }, // Made compound unique per user below
    deliveryStatus: { type: mongoose_1.Schema.Types.Mixed }, // Map of channels to status
    retryCount: { type: Number, default: 0 },
    sourceEventId: { type: String },
    version: { type: Number, default: 1 },
    entityRef: {
        domain: String,
        id: String
    }
}, {
    timestamps: true
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 }, { name: 'idx_notification_user_read_freshness_idx' });
NotificationSchema.index({ isRead: 1, readAt: 1 }, { name: 'idx_notification_read_retention_idx' });
NotificationSchema.index({ userId: 1, dedupKey: 1 }, { unique: true, partialFilterExpression: { dedupKey: { $exists: true } }, name: 'idx_notification_dedup_idempotency_idx' });
NotificationSchema.index({ createdAt: 1 }, { name: 'idx_notification_createdAt_ttl_idx', expireAfterSeconds: 7776000 }); // 90 days
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
(0, schemaOptions_1.applyToJSONTransform)(NotificationSchema);
const modelName = 'Notification';
const connection = (0, db_1.getUserConnection)();
const Notification = connection.models[modelName] ||
    connection.model(modelName, NotificationSchema);
exports.default = Notification;
//# sourceMappingURL=Notification.js.map