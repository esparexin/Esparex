import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationLog extends Document {
    title: string;
    body: string;
    type: string;
    targetType: 'all' | 'users' | 'topic';
    targetValue?: string; // Topic name or description
    userIds?: mongoose.Types.ObjectId[];
    sentBy: mongoose.Types.ObjectId;
    successCount: number;
    failureCount: number;
    status: 'sent' | 'failed' | 'scheduled';
    createdAt: Date;
}

const NotificationLogSchema: Schema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, default: 'info' },
    targetType: { type: String, enum: ['all', 'users', 'topic'], required: true },
    targetValue: { type: String },
    userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sentBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    status: { type: String, enum: ['sent', 'failed', 'scheduled'], default: 'sent' },
    createdAt: { type: Date, default: Date.now },
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

NotificationLogSchema.index({ sentBy: 1, createdAt: -1 }, { name: 'notiflog_sender_freshness_idx' });

import { getAdminConnection } from '../config/db';
// toJSON Transform - Convert _id to id
NotificationLogSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
        const json = ret as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

export default getAdminConnection().models.NotificationLog || getAdminConnection().model<INotificationLog>('NotificationLog', NotificationLogSchema);
