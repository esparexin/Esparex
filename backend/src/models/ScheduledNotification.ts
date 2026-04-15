import mongoose, { Schema, Model } from 'mongoose';
import { NOTIFICATION_BASE_FIELDS } from './NotificationLog';
import { getAdminConnection } from '../config/db';

export interface IScheduledNotification extends mongoose.Document {
    title: string;
    body: string;
    type: string;
    targetType: 'all' | 'users' | 'topic';
    targetValue?: string;
    userIds?: mongoose.Types.ObjectId[];
    actionUrl?: string;
    sentBy: mongoose.Types.ObjectId;
    sendAt: Date;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    createdAt: Date;
}

const ScheduledNotificationSchema = new Schema<IScheduledNotification>({
    ...NOTIFICATION_BASE_FIELDS,
    sentBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
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
            const json = ret as Record<string, unknown>;
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

const connection = getAdminConnection();
const ScheduledNotification: Model<IScheduledNotification> =
    (connection.models.ScheduledNotification as Model<IScheduledNotification>) ||
    connection.model<IScheduledNotification>('ScheduledNotification', ScheduledNotificationSchema);

export default ScheduledNotification;
