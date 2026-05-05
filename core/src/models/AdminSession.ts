import crypto from 'crypto';
import { Schema, Document, Model, Types } from 'mongoose';
import { getAdminConnection } from '../config/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface IAdminSession extends Document {
    adminId: Types.ObjectId;
    tokenHash: string;
    tokenId?: string;
    ip?: string;
    device?: string;
    expiresAt: Date;
    revokedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AdminSessionSchema = new Schema<IAdminSession>({
    adminId: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    tokenHash: { type: String, required: true },
    tokenId: { type: String },
    ip: { type: String },
    device: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date }
}, {
    timestamps: true,
    collection: 'admin_sessions'
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

AdminSessionSchema.index({ adminId: 1 }, { name: 'idx_adminsession_adminId_idx' });
AdminSessionSchema.index({ tokenHash: 1 }, { name: 'idx_adminsession_tokenHash_unique_idx', unique: true });
AdminSessionSchema.index({ tokenId: 1 }, { name: 'idx_adminsession_tokenId_idx' });
// TTL index handles both expiry and lookup
AdminSessionSchema.index({ expiresAt: 1 }, { name: 'idx_adminsession_expiresAt_ttl_idx', expireAfterSeconds: 0 });
AdminSessionSchema.index({ adminId: 1, tokenId: 1, revokedAt: 1 }, { name: 'idx_adminsession_admin_token_revoked_idx' });

applyToJSONTransform(AdminSessionSchema);

export const hashAdminSessionToken = (token: string): string =>
    crypto.createHash('sha256').update(token).digest('hex');

const connection = getAdminConnection();
const AdminSession: Model<IAdminSession> =
    (connection.models.AdminSession as Model<IAdminSession>) ||
    connection.model<IAdminSession>('AdminSession', AdminSessionSchema);

export default AdminSession;
