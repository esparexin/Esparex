"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const IdempotencyRequestSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    scope: { type: String, required: true },
    key: { type: String, required: true },
    requestHash: { type: String, required: true },
    status: { type: String, enum: ['processing', 'completed'], required: true, default: 'processing' },
    responseStatus: { type: Number },
    responseBody: { type: mongoose_1.Schema.Types.Mixed },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
IdempotencyRequestSchema.index({ userId: 1, scope: 1, key: 1 }, { name: 'idx_idempotencyrequest_user_scope_key_unique_idx', unique: true });
IdempotencyRequestSchema.index({ expiresAt: 1 }, { name: 'idx_idempotencyrequest_expiresAt_ttl_idx', expireAfterSeconds: 0 });
const connection = (0, db_1.getUserConnection)();
const IdempotencyRequest = connection.models.IdempotencyRequest ||
    connection.model('IdempotencyRequest', IdempotencyRequestSchema);
exports.default = IdempotencyRequest;
//# sourceMappingURL=IdempotencyRequest.js.map