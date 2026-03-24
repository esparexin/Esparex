import { Schema, Document, Model, Types } from 'mongoose';

export interface INotification extends Document {
    userId: Types.ObjectId;
    type: 'SMART_ALERT' | 'ORDER_UPDATE' | 'AD_STATUS' | 'BUSINESS_STATUS' | 'SYSTEM' | 'PRICE_DROP';
    title: string;
    message: string;
    data?: Record<string, unknown>; // Flexible payload (e.g., adId, orderId)
    isRead: boolean;
    readAt?: Date;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high';
    channels?: string[];
    dedupKey?: string;
    deliveryStatus?: Record<string, 'pending' | 'sent' | 'failed' | 'skipped'>;
    retryCount?: number;
    sourceEventId?: string;
    version?: number;
    entityRef?: { domain: string, id: string };
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['SMART_ALERT', 'ORDER_UPDATE', 'AD_STATUS', 'BUSINESS_STATUS', 'SYSTEM', 'PRICE_DROP'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed }, // Store related IDs or metadata
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    actionUrl: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    channels: [{ type: String, enum: ['push', 'email', 'sms', 'in-app'] }],
    dedupKey: { type: String }, // Made compound unique per user below
    deliveryStatus: { type: Schema.Types.Mixed }, // Map of channels to status
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
NotificationSchema.index({ userId: 1, dedupKey: 1 }, { unique: true, partialFilterExpression: { dedupKey: { $exists: true } }, name: 'idx_notification_dedup_idempotency_idx' });
NotificationSchema.index({ createdAt: 1 }, { name: 'idx_notification_createdAt_ttl_idx', expireAfterSeconds: 7776000 }); // 90 days

import { getUserConnection } from '../config/db';
// toJSON Transform - Convert _id to id
NotificationSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as Record<string, unknown>;
        json.id = String(json._id);
        delete json._id;
        return json;
    }
});

const Notification: Model<INotification> =
    getUserConnection().models.Notification || getUserConnection().model<INotification>('Notification', NotificationSchema);

export default Notification;
