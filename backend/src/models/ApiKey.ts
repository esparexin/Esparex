import mongoose, { Schema, Document, Model } from 'mongoose';
import { getAdminConnection } from '../config/db';

export interface IApiKey extends Document {
    name: string;
    keyHash: string;
    keyPrefix: string;
    scopes: string[];
    status: 'active' | 'revoked';
    createdBy: mongoose.Types.ObjectId;
    revokedAt?: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
    name: { type: String, required: true, trim: true },
    keyHash: { type: String, required: true },
    keyPrefix: { type: String, required: true },
    scopes: [{ type: String }],
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    revokedAt: { type: Date },
    expiresAt: { type: Date },
    lastUsedAt: { type: Date }
}, {
    timestamps: true,
    collection: 'api_keys'
});

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

ApiKeySchema.index({ keyHash: 1 }, { name: 'apikey_keyHash_unique_idx', unique: true });
ApiKeySchema.index({ keyPrefix: 1 }, { name: 'apikey_keyPrefix_idx' });
ApiKeySchema.index({ status: 1 }, { name: 'apikey_status_idx' });
ApiKeySchema.index({ createdBy: 1 }, { name: 'apikey_createdBy_idx' });
ApiKeySchema.index({ status: 1, createdAt: -1 }, { name: 'apikey_status_createdAt_idx' });
ApiKeySchema.index({ keyPrefix: 1, status: 1 }, { name: 'apikey_prefix_status_idx' });

ApiKeySchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as Record<string, unknown>;
        const rawId = json._id;
        if (typeof rawId === 'string' || (rawId && typeof (rawId as { toString?: () => string }).toString === 'function')) {
            json.id = rawId.toString();
        }
        delete json._id;
        delete json.keyHash;
        return json;
    }
});

const connection = getAdminConnection();
const ApiKey: Model<IApiKey> =
    (connection.models.ApiKey as Model<IApiKey>) ||
    connection.model<IApiKey>('ApiKey', ApiKeySchema);

export default ApiKey;
