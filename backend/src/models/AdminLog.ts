import mongoose, { Schema, Document, Model } from 'mongoose';
import { getAdminConnection } from '../config/db';

export interface IAdminLog extends Document {
    adminId: mongoose.Types.ObjectId;
    action: string;
    targetType: string;
    targetId?: mongoose.Types.ObjectId | string;
    metadata?: unknown;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const AdminLogSchema = new Schema<IAdminLog>({
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    action: { type: String, required: true },
    targetType: { type: String, enum: ['User', 'Ad', 'Plan', 'Business', 'System', 'Category', 'Brand', 'Model', 'Service', 'SparePart', 'Location', 'ModerationRule', 'Config', 'Notification', 'ScheduledNotification', 'Report', 'Contact', 'Transaction', 'Invoice', 'ServiceType', 'ScreenSize', 'Admin', 'Keyword', 'Geofence', 'ApiKey'], required: true },
    targetId: { type: Schema.Types.Mixed }, // Can be ObjectId or string ID
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

// TTL Index: Auto-delete logs after 1 year (365 days)
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

AdminLogSchema.index({ adminId: 1 }, { name: 'adminlog_adminId_idx' });
AdminLogSchema.index({ action: 1 }, { name: 'adminlog_action_idx' });
AdminLogSchema.index({ targetId: 1 }, { name: 'adminlog_targetId_idx' });
AdminLogSchema.index({ createdAt: 1 }, { name: 'adminlog_createdAt_ttl_idx', expireAfterSeconds: 31536000 });

// 🔒 IMMUTABILITY ENFORCEMENT
// Prevent document-level modifications
AdminLogSchema.pre('save', async function () {
    if (!this.isNew) {
        throw new Error('AdminLog entries are strictly append-only and immutable.');
    }
});

// Prevent query-level modifications and deletions
AdminLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove'] as any, async function () {
    throw new Error('AdminLog entries are strictly append-only. Updates and deletions are blocked by middleware.');
});

// Ensure model compilation hygiene
const connection = getAdminConnection();
const AdminLog: Model<IAdminLog> =
    (connection.models.AdminLog as Model<IAdminLog>) ||
    connection.model<IAdminLog>('AdminLog', AdminLogSchema);

// toJSON Transform - Convert _id to id
AdminLogSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as Record<string, unknown>;
        json.id = String(json._id);
        delete json._id;
        return json;
    }
});

export default AdminLog;
