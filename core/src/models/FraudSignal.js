"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const FraudSignalSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    ip: { type: String, required: true },
    deviceFingerprint: { type: String },
    adId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Ad' },
    signalType: { type: String, required: true },
    score: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: '90d' } // Auto-cleanup after 90 days
});
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
FraudSignalSchema.index({ ip: 1 }, { name: 'idx_fraudsignal_ip_idx' });
FraudSignalSchema.index({ userId: 1 }, { name: 'idx_fraudsignal_userId_idx' });
FraudSignalSchema.index({ deviceFingerprint: 1 }, { name: 'idx_fraudsignal_deviceFingerprint_idx' });
FraudSignalSchema.index({ adId: 1 }, { name: 'idx_fraudsignal_adId_idx' });
FraudSignalSchema.index({ createdAt: 1 }, { name: 'idx_fraudsignal_ttl_idx' }); // Existing expires
const userConnection = (0, db_1.getUserConnection)();
const FraudSignal = userConnection.models.FraudSignal ||
    userConnection.model('FraudSignal', FraudSignalSchema);
exports.default = FraudSignal;
//# sourceMappingURL=FraudSignal.js.map