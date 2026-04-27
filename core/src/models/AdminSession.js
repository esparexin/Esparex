"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashAdminSessionToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const AdminSessionSchema = new mongoose_1.Schema({
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin', required: true },
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
(0, schemaOptions_1.applyToJSONTransform)(AdminSessionSchema);
const hashAdminSessionToken = (token) => crypto_1.default.createHash('sha256').update(token).digest('hex');
exports.hashAdminSessionToken = hashAdminSessionToken;
const connection = (0, db_1.getAdminConnection)();
const AdminSession = connection.models.AdminSession ||
    connection.model('AdminSession', AdminSessionSchema);
exports.default = AdminSession;
//# sourceMappingURL=AdminSession.js.map