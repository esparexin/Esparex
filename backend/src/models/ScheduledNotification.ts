import mongoose, { Schema, Document, Model } from 'mongoose';
import { getAdminConnection } from '../config/db';

export interface IScheduledNotification extends Document {
    title: string;
    body: string;
    type: string;
    targetType: 'all' | 'users' | 'topic';
    targetValue?: string;
    userIds?: mongoose.Types.ObjectId[];
    sentBy: mongoose.Types.ObjectId;
    sendAt: Date;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    createdAt: Date;
}

const ScheduledNotificationSchema = new Schema<IScheduledNotification>({
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, default: 'info' },
    targetType: { type: String, enum: ['all', 'users', 'topic'], required: true },
    targetValue: { type: String },
    userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sentBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    sendAt: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

ScheduledNotificationSchema.index({ status: 1, sendAt: 1 }, { name: 'schednotif_status_sendAt_idx' });
ScheduledNotificationSchema.index({ sentBy: 1, createdAt: -1 }, { name: 'schednotif_sender_freshness_idx' });

// toJSON Transform - Convert _id to id
ScheduledNotificationSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as unknown as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

const connection = getAdminConnection();
const ScheduledNotification: Model<IScheduledNotification> =
    (connection.models.ScheduledNotification as Model<IScheduledNotification>) ||
    connection.model<IScheduledNotification>('ScheduledNotification', ScheduledNotificationSchema);

export default ScheduledNotification;
