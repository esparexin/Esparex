"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const ApiKeySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    keyHash: { type: String, required: true },
    keyPrefix: { type: String, required: true },
    scopes: [{ type: String }],
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin', required: true },
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
ApiKeySchema.index({ keyHash: 1 }, { name: 'idx_apikey_keyHash_unique_idx', unique: true });
ApiKeySchema.index({ keyPrefix: 1 }, { name: 'idx_apikey_keyPrefix_idx' });
ApiKeySchema.index({ status: 1 }, { name: 'idx_apikey_status_idx' });
ApiKeySchema.index({ createdBy: 1 }, { name: 'idx_apikey_createdBy_idx' });
ApiKeySchema.index({ status: 1, createdAt: -1 }, { name: 'idx_apikey_status_createdAt_idx' });
ApiKeySchema.index({ keyPrefix: 1, status: 1 }, { name: 'idx_apikey_prefix_status_idx' });
(0, schemaOptions_1.applyToJSONTransform)(ApiKeySchema);
const connection = (0, db_1.getAdminConnection)();
const ApiKey = connection.models.ApiKey ||
    connection.model('ApiKey', ApiKeySchema);
exports.default = ApiKey;
//# sourceMappingURL=ApiKey.js.map