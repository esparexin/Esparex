"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const PhoneRevealLogSchema = new mongoose_1.Schema({
    buyerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    entityId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    entityType: { type: String, enum: ['ad', 'service', 'spare_part'], required: true },
    ipAddress: { type: String },
    device: { type: String },
    revealedAt: { type: Date, default: Date.now, required: true }
}, {
    timestamps: false // We use revealedAt as the primary timestamp
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
PhoneRevealLogSchema.index({ buyerId: 1 }, { name: 'idx_phonereveal_buyerId_idx' });
PhoneRevealLogSchema.index({ sellerId: 1 }, { name: 'idx_phonereveal_sellerId_idx' });
PhoneRevealLogSchema.index({ entityId: 1 }, { name: 'idx_phonereveal_entityId_idx' });
PhoneRevealLogSchema.index({ revealedAt: -1 }, { name: 'idx_phonereveal_revealedAt_idx' });
const modelName = 'PhoneRevealLog';
const connection = (0, db_1.getUserConnection)();
const PhoneRevealLog = connection.models[modelName] ||
    connection.model(modelName, PhoneRevealLogSchema, 'phone_reveal_logs');
exports.default = PhoneRevealLog;
//# sourceMappingURL=PhoneRevealLog.js.map