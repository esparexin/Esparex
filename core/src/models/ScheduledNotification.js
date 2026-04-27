"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const NotificationLog_1 = require("./NotificationLog");
const db_1 = require("@core/config/db");
const ScheduledNotificationSchema = new mongoose_1.Schema({
    ...NotificationLog_1.NOTIFICATION_BASE_FIELDS,
    sentBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin', required: true },
    sendAt: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    toObject: { virtuals: true, versionKey: false },
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (_doc, ret) {
            const json = ret;
            json.id = json._id?.toString();
            delete json._id;
            return json;
        }
    }
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
ScheduledNotificationSchema.index({ status: 1, sendAt: 1 }, { name: 'idx_schedulednotification_status_sendAt_idx' });
ScheduledNotificationSchema.index({ sentBy: 1, createdAt: -1 }, { name: 'idx_schedulednotification_sender_freshness_idx' });
const connection = (0, db_1.getAdminConnection)();
const ScheduledNotification = connection.models.ScheduledNotification ||
    connection.model('ScheduledNotification', ScheduledNotificationSchema);
exports.default = ScheduledNotification;
//# sourceMappingURL=ScheduledNotification.js.map